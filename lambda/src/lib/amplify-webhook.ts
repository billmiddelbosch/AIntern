/**
 * amplify-webhook.ts
 *
 * Triggers an AWS Amplify build via an incoming webhook. Replaces the
 * git branch-workflow (I-14) for sitemap/llms refreshes: the Amplify build
 * regenerates public/sitemap.xml and public/llms-full.txt from the public
 * S3 indexes (scripts/generate-sitemap.ts / generate-llms-full.ts), so newly
 * published or optimized NewsFlow pages become discoverable without any
 * git write access.
 *
 * NOT a Lambda handler — imported by ContentBuilder and SEOOptimizer.
 *
 * SSM parameter (SecureString, per alias — the URL embeds a secret token):
 *   /aintern/{alias}/amplify/build-webhook-url
 */

import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

const ssm = new SSMClient({})

// TTL prevents a stale URL surviving a webhook rotation in SSM
const CACHE_TTL_MS = 15 * 60 * 1000
let cachedUrl: { alias: string; value: string; expiresAt: number } | null = null

export interface TriggerBuildResult {
  success: boolean
  error?: string
}

async function getWebhookUrl(alias: string): Promise<string | null> {
  if (cachedUrl?.alias === alias && Date.now() < cachedUrl.expiresAt) {
    return cachedUrl.value
  }
  try {
    const res = await ssm.send(
      new GetParameterCommand({
        Name: `/aintern/${alias}/amplify/build-webhook-url`,
        WithDecryption: true,
      }),
    )
    const value = res.Parameter?.Value ?? ''
    if (!value) return null
    cachedUrl = { alias, value, expiresAt: Date.now() + CACHE_TTL_MS }
    return value
  } catch {
    return null
  }
}

/** Only https URLs on the Amplify webhook domain, default port (SSRF guard). */
export function isValidWebhookUrl(raw: string): boolean {
  try {
    const url = new URL(raw)
    return (
      url.protocol === 'https:' &&
      url.port === '' &&
      /^webhooks\.amplify\.[a-z]{2}-[a-z]+-\d\.amazonaws\.com$/.test(url.hostname)
    )
  } catch {
    return false
  }
}

/**
 * POST to the alias's Amplify incoming webhook, starting a build of the
 * connected branch. Non-throwing: callers treat a failure as non-fatal and
 * decide themselves whether to escalate.
 */
export async function triggerAmplifyBuild(alias: string): Promise<TriggerBuildResult> {
  // Defense-in-depth: Lambda alias charset, prevents SSM path injection via the ARN qualifier
  if (!/^[a-zA-Z0-9-_]{1,64}$/.test(alias)) {
    return { success: false, error: 'Invalid alias' }
  }
  const url = await getWebhookUrl(alias)
  if (!url) {
    return {
      success: false,
      error: `SSM parameter /aintern/${alias}/amplify/build-webhook-url missing or unreadable`,
    }
  }
  if (!isValidWebhookUrl(url)) {
    return { success: false, error: 'Webhook URL failed validation (not an Amplify webhook URL)' }
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      return { success: false, error: `Amplify webhook returned HTTP ${res.status}` }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
