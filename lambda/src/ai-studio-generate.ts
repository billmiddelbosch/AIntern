import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import Anthropic from '@anthropic-ai/sdk'
import jwt from 'jsonwebtoken'
import { corsOrigin, respond } from './utils/cors'

const ssm = new SSMClient({ region: 'eu-west-2' })

const jwtSecretCache = new Map<string, string>()
let cachedAnthropicKey: string | null = null

function resolveAlias(context: Context): string {
  const arn = context.invokedFunctionArn
  const alias = arn.split(':').pop() ?? 'dev'
  console.log('[ai-studio-generate] resolveAlias | arn=%s alias=%s', arn, alias)
  return alias
}

async function getSsmParam(name: string): Promise<string> {
  const result = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }))
  const value = result.Parameter?.Value
  if (!value) throw new Error(`SSM param not found: ${name}`)
  return value
}

async function getJwtSecret(alias: string): Promise<string> {
  if (jwtSecretCache.has(alias)) return jwtSecretCache.get(alias)!
  const value = await getSsmParam(`${process.env.JWT_SECRET_SSM_PREFIX ?? '/aintern/jwt-secret'}/${alias}`)
  jwtSecretCache.set(alias, value)
  return value
}

async function getAnthropicKey(): Promise<string> {
  if (cachedAnthropicKey) return cachedAnthropicKey
  const path = process.env.ANTHROPIC_API_KEY_SSM ?? '/aintern/anthropic-api-key'
  cachedAnthropicKey = await getSsmParam(path)
  return cachedAnthropicKey
}

async function requireAuth(event: APIGatewayProxyEvent, alias: string): Promise<void> {
  const authHeader = event.headers['Authorization'] ?? event.headers['authorization'] ?? ''
  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 })
  }
  const secret = await getJwtSecret(alias)
  try {
    jwt.verify(token, secret, { algorithms: ['HS256'] })
  } catch (err: unknown) {
    console.warn('[ai-studio-generate] requireAuth | JWT failed: %s', (err as Error).message)
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 })
  }
}

const SYSTEM_PROMPT = `You are an expert Vue 3 developer. Generate clean, production-quality Vue 3 Single File Components using <script setup> syntax and TypeScript. Use Tailwind CSS for styling. Return ONLY the raw SFC code — no markdown fences, no explanation text. The output must start with <script setup lang="ts"> or <template> and end with the closing tag.`

function buildUserPrompt(templateId: string, userPrompt: string, existingCode?: string): string {
  const templateContext: Record<string, string> = {
    'vue-component': 'Generate a Vue 3 SFC component.',
    'pinia-store': 'Generate a Pinia store using defineStore with Composition API syntax.',
    'composable': 'Generate a Vue 3 composable function (useXxx pattern) exported from a .ts file.',
    'landing-section': 'Generate a Vue 3 SFC landing page section with responsive Tailwind layout.',
    'kennisbank-variant': 'Modify the provided Kennisbank article page view. Available building blocks: KbArticleBackNav, KbArticleSkeleton, KbArticleNotFound, KbArticleMeta (props: category, publishedAt, formattedDate), KbArticleHeader (props: title, excerpt), KbArticleBody (props: sanitizedContent). Keep all script setup logic intact; only change the template structure and/or scoped styles.',
    'blank': 'Generate Vue 3 code as requested.',
  }

  const context = templateContext[templateId] ?? templateContext['blank']
  let prompt = `${context}\n\nUser request: ${userPrompt}`
  if (existingCode?.trim()) {
    prompt += `\n\nExisting code to refine:\n${existingCode}`
  }
  return prompt
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  const alias = resolveAlias(context)
  const requestOrigin = event.headers['origin'] ?? event.headers['Origin']

  if (event.httpMethod === 'OPTIONS') {
    return respond(204, '', alias, requestOrigin)
  }

  try {
    await requireAuth(event, alias)
  } catch (err: unknown) {
    return respond(401, { message: 'Unauthorized' }, alias, requestOrigin)
  }

  if (event.httpMethod !== 'POST') {
    return respond(405, { message: 'Method not allowed' }, alias, requestOrigin)
  }

  let body: { templateId?: string; prompt?: string; existingCode?: string }
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return respond(400, { message: 'Invalid JSON body' }, alias, requestOrigin)
  }

  const { templateId = 'blank', prompt, existingCode } = body

  const VALID_TEMPLATE_IDS = new Set([
    'vue-component', 'pinia-store', 'composable', 'landing-section', 'kennisbank-variant', 'blank',
  ])

  if (!VALID_TEMPLATE_IDS.has(templateId)) {
    return respond(400, { message: 'Invalid templateId' }, alias, requestOrigin)
  }

  if (!prompt?.trim()) {
    return respond(400, { message: 'prompt is required' }, alias, requestOrigin)
  }

  const MAX_PROMPT_LEN = 4000
  const MAX_CODE_LEN = 20000

  if (prompt.length > MAX_PROMPT_LEN) {
    return respond(400, { message: 'prompt exceeds maximum length' }, alias, requestOrigin)
  }
  if (existingCode && existingCode.length > MAX_CODE_LEN) {
    return respond(400, { message: 'existingCode exceeds maximum length' }, alias, requestOrigin)
  }

  try {
    const apiKey = await getAnthropicKey()
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(templateId, prompt, existingCode),
        },
      ],
    })

    const firstBlock = message.content[0]
    const generatedCode =
      firstBlock && firstBlock.type === 'text' ? firstBlock.text.trim() : ''

    console.log(
      '[ai-studio-generate] generated | templateId=%s promptLen=%d codeLen=%d',
      templateId,
      prompt.length,
      generatedCode.length,
    )

    return respond(200, { code: generatedCode }, alias, requestOrigin)
  } catch (err: unknown) {
    console.error('[ai-studio-generate] error:', err)
    return respond(500, { message: 'Generation failed' }, alias, requestOrigin)
  }
}
