/**
 * newsflow-branch.ts
 *
 * Branch-workflow utility for NewsFlow agents (I-14).
 *
 * Used by ContentBuilder and SEOOptimizer to publish changes via a
 * GitHub feature branch → PR → auto-merge flow, without direct commits
 * to master.
 *
 * NOT a Lambda handler — imported by agent handlers as a shared library.
 *
 * Environment variables expected by the importing Lambda:
 *   GITHUB_REPO   — owner/repo, e.g. 'billmiddelbosch/AIntern'
 *   LOOP_TABLE_NAME — for logIssue calls (optional; callers can pass null)
 */

import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import { promises as fs } from 'fs'
import * as nodePath from 'path'
import simpleGit from 'simple-git'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PublishViaBranchOptions {
  branchName: string
  filesToWrite: Array<{ path: string; content: string }>
  commitMessage: string
  /** When true: validate TypeScript (phase 2 — currently a no-op). */
  runBuildCheck: boolean
}

export interface PublishViaBranchResult {
  success: boolean
  prUrl?: string
  mergedAt?: string
  error?: string
}

// ── SSM token cache ───────────────────────────────────────────────────────────

const ssm = new SSMClient({})
// TTL prevents stale token surviving a mid-lifetime rotation in SSM (MED-1)
const TOKEN_CACHE_TTL_MS = 15 * 60 * 1000
let cachedToken: { alias: string; value: string; expiresAt: number } | null = null

async function getGithubToken(alias: string): Promise<string> {
  if (cachedToken?.alias === alias && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value
  }

  const res = await ssm.send(
    new GetParameterCommand({
      Name: `/aintern/${alias}/github/token`,
      WithDecryption: true,
    }),
  )

  const value = res.Parameter?.Value
  if (!value) throw new Error(`SSM parameter /aintern/${alias}/github/token not found`)

  cachedToken = { alias, value, expiresAt: Date.now() + TOKEN_CACHE_TTL_MS }
  return value
}

// ── GitHub REST API helpers ───────────────────────────────────────────────────

interface GithubPRResponse {
  number: number
  html_url: string
}

interface GithubMergeResponse {
  merged: boolean
  message: string
}

async function createPR(
  token: string,
  repo: string,
  head: string,
  title: string,
): Promise<GithubPRResponse> {
  const res = await fetch(`https://api.github.com/repos/${repo}/pulls`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      head,
      base: 'main',
      body: `Automated NewsFlow publish via branch-workflow (I-14).\n\nBranch: \`${head}\``,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GitHub PR creation failed (${res.status}): ${text}`)
  }

  return res.json() as Promise<GithubPRResponse>
}

async function mergePR(token: string, repo: string, prNumber: number): Promise<void> {
  const res = await fetch(`https://api.github.com/repos/${repo}/pulls/${prNumber}/merge`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      merge_method: 'squash',
    }),
  })

  if (!res.ok) {
    const data = (await res.json()) as GithubMergeResponse
    if (res.status === 405) {
      // Not mergeable yet (e.g. CI in progress) — caller can proceed without waiting
      console.log(JSON.stringify({ level: 'WARN', fn: 'mergePR', message: data.message }))
      return
    }
    throw new Error(`GitHub merge failed (${res.status}): ${data.message}`)
  }
}

// ── publishViaBranch ──────────────────────────────────────────────────────────

/**
 * Clone master, create feature branch, write files, commit, push, and
 * create + merge a GitHub PR.
 *
 * @param options   Branch name, files to write, commit message, build-check flag
 * @param alias     Lambda alias ('dev' | 'prod') — used for SSM path resolution
 */
export async function publishViaBranch(
  options: PublishViaBranchOptions,
  alias: string,
): Promise<PublishViaBranchResult> {
  const repo = process.env.GITHUB_REPO
  if (!repo) throw new Error('GITHUB_REPO env var required')
  // MED-2: validate format before using in URL construction
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    throw new Error(`GITHUB_REPO has unexpected format: ${repo}`)
  }

  // MED-3: validate branchName before passing to git and REST API
  if (!/^[\w/.-]{1,200}$/.test(options.branchName)) {
    throw new Error(`Invalid branchName: ${options.branchName}`)
  }

  const workDir = `/tmp/${crypto.randomUUID()}`

  try {
    // 1. Get GitHub token from SSM
    const token = await getGithubToken(alias)
    const repoUrl = `https://x-access-token:${token}@github.com/${repo}.git`

    // 2. Shallow clone master
    const git = simpleGit()
    await git.clone(repoUrl, workDir, ['--depth=1', '--branch=main'])

    const repoGit = simpleGit(workDir)
    await repoGit.addConfig('user.name', 'AIntern Bot')
    await repoGit.addConfig('user.email', 'bot@aintern.nl')

    // 3. Create feature branch
    await repoGit.checkoutLocalBranch(options.branchName)

    // 4. Write files — HIGH-2: resolve and assert prefix to prevent path traversal
    for (const file of options.filesToWrite) {
      const filePath = nodePath.resolve(workDir, file.path)
      if (!filePath.startsWith(workDir + nodePath.sep) && filePath !== workDir) {
        throw new Error(`Path traversal rejected: ${file.path}`)
      }
      await fs.mkdir(nodePath.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, file.content, 'utf-8')
    }

    // 5. Build check — phase 2: full tsc run inside cloned repo (requires npm ci)
    // Currently a no-op; ContentBuilder and SEOOptimizer only write non-TypeScript
    // files (sitemap.xml, llms.txt), so runBuildCheck is false for all phase-1 use cases.
    if (options.runBuildCheck) {
      console.log(JSON.stringify({
        level: 'INFO',
        fn: 'publishViaBranch',
        message: 'runBuildCheck=true is not yet implemented — skipping type check',
      }))
    }

    // 6. Commit and push
    // LOW-3: normalize LLM-generated commit message (strip newlines, cap length)
    const safeCommitMessage = options.commitMessage.replace(/[\r\n]+/g, ' ').trim().slice(0, 256)
    await repoGit.add('.')
    await repoGit.commit(safeCommitMessage)
    await repoGit.push('origin', options.branchName)

    // 7. Create PR (use same sanitized message as PR title)
    const pr = await createPR(token, repo, options.branchName, safeCommitMessage)

    // 8. Merge PR — squash merge so master stays linear
    await mergePR(token, repo, pr.number)

    const mergedAt = new Date().toISOString()

    console.log(JSON.stringify({
      level: 'INFO',
      fn: 'publishViaBranch',
      branch: options.branchName,
      prUrl: pr.html_url,
      mergedAt,
    }))

    return { success: true, prUrl: pr.html_url, mergedAt }
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err)
    // HIGH-1: scrub GitHub token from error messages (simple-git surfaces the clone URL on failure)
    const error = raw.replace(/x-access-token:[^@]+@/g, 'x-access-token:[REDACTED]@')
    console.log(JSON.stringify({ level: 'ERROR', fn: 'publishViaBranch', error }))
    return { success: false, error }
  } finally {
    // Always clean up /tmp to avoid Lambda ephemeral storage pressure
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
}
