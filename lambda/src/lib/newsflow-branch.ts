/**
 * newsflow-branch.ts
 *
 * Branch-workflow utility for NewsFlow agents (I-14).
 *
 * Used by ContentBuilder and SEOOptimizer to publish changes via a
 * GitHub feature branch → PR → auto-merge flow, without direct commits
 * to main. Uses the GitHub Git Data API (pure REST) — no git binary required.
 *
 * NOT a Lambda handler — imported by agent handlers as a shared library.
 *
 * Environment variables expected by the importing Lambda:
 *   GITHUB_REPO   — owner/repo, e.g. 'billmiddelbosch/AIntern'
 */

import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

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

// ── GitHub Git Data API helpers ───────────────────────────────────────────────

function ghHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

interface GithubPRResponse {
  number: number
  html_url: string
}

interface GithubMergeResponse {
  merged: boolean
  message: string
}

async function getMainRef(
  token: string,
  repo: string,
): Promise<{ commitSha: string; treeSha: string }> {
  const refRes = await fetch(`https://api.github.com/repos/${repo}/git/ref/heads/main`, {
    headers: ghHeaders(token),
  })
  if (!refRes.ok) throw new Error(`Get main ref failed (${refRes.status}): ${await refRes.text()}`)
  const refData = (await refRes.json()) as { object: { sha: string } }
  const commitSha = refData.object.sha

  const commitRes = await fetch(
    `https://api.github.com/repos/${repo}/git/commits/${commitSha}`,
    { headers: ghHeaders(token) },
  )
  if (!commitRes.ok)
    throw new Error(`Get commit failed (${commitRes.status}): ${await commitRes.text()}`)
  const commitData = (await commitRes.json()) as { tree: { sha: string } }

  return { commitSha, treeSha: commitData.tree.sha }
}

async function createBlob(token: string, repo: string, content: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${repo}/git/blobs`, {
    method: 'POST',
    headers: ghHeaders(token),
    body: JSON.stringify({ content: Buffer.from(content).toString('base64'), encoding: 'base64' }),
  })
  if (!res.ok) throw new Error(`Create blob failed (${res.status}): ${await res.text()}`)
  return ((await res.json()) as { sha: string }).sha
}

async function createTree(
  token: string,
  repo: string,
  baseTreeSha: string,
  files: Array<{ path: string; blobSha: string }>,
): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
    method: 'POST',
    headers: ghHeaders(token),
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: files.map((f) => ({ path: f.path, mode: '100644', type: 'blob', sha: f.blobSha })),
    }),
  })
  if (!res.ok) throw new Error(`Create tree failed (${res.status}): ${await res.text()}`)
  return ((await res.json()) as { sha: string }).sha
}

async function createCommit(
  token: string,
  repo: string,
  message: string,
  treeSha: string,
  parentSha: string,
): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
    method: 'POST',
    headers: ghHeaders(token),
    body: JSON.stringify({
      message,
      tree: treeSha,
      parents: [parentSha],
      author: { name: 'AIntern Bot', email: 'bot@aintern.nl' },
    }),
  })
  if (!res.ok) throw new Error(`Create commit failed (${res.status}): ${await res.text()}`)
  return ((await res.json()) as { sha: string }).sha
}

async function createBranchRef(
  token: string,
  repo: string,
  branchName: string,
  commitSha: string,
): Promise<void> {
  const res = await fetch(`https://api.github.com/repos/${repo}/git/refs`, {
    method: 'POST',
    headers: ghHeaders(token),
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: commitSha }),
  })
  if (!res.ok) throw new Error(`Create branch ref failed (${res.status}): ${await res.text()}`)
}

async function createPR(
  token: string,
  repo: string,
  head: string,
  title: string,
): Promise<GithubPRResponse> {
  const res = await fetch(`https://api.github.com/repos/${repo}/pulls`, {
    method: 'POST',
    headers: ghHeaders(token),
    body: JSON.stringify({
      title,
      head,
      base: 'main',
      body: `Automated NewsFlow publish via branch-workflow (I-14).\n\nBranch: \`${head}\``,
    }),
  })
  if (!res.ok) throw new Error(`GitHub PR creation failed (${res.status}): ${await res.text()}`)
  return res.json() as Promise<GithubPRResponse>
}

async function mergePR(token: string, repo: string, prNumber: number): Promise<void> {
  const res = await fetch(`https://api.github.com/repos/${repo}/pulls/${prNumber}/merge`, {
    method: 'PUT',
    headers: ghHeaders(token),
    body: JSON.stringify({ merge_method: 'squash' }),
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
 * Create a feature branch via the GitHub Git Data API, write files as blobs,
 * commit, open a PR, and squash-merge it — no git binary required.
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
  // MED-3: validate branchName before passing to REST API
  if (!/^[\w/.-]{1,200}$/.test(options.branchName)) {
    throw new Error(`Invalid branchName: ${options.branchName}`)
  }

  try {
    const token = await getGithubToken(alias)

    // LOW-3: normalize LLM-generated commit message (strip newlines, cap length)
    const safeCommitMessage = options.commitMessage.replace(/[\r\n]+/g, ' ').trim().slice(0, 256)

    // 1. Get main branch's latest commit SHA + tree SHA
    const { commitSha, treeSha } = await getMainRef(token, repo)

    // 2. Create blobs for each file
    const blobs = await Promise.all(
      options.filesToWrite.map(async (f) => ({
        path: f.path,
        blobSha: await createBlob(token, repo, f.content),
      })),
    )

    // 3. Create a new tree on top of main's tree
    const newTreeSha = await createTree(token, repo, treeSha, blobs)

    // 4. Create a commit pointing at the new tree
    const newCommitSha = await createCommit(token, repo, safeCommitMessage, newTreeSha, commitSha)

    // 5. Create the feature branch ref
    await createBranchRef(token, repo, options.branchName, newCommitSha)

    // 6. runBuildCheck is a no-op for phase 1 (non-TypeScript files only)
    if (options.runBuildCheck) {
      console.log(
        JSON.stringify({
          level: 'INFO',
          fn: 'publishViaBranch',
          message: 'runBuildCheck=true is not yet implemented — skipping type check',
        }),
      )
    }

    // 7. Open PR
    const pr = await createPR(token, repo, options.branchName, safeCommitMessage)

    // 8. Squash-merge so main stays linear
    await mergePR(token, repo, pr.number)

    const mergedAt = new Date().toISOString()
    console.log(
      JSON.stringify({
        level: 'INFO',
        fn: 'publishViaBranch',
        branch: options.branchName,
        prUrl: pr.html_url,
        mergedAt,
      }),
    )

    return { success: true, prUrl: pr.html_url, mergedAt }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.log(JSON.stringify({ level: 'ERROR', fn: 'publishViaBranch', error }))
    return { success: false, error }
  }
}
