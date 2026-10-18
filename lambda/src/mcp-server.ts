/**
 * mcp-server.ts
 *
 * Public, stateless MCP (Model Context Protocol) server for AIntern.
 * Exposed as POST /mcp on the admin API Gateway (no JWT — public content only).
 * Lets AI assistants (Claude, ChatGPT, MCP Inspector, …) search and read the
 * Q&A content of the Kennisbank and NewsFlow pages.
 *
 * Also exposes GET|POST /ask on the same Lambda (routed via event.resource) —
 * an NLWeb-protocol-compatible REST search endpoint for AI clients and
 * NLWeb-aware crawlers that don't want full MCP JSON-RPC. `list` mode only;
 * see the scope-cut comments in the /ask section below.
 *
 * Transport: Streamable HTTP in stateless JSON mode — each POST carries one
 * JSON-RPC message (or a batch array, 2025-03-26 compat) and gets a single
 * application/json response. No SSE, no Mcp-Session-Id (stateless servers
 * must not issue one). GET/DELETE answer 405 per spec.
 *
 * CORS note: this handler intentionally deviates from the corsOrigin() echo
 * pattern in utils/cors.ts. It serves non-browser JSON-RPC/REST clients,
 * carries no cookies/auth, and only exposes data that is already
 * world-readable in public S3 — Access-Control-Allow-Origin: * is correct
 * here for both /mcp and /ask. Reviewed via the CEO gate (see CLAUDE.md,
 * Lambda Conventions).
 *
 * Data: plain HTTPS fetch of the public S3 aggregates (zero IAM):
 *   {KENNISBANK_BASE_URL}/qa.json   — {items:[{question,answer,slug,title,category,publishedAt}]}
 *   {NEWSFLOW_BASE_URL}/qa.json     — {items:[{question,answer,slug,title,publishedAt}]}
 *   {…}/posts/{slug}.json           — full article (get_article)
 */

import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda'
import { randomUUID } from 'crypto'

// ── Config ────────────────────────────────────────────────────────────────────

const KENNISBANK_BASE =
  process.env.KENNISBANK_BASE_URL ?? 'https://aintern-kennisbank.s3.eu-west-2.amazonaws.com'
const NEWSFLOW_BASE =
  process.env.NEWSFLOW_BASE_URL ?? 'https://aintern-newsflow.s3.eu-west-2.amazonaws.com'
const SITE_BASE = 'https://aintern.nl'

const SUPPORTED_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26']
const SERVER_INFO = {
  name: 'aintern-knowledge',
  title: 'AIntern Kennisbank & NewsFlow',
  version: '1.0.0',
}
const SERVER_INSTRUCTIONS =
  "Search AIntern's knowledge base (Kennisbank) and daily SMB news pages (NewsFlow) " +
  'about AI automation for Dutch SMBs (MKB). All content is in Dutch — Dutch queries match best. ' +
  'Use search_answers for questions, get_article for full articles.'

const SLUG_RE = /^[a-z0-9-]{3,80}$/
const MAX_BATCH_SIZE = 20
const SOURCES = ['kennisbank', 'newsflow'] as const
type Source = (typeof SOURCES)[number]

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QaItem {
  question: string
  answer: string
  slug: string
  title: string
  category?: string
  publishedAt: string
  source: Source
  url: string
}

interface JsonRpcRequest {
  jsonrpc?: string
  id?: string | number | null
  method?: string
  params?: Record<string, unknown>
  result?: unknown
  error?: unknown
}

export interface JsonRpcResponse {
  jsonrpc: '2.0'
  id: string | number | null
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

interface ToolResult {
  content: Array<{ type: 'text'; text: string }>
  isError?: boolean
}

interface KennisbankPostJson {
  slug: string
  title: string
  category: string
  publishedAt: string
  excerpt: string
  metaDescription: string
  content: string
  tags?: string[]
  faq?: Array<{ question: string; answer: string }>
}

interface NewsflowPostJson {
  slug: string
  title: string
  metaDescription: string
  lezersvraag: string
  publishedAt: string
  sections?: {
    intro?: string
    context?: string
    mkbRelevantie?: string
    ainternAngle?: string
    bronnen?: Array<{ title: string; url: string }>
  }
  faq?: Array<{ question: string; answer: string }>
}

// ── Q&A cache — module level, 10 min TTL, serve stale on total failure ────────

const QA_CACHE_TTL_MS = 10 * 60 * 1000
let qaCache: { items: QaItem[]; fetchedAt: number } | null = null

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8_000) })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

function articleUrl(source: Source, slug: string): string {
  return `${SITE_BASE}/${source === 'kennisbank' ? 'kennisbank' : 'newsflow'}/${slug}`
}

async function fetchSourceQa(source: Source, baseUrl: string): Promise<QaItem[]> {
  try {
    const raw = (await fetchJson(`${baseUrl}/qa.json`)) as { items?: unknown[] }
    if (!Array.isArray(raw?.items)) return []
    const items: QaItem[] = []
    for (const entry of raw.items) {
      const e = entry as Record<string, unknown>
      const question = typeof e.question === 'string' ? e.question : ''
      const answer = typeof e.answer === 'string' ? e.answer : ''
      const slug = typeof e.slug === 'string' ? e.slug : ''
      if (!question || !answer || !SLUG_RE.test(slug)) continue
      items.push({
        question,
        answer,
        slug,
        title: typeof e.title === 'string' ? e.title : '',
        category: typeof e.category === 'string' ? e.category : undefined,
        publishedAt: typeof e.publishedAt === 'string' ? e.publishedAt : '',
        source,
        url: articleUrl(source, slug),
      })
    }
    return items
  } catch (err) {
    console.log(
      JSON.stringify({
        level: 'WARN',
        fn: 'fetchSourceQa',
        source,
        error: err instanceof Error ? err.message : String(err),
      }),
    )
    return []
  }
}

async function loadQaItems(): Promise<QaItem[]> {
  if (qaCache && Date.now() - qaCache.fetchedAt < QA_CACHE_TTL_MS) return qaCache.items
  const [kennisbank, newsflow] = await Promise.all([
    fetchSourceQa('kennisbank', KENNISBANK_BASE),
    fetchSourceQa('newsflow', NEWSFLOW_BASE),
  ])
  const items = [...kennisbank, ...newsflow]
  if (items.length === 0 && qaCache) return qaCache.items // serve stale over empty
  qaCache = { items, fetchedAt: Date.now() }
  return items
}

// ── Search — Dutch-aware keyword scoring (pure, exported for tests) ──────────

const NL_STOPWORDS = new Set([
  'aan', 'als', 'bij', 'dan', 'dat', 'de', 'die', 'dit', 'een', 'en', 'het',
  'hoe', 'ik', 'in', 'is', 'je', 'kan', 'met', 'mijn', 'naar', 'niet', 'of',
  'om', 'onze', 'ook', 'op', 'over', 'te', 'the', 'tot', 'uit', 'van', 'voor',
  'wat', 'wie', 'wordt', 'zijn',
])

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function tokenize(query: string): string[] {
  return normalize(query)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !NL_STOPWORDS.has(t))
}

export function scoreQaItem(tokens: string[], phrase: string, item: QaItem): number {
  const question = normalize(item.question)
  const title = normalize(item.title)
  const answer = normalize(item.answer)
  let score = 0
  if (phrase.length >= 6 && question.includes(phrase)) score += 4
  for (const token of tokens) {
    if (question.includes(token)) score += 3
    if (title.includes(token)) score += 2
    if (answer.includes(token)) score += 1
  }
  return score
}

export interface ScoredQaItem {
  item: QaItem
  score: number
}

/**
 * Shared filter/score/sort core. Kept separate from searchQa so /ask (NLWeb)
 * can surface a per-hit `score` while search_answers/list_questions keep
 * returning plain QaItem[]. searchQa's signature/behavior is unchanged.
 */
export function searchQaScored(
  items: QaItem[],
  query: string,
  opts: { source?: string; category?: string; limit: number },
): ScoredQaItem[] {
  const tokens = tokenize(query)
  const phrase = normalize(query).trim()
  if (tokens.length === 0 && phrase.length === 0) return []
  return items
    .filter((item) => !opts.source || item.source === opts.source)
    .filter(
      (item) =>
        !opts.category || (item.category && normalize(item.category) === normalize(opts.category)),
    )
    .map((item) => ({ item, score: scoreQaItem(tokens, phrase, item) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || b.item.publishedAt.localeCompare(a.item.publishedAt))
    .slice(0, opts.limit)
}

export function searchQa(
  items: QaItem[],
  query: string,
  opts: { source?: string; category?: string; limit: number },
): QaItem[] {
  return searchQaScored(items, query, opts).map((s) => s.item)
}

// ── Article rendering (pure, exported for tests) ──────────────────────────────

export function htmlToPlainText(html: string): string {
  // Same transform as kennisbank-admin.ts buildLlmsFullContent
  return html
    .replace(/<\/(h[1-6]|p|li|blockquote|br|div|tr)[^>]*>/gi, '\n')
    .replace(/<(br|hr)[^>]*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function renderFaq(faq: Array<{ question: string; answer: string }> | undefined): string {
  if (!faq || faq.length === 0) return ''
  const lines = faq.map((f) => `V: ${f.question}\nA: ${f.answer}`)
  return `\n\n## Veelgestelde vragen\n\n${lines.join('\n\n')}`
}

export function renderKennisbankArticle(post: KennisbankPostJson): string {
  const header = [
    `# ${post.title}`,
    ``,
    `Bron: ${articleUrl('kennisbank', post.slug)}`,
    `Categorie: ${post.category} | Gepubliceerd: ${post.publishedAt}`,
    post.tags?.length ? `Tags: ${post.tags.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n')
  return `${header}\n\n${htmlToPlainText(post.content)}${renderFaq(post.faq)}`
}

export function renderNewsflowArticle(post: NewsflowPostJson): string {
  const s = post.sections ?? {}
  const bronnen = (s.bronnen ?? [])
    .filter((b) => b?.title)
    .map((b) => `- ${b.title}${b.url ? ` (${b.url})` : ''}`)
  const parts = [
    `# ${post.title}`,
    ``,
    `Bron: ${articleUrl('newsflow', post.slug)}`,
    `Lezersvraag: ${post.lezersvraag} | Gepubliceerd: ${post.publishedAt}`,
    ``,
    htmlToPlainText(s.intro ?? ''),
    s.context ? `\n## Context\n\n${htmlToPlainText(s.context)}` : '',
    s.mkbRelevantie ? `\n## Relevantie voor MKB\n\n${htmlToPlainText(s.mkbRelevantie)}` : '',
    s.ainternAngle ? `\n## Hoe AIntern helpt\n\n${htmlToPlainText(s.ainternAngle)}` : '',
  ].filter((p) => p !== '')
  let text = parts.join('\n')
  text += renderFaq(post.faq)
  if (bronnen.length > 0) text += `\n\n## Bronnen\n\n${bronnen.join('\n')}`
  return text
}

// ── Article fetch — small per-article cache ───────────────────────────────────

const ARTICLE_CACHE_TTL_MS = 10 * 60 * 1000
const ARTICLE_CACHE_MAX = 50
const articleCache = new Map<string, { text: string; fetchedAt: number }>()

async function getArticleText(source: Source, slug: string): Promise<string> {
  const cacheKey = `${source}:${slug}`
  const cached = articleCache.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < ARTICLE_CACHE_TTL_MS) return cached.text

  const baseUrl = source === 'kennisbank' ? KENNISBANK_BASE : NEWSFLOW_BASE
  const raw = await fetchJson(`${baseUrl}/posts/${slug}.json`)
  const text =
    source === 'kennisbank'
      ? renderKennisbankArticle(raw as KennisbankPostJson)
      : renderNewsflowArticle(raw as NewsflowPostJson)

  if (articleCache.size >= ARTICLE_CACHE_MAX) {
    const oldest = articleCache.keys().next().value
    if (oldest !== undefined) articleCache.delete(oldest)
  }
  articleCache.set(cacheKey, { text, fetchedAt: Date.now() })
  return text
}

// ── Tools ─────────────────────────────────────────────────────────────────────

const SOURCE_SCHEMA = { type: 'string', enum: [...SOURCES] }

const TOOLS = [
  {
    name: 'search_answers',
    title: 'Search Q&A',
    description:
      'Search the AIntern knowledge base (Kennisbank) and NewsFlow news pages for answers ' +
      'about AI automation for Dutch SMBs. Content is in Dutch — Dutch queries match best. ' +
      'Returns the best-matching question/answer pairs with source URLs.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (Dutch works best)' },
        source: { ...SOURCE_SCHEMA, description: 'Restrict to one content source' },
        category: { type: 'string', description: 'Kennisbank category filter' },
        limit: { type: 'integer', minimum: 1, maximum: 20, default: 5 },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_questions',
    title: 'List questions',
    description:
      'List all questions answered on aintern.nl, optionally filtered by source or category. ' +
      'Use this to browse what the knowledge base covers.',
    inputSchema: {
      type: 'object',
      properties: {
        source: { ...SOURCE_SCHEMA, description: 'Restrict to one content source' },
        category: { type: 'string', description: 'Kennisbank category filter' },
        limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
        offset: { type: 'integer', minimum: 0, default: 0 },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_article',
    title: 'Get full article',
    description:
      'Fetch the full plain-text of one article by source and slug. ' +
      'Slugs come from search_answers or list_questions results.',
    inputSchema: {
      type: 'object',
      properties: {
        source: SOURCE_SCHEMA,
        slug: { type: 'string', pattern: '^[a-z0-9-]{3,80}$' },
      },
      required: ['source', 'slug'],
      additionalProperties: false,
    },
  },
  // ChatGPT connectors require tools named exactly `search` and `fetch`.
  {
    name: 'search',
    title: 'Search (connector alias)',
    description:
      'Search AIntern Q&A content about AI automation for Dutch SMBs (alias of search_answers). ' +
      'Returns results with ids usable by the fetch tool.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'fetch',
    title: 'Fetch document (connector alias)',
    description:
      'Fetch the full text of one document by id ("{source}:{slug}", from search results).',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Document id: {source}:{slug}' } },
      required: ['id'],
      additionalProperties: false,
    },
  },
]

function textResult(text: string): ToolResult {
  return { content: [{ type: 'text', text }] }
}

function errorResult(text: string): ToolResult {
  return { content: [{ type: 'text', text }], isError: true }
}

function formatHit(item: QaItem): string {
  return `Q: ${item.question}\nA: ${item.answer}\nBron: ${item.title} (${item.url}) — ${item.source}, ${item.publishedAt}\nId: ${item.source}:${item.slug}`
}

function parseSource(value: unknown): Source | undefined {
  return SOURCES.includes(value as Source) ? (value as Source) : undefined
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : fallback
  return Math.min(max, Math.max(min, n))
}

class InvalidParamsError extends Error {}

async function toolSearchAnswers(args: Record<string, unknown>): Promise<ToolResult> {
  const query = typeof args.query === 'string' ? args.query.slice(0, 500) : ''
  if (!query.trim()) throw new InvalidParamsError('query is required')
  const items = await loadQaItems()
  const hits = searchQa(items, query, {
    source: parseSource(args.source),
    category: typeof args.category === 'string' ? args.category : undefined,
    limit: clampInt(args.limit, 1, 20, 5),
  })
  if (hits.length === 0) {
    return textResult(
      `Geen resultaten voor "${query}". Probeer een Nederlandse zoekterm of gebruik list_questions om het aanbod te zien.`,
    )
  }
  return textResult(hits.map(formatHit).join('\n\n---\n\n'))
}

async function toolListQuestions(args: Record<string, unknown>): Promise<ToolResult> {
  const source = parseSource(args.source)
  const category = typeof args.category === 'string' ? normalize(args.category) : undefined
  const limit = clampInt(args.limit, 1, 200, 50)
  const offset = clampInt(args.offset, 0, 100_000, 0)

  const items = (await loadQaItems())
    .filter((item) => !source || item.source === source)
    .filter((item) => !category || (item.category && normalize(item.category) === category))

  const page = items.slice(offset, offset + limit)
  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))] as string[]
  const lines = page.map((item, i) => `${offset + i + 1}. [${item.source}] ${item.question} (${item.slug})`)

  const header = [
    `${items.length} vragen beschikbaar${source ? ` in ${source}` : ''} — ${offset + 1}-${offset + page.length} getoond.`,
  ]
  if (categories.length > 0) header.push(`Categorieën: ${categories.join(', ')}`)
  return textResult([...header, '', ...lines].join('\n'))
}

async function toolGetArticle(args: Record<string, unknown>): Promise<ToolResult> {
  const source = parseSource(args.source)
  const slug = typeof args.slug === 'string' ? args.slug : ''
  if (!source) throw new InvalidParamsError(`source must be one of: ${SOURCES.join(', ')}`)
  // SSRF guard — slug is interpolated into the S3 URL
  if (!SLUG_RE.test(slug)) throw new InvalidParamsError('slug must match ^[a-z0-9-]{3,80}$')
  try {
    return textResult(await getArticleText(source, slug))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('HTTP 404') || message.includes('HTTP 403')) {
      return errorResult(`Article not found: ${source}/${slug}`)
    }
    console.log(JSON.stringify({ level: 'ERROR', fn: 'toolGetArticle', source, slug, error: message }))
    return errorResult('Failed to fetch article — try again later.')
  }
}

async function toolFetch(args: Record<string, unknown>): Promise<ToolResult> {
  const id = typeof args.id === 'string' ? args.id : ''
  const [sourceRaw, slug] = id.split(':', 2)
  const source = parseSource(sourceRaw)
  if (!source || !slug) {
    throw new InvalidParamsError('id must have the form {source}:{slug}, e.g. kennisbank:ai-agent-mkb')
  }
  return toolGetArticle({ source, slug })
}

async function callTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  switch (name) {
    case 'search_answers':
      return toolSearchAnswers(args)
    case 'list_questions':
      return toolListQuestions(args)
    case 'get_article':
      return toolGetArticle(args)
    case 'search':
      return toolSearchAnswers({ query: args.query })
    case 'fetch':
      return toolFetch(args)
    default:
      return errorResult(`Unknown tool: ${name}`)
  }
}

// ── JSON-RPC dispatch (exported for tests) ────────────────────────────────────

function rpcError(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message, ...(data !== undefined ? { data } : {}) } }
}

function negotiateVersion(requested: unknown): string {
  if (typeof requested === 'string' && SUPPORTED_PROTOCOL_VERSIONS.includes(requested)) {
    return requested
  }
  return SUPPORTED_PROTOCOL_VERSIONS[0]
}

/** Handle one JSON-RPC message. Returns null for notifications and client responses. */
export async function handleMessage(msg: unknown): Promise<JsonRpcResponse | null> {
  if (typeof msg !== 'object' || msg === null || Array.isArray(msg)) {
    return rpcError(null, -32600, 'Invalid Request')
  }
  const req = msg as JsonRpcRequest
  const hasId = req.id !== undefined && req.id !== null

  // Client-to-server responses (from sampling etc.) — nothing to do, stateless
  if (req.method === undefined) {
    if ('result' in req || 'error' in req) return null
    return rpcError(hasId ? req.id! : null, -32600, 'Invalid Request')
  }
  if (req.jsonrpc !== '2.0' || typeof req.method !== 'string') {
    return rpcError(hasId ? req.id! : null, -32600, 'Invalid Request')
  }

  // Notifications: acknowledge silently
  if (!hasId) return null

  const id = req.id!
  const params = (req.params ?? {}) as Record<string, unknown>

  try {
    switch (req.method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: negotiateVersion(params.protocolVersion),
            capabilities: { tools: { listChanged: false } },
            serverInfo: SERVER_INFO,
            instructions: SERVER_INSTRUCTIONS,
          },
        }
      case 'ping':
        return { jsonrpc: '2.0', id, result: {} }
      case 'tools/list':
        return { jsonrpc: '2.0', id, result: { tools: TOOLS } }
      case 'tools/call': {
        const name = params.name
        if (typeof name !== 'string') return rpcError(id, -32602, 'params.name is required')
        const args =
          typeof params.arguments === 'object' && params.arguments !== null
            ? (params.arguments as Record<string, unknown>)
            : {}
        const result = await callTool(name, args)
        return { jsonrpc: '2.0', id, result }
      }
      default:
        return rpcError(id, -32601, `Method not found: ${req.method}`)
    }
  } catch (err) {
    if (err instanceof InvalidParamsError) return rpcError(id, -32602, err.message)
    const message = err instanceof Error ? err.message : String(err)
    console.log(JSON.stringify({ level: 'ERROR', fn: 'handleMessage', method: req.method, error: message }))
    return rpcError(id, -32603, 'Internal error')
  }
}

// ── /ask (NLWeb protocol) — GET query params or POST JSON body ───────────────
// https://github.com/nlweb-ai/NLWeb — minimal `list`-mode implementation.
// Scope cuts (deliberate, not bugs):
//  - `mode` (list|summarize|generate): only `list` is implemented. Any mode
//    value still returns the list-shaped result — no LLM summarization call.
//  - `streaming`: always ignored, always a single complete JSON response.
//    API Gateway REST + Lambda proxy integration (APIGatewayProxyResult)
//    can't do SSE/chunked streaming — that needs a Function URL with
//    response streaming, a separate infra shape not justified for this
//    endpoint.
//  - `prev` (comma-separated prior queries): accepted but ignored — no
//    LLM-based decontextualization in this pass.

const ASK_DEFAULT_LIMIT = 10

interface AskResult {
  url: string
  name: string
  site: Source
  score: number
  description: string
  schema_object: {
    '@type': 'Question'
    name: string
    text: string
    dateCreated: string
    url: string
    acceptedAnswer: { '@type': 'Answer'; text: string }
  }
}

interface AskResponseBody {
  query_id: string
  results: AskResult[]
}

const ASK_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  // Public JSON REST endpoint for non-browser NLWeb clients — same wildcard
  // CORS policy and CEO-gate rationale as the /mcp JSON-RPC endpoint above
  // (no cookies/auth, read-only public content).
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'none'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

function askResponse(statusCode: number, body: unknown): APIGatewayProxyResult {
  return { statusCode, headers: { ...ASK_HEADERS }, body: JSON.stringify(body) }
}

function parseAskParams(event: APIGatewayProxyEvent): Record<string, unknown> {
  if ((event.httpMethod ?? 'GET').toUpperCase() === 'GET') {
    return { ...(event.queryStringParameters ?? {}) }
  }
  try {
    const body: unknown = JSON.parse(event.body ?? '{}')
    return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function buildAskResult(item: QaItem, score: number): AskResult {
  return {
    url: item.url,
    name: item.question,
    site: item.source,
    score,
    description: item.answer,
    schema_object: {
      '@type': 'Question',
      name: item.question,
      text: item.question,
      dateCreated: item.publishedAt,
      url: item.url,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    },
  }
}

async function handleAsk(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const method = (event.httpMethod ?? 'GET').toUpperCase()
  if (method === 'OPTIONS') return { statusCode: 204, headers: { ...ASK_HEADERS }, body: '' }
  if (method !== 'GET' && method !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...ASK_HEADERS, Allow: 'GET, POST' },
      body: JSON.stringify({ error: 'Method not allowed — use GET or POST' }),
    }
  }

  const params = parseAskParams(event)
  const rawQuery = typeof params.query === 'string' ? params.query : ''
  const decontextualized =
    typeof params.decontextualized_query === 'string' ? params.decontextualized_query : ''
  // Caller already decontextualized — prefer it over `query` when present, no LLM call needed here.
  const query = (decontextualized.trim() || rawQuery).slice(0, 500)

  if (!query.trim()) {
    return askResponse(400, { error: 'query is required' })
  }

  // Invalid/absent `site` values fall back to no source filter — same
  // permissive behavior as search_answers' `source` argument.
  const site = parseSource(params.site)
  // Cap mirrors the `query` cap above — query_id is echoed verbatim into the
  // response body, so an unbounded value would let a caller inflate response
  // size for free (security-reviewer finding, 2026-07-12).
  const queryId =
    typeof params.query_id === 'string' && params.query_id.trim()
      ? params.query_id.slice(0, 200)
      : randomUUID()

  const items = await loadQaItems()
  const hits = searchQaScored(items, query, { source: site, limit: ASK_DEFAULT_LIMIT })

  const responseBody: AskResponseBody = {
    query_id: queryId,
    results: hits.map(({ item, score }) => buildAskResult(item, score)),
  }
  return askResponse(200, responseBody)
}

// ── HTTP handler ──────────────────────────────────────────────────────────────

const BASE_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  // Public JSON-RPC endpoint for non-browser clients — see CORS note in the header comment
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Accept, Authorization, Mcp-Session-Id, MCP-Protocol-Version',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'none'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

function httpResponse(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: { ...BASE_HEADERS },
    body: body === undefined ? '' : JSON.stringify(body),
  }
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  // Same Lambda serves both routes — dispatch on the API Gateway resource,
  // same pattern as admin-auth.ts's event.resource === '/admin/login' check.
  if (event.resource === '/ask') return handleAsk(event)

  const alias = context.invokedFunctionArn.split(':').pop() ?? 'dev'
  const method = event.httpMethod?.toUpperCase() ?? 'POST'

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: { ...BASE_HEADERS }, body: '' }
  }
  if (method !== 'POST') {
    // Stateless server: no SSE stream to offer on GET; DELETE has no session to end
    return {
      statusCode: 405,
      headers: { ...BASE_HEADERS, Allow: 'POST' },
      body: JSON.stringify(rpcError(null, -32000, 'Method not allowed — use POST')),
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(event.body ?? '')
  } catch {
    return httpResponse(400, rpcError(null, -32700, 'Parse error'))
  }

  console.log(
    JSON.stringify({
      level: 'INFO',
      fn: 'handler',
      alias,
      batch: Array.isArray(parsed),
      method: Array.isArray(parsed) ? undefined : (parsed as JsonRpcRequest)?.method,
    }),
  )

  // Batch (JSON-RPC 2.0 / MCP 2025-03-26 compat). Capped and processed
  // sequentially: one 10MB body could otherwise fan out into thousands of
  // concurrent outbound S3 fetches (SEC-HIGH, security review 2026-07-10).
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return httpResponse(400, rpcError(null, -32600, 'Invalid Request'))
    if (parsed.length > MAX_BATCH_SIZE) {
      return httpResponse(
        400,
        rpcError(null, -32600, `Batch too large (max ${MAX_BATCH_SIZE} messages)`),
      )
    }
    const responses: JsonRpcResponse[] = []
    for (const message of parsed) {
      const res = await handleMessage(message)
      if (res !== null) responses.push(res)
    }
    if (responses.length === 0) return httpResponse(202, undefined) // notifications only
    return httpResponse(200, responses)
  }

  const response = await handleMessage(parsed)
  if (response === null) return httpResponse(202, undefined) // notification or client response
  return httpResponse(200, response)
}
