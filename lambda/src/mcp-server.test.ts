/**
 * mcp-server.test.ts
 *
 * Unit tests for the MCP server: search helpers, article rendering,
 * JSON-RPC dispatch and the HTTP handler. S3 fetches are stubbed globally.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Context, APIGatewayProxyEvent } from 'aws-lambda'
import {
  normalize,
  tokenize,
  scoreQaItem,
  searchQa,
  searchQaScored,
  htmlToPlainText,
  renderKennisbankArticle,
  renderNewsflowArticle,
  handleMessage,
  handler,
  type QaItem,
} from './mcp-server'

function qa(overrides: Partial<QaItem>): QaItem {
  return {
    question: 'Wat kost AI-automatisering voor het MKB?',
    answer: 'De kosten hangen af van de workflow, vanaf enkele honderden euro per maand.',
    slug: 'wat-kost-ai-automatisering',
    title: 'Wat kost AI-automatisering?',
    category: 'AI Automatisering',
    publishedAt: '2026-06-01',
    source: 'kennisbank',
    url: 'https://aintern.nl/kennisbank/wat-kost-ai-automatisering',
    ...overrides,
  }
}

const mockContext = {
  invokedFunctionArn: 'arn:aws:lambda:eu-west-2:123:function:aintern-mcp-server:dev',
} as Context

function postEvent(body: unknown, method = 'POST'): APIGatewayProxyEvent {
  return {
    httpMethod: method,
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: {},
  } as unknown as APIGatewayProxyEvent
}

function askGetEvent(query: Record<string, string>): APIGatewayProxyEvent {
  return {
    httpMethod: 'GET',
    resource: '/ask',
    path: '/ask',
    queryStringParameters: query,
    body: null,
    headers: {},
  } as unknown as APIGatewayProxyEvent
}

function askPostEvent(body: unknown): APIGatewayProxyEvent {
  return {
    httpMethod: 'POST',
    resource: '/ask',
    path: '/ask',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: {},
  } as unknown as APIGatewayProxyEvent
}

// ── Search helpers ────────────────────────────────────────────────────────────

describe('normalize', () => {
  it('lowercases and strips diacritics', () => {
    expect(normalize('Efficiëntie én Categorieën')).toBe('efficientie en categorieen')
  })
})

describe('tokenize', () => {
  it('drops Dutch stopwords and short tokens', () => {
    expect(tokenize('Wat kost een AI-agent voor het MKB?')).toEqual(['kost', 'agent', 'mkb'])
  })

  it('returns empty array for stopwords-only input', () => {
    expect(tokenize('wat is de het een')).toEqual([])
  })
})

describe('scoreQaItem / searchQa', () => {
  const items: QaItem[] = [
    qa({}),
    qa({
      question: 'Hoe start ik met een AI-agent?',
      answer: 'Begin met een workflow-scan.',
      slug: 'starten-met-ai-agent',
      title: 'Starten met AI-agents',
      source: 'newsflow',
      category: undefined,
      publishedAt: '2026-07-01',
      url: 'https://aintern.nl/newsflow/starten-met-ai-agent',
    }),
  ]

  it('ranks question matches above answer matches', () => {
    const kostItem = qa({})
    const answerOnly = qa({
      question: 'Iets heel anders',
      title: 'Anders',
      answer: 'kosten kosten kosten',
      slug: 'ander-artikel',
    })
    const tokens = tokenize('wat kost automatisering')
    expect(scoreQaItem(tokens, 'wat kost automatisering', kostItem)).toBeGreaterThan(
      scoreQaItem(tokens, 'wat kost automatisering', answerOnly),
    )
  })

  it('finds items by keyword and respects limit', () => {
    const hits = searchQa(items, 'AI-agent starten', { limit: 1 })
    expect(hits).toHaveLength(1)
    expect(hits[0].slug).toBe('starten-met-ai-agent')
  })

  it('filters by source', () => {
    const hits = searchQa(items, 'AI', { source: 'kennisbank', limit: 10 })
    expect(hits.every((h) => h.source === 'kennisbank')).toBe(true)
  })

  it('filters by category (case/diacritic-insensitive)', () => {
    const hits = searchQa(items, 'kost automatisering', {
      category: 'ai automatisering',
      limit: 10,
    })
    expect(hits).toHaveLength(1)
    expect(hits[0].slug).toBe('wat-kost-ai-automatisering')
  })

  it('returns empty for empty query', () => {
    expect(searchQa(items, '   ', { limit: 5 })).toEqual([])
  })

  it('returns empty when nothing matches', () => {
    expect(searchQa(items, 'blockchain quantum', { limit: 5 })).toEqual([])
  })
})

describe('searchQaScored', () => {
  const items: QaItem[] = [
    qa({}),
    qa({
      question: 'Hoe start ik met een AI-agent?',
      answer: 'Begin met een workflow-scan.',
      slug: 'starten-met-ai-agent',
      title: 'Starten met AI-agents',
      source: 'newsflow',
      category: undefined,
      publishedAt: '2026-07-01',
      url: 'https://aintern.nl/newsflow/starten-met-ai-agent',
    }),
  ]

  it('returns the same items as searchQa, each paired with a positive score', () => {
    const scored = searchQaScored(items, 'AI-agent starten', { limit: 10 })
    const plain = searchQa(items, 'AI-agent starten', { limit: 10 })
    expect(scored.map((s) => s.item)).toEqual(plain)
    expect(scored.every((s) => s.score > 0)).toBe(true)
  })
})

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('htmlToPlainText', () => {
  it('strips tags and decodes entities', () => {
    expect(htmlToPlainText('<p>Kosten &amp; baten</p><h2>Meer</h2>')).toBe('Kosten & baten\nMeer')
  })
})

describe('renderKennisbankArticle', () => {
  it('includes title, url, category, body and FAQ', () => {
    const text = renderKennisbankArticle({
      slug: 'test-artikel',
      title: 'Test artikel',
      category: 'Implementatietips',
      publishedAt: '2026-05-01',
      excerpt: '',
      metaDescription: '',
      content: '<p>De inhoud.</p>',
      tags: ['ai', 'mkb'],
      faq: [{ question: 'Vraag?', answer: 'Antwoord.' }],
    })
    expect(text).toContain('# Test artikel')
    expect(text).toContain('https://aintern.nl/kennisbank/test-artikel')
    expect(text).toContain('Categorie: Implementatietips')
    expect(text).toContain('De inhoud.')
    expect(text).toContain('V: Vraag?')
    expect(text).toContain('A: Antwoord.')
  })
})

describe('renderNewsflowArticle', () => {
  it('includes sections, FAQ and bronnen', () => {
    const text = renderNewsflowArticle({
      slug: 'nieuws-item',
      title: 'Nieuws item',
      metaDescription: '',
      lezersvraag: 'Wat betekent dit voor mij?',
      publishedAt: '2026-07-01T12:00:00Z',
      sections: {
        intro: '<p>Intro tekst.</p>',
        context: 'Context tekst.',
        mkbRelevantie: 'MKB tekst.',
        ainternAngle: 'AIntern tekst.',
        bronnen: [{ title: 'NOS', url: 'https://nos.nl/x' }],
      },
      faq: [{ question: 'Nieuwsvraag?', answer: 'Nieuwsantwoord.' }],
    })
    expect(text).toContain('# Nieuws item')
    expect(text).toContain('https://aintern.nl/newsflow/nieuws-item')
    expect(text).toContain('Intro tekst.')
    expect(text).toContain('## Relevantie voor MKB')
    expect(text).toContain('V: Nieuwsvraag?')
    expect(text).toContain('- NOS (https://nos.nl/x)')
  })
})

// ── JSON-RPC dispatch ─────────────────────────────────────────────────────────

describe('handleMessage', () => {
  it('initialize echoes a supported protocol version', async () => {
    const res = await handleMessage({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '0' } },
    })
    expect(res?.id).toBe(1)
    const result = res?.result as Record<string, unknown>
    expect(result.protocolVersion).toBe('2025-06-18')
    expect(result.serverInfo).toMatchObject({ name: 'aintern-knowledge' })
    expect(result.capabilities).toEqual({ tools: { listChanged: false } })
  })

  it('initialize falls back to newest supported version for unknown versions', async () => {
    const res = await handleMessage({
      jsonrpc: '2.0',
      id: 2,
      method: 'initialize',
      params: { protocolVersion: '1999-01-01' },
    })
    expect((res?.result as Record<string, unknown>).protocolVersion).toBe('2025-11-25')
  })

  it('ping returns an empty result', async () => {
    const res = await handleMessage({ jsonrpc: '2.0', id: 3, method: 'ping' })
    expect(res?.result).toEqual({})
  })

  it('unknown method returns -32601 with matching id', async () => {
    const res = await handleMessage({ jsonrpc: '2.0', id: 4, method: 'resources/list' })
    expect(res?.error?.code).toBe(-32601)
    expect(res?.id).toBe(4)
  })

  it('notifications return null', async () => {
    const res = await handleMessage({ jsonrpc: '2.0', method: 'notifications/initialized' })
    expect(res).toBeNull()
  })

  it('client responses return null', async () => {
    const res = await handleMessage({ jsonrpc: '2.0', id: 9, result: {} })
    expect(res).toBeNull()
  })

  it('rejects non-object messages', async () => {
    const res = await handleMessage('nonsense')
    expect(res?.error?.code).toBe(-32600)
  })

  it('tools/list returns all five tools with input schemas', async () => {
    const res = await handleMessage({ jsonrpc: '2.0', id: 5, method: 'tools/list' })
    const tools = (res?.result as { tools: Array<{ name: string; inputSchema: unknown }> }).tools
    expect(tools.map((t) => t.name)).toEqual([
      'search_answers',
      'list_questions',
      'get_article',
      'search',
      'fetch',
    ])
    for (const tool of tools) {
      expect(tool.inputSchema).toMatchObject({ type: 'object' })
    }
  })

  it('tools/call with unknown tool returns isError result (not JSON-RPC error)', async () => {
    const res = await handleMessage({
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: { name: 'does_not_exist', arguments: {} },
    })
    expect(res?.error).toBeUndefined()
    expect((res?.result as { isError?: boolean }).isError).toBe(true)
  })

  it('tools/call search_answers without query returns -32602', async () => {
    const res = await handleMessage({
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: { name: 'search_answers', arguments: {} },
    })
    expect(res?.error?.code).toBe(-32602)
  })

  it('tools/call get_article rejects a path-traversal slug with -32602', async () => {
    const res = await handleMessage({
      jsonrpc: '2.0',
      id: 8,
      method: 'tools/call',
      params: { name: 'get_article', arguments: { source: 'kennisbank', slug: '../index' } },
    })
    expect(res?.error?.code).toBe(-32602)
  })

  it('tools/call fetch rejects malformed ids with -32602', async () => {
    const res = await handleMessage({
      jsonrpc: '2.0',
      id: 10,
      method: 'tools/call',
      params: { name: 'fetch', arguments: { id: 'geen-dubbele-punt' } },
    })
    expect(res?.error?.code).toBe(-32602)
  })
})

// ── Tool calls against stubbed S3 ─────────────────────────────────────────────

describe('tools with stubbed fetch', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('aintern-kennisbank') && String(url).endsWith('/qa.json')) {
          return new Response(
            JSON.stringify({
              items: [
                {
                  question: 'Wat kost een AI-agent?',
                  answer: 'Vanaf enkele honderden euro per maand.',
                  slug: 'ai-agent-kosten',
                  title: 'AI-agent kosten',
                  category: 'AI Automatisering',
                  publishedAt: '2026-06-01',
                },
              ],
            }),
            { status: 200 },
          )
        }
        if (String(url).includes('aintern-newsflow') && String(url).endsWith('/qa.json')) {
          return new Response(JSON.stringify({ items: [] }), { status: 200 })
        }
        return new Response('not found', { status: 404 })
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('search_answers returns formatted hits with source URL and id', async () => {
    const res = await handleMessage({
      jsonrpc: '2.0',
      id: 11,
      method: 'tools/call',
      params: { name: 'search_answers', arguments: { query: 'kosten AI-agent' } },
    })
    const result = res?.result as { content: Array<{ text: string }>; isError?: boolean }
    expect(result.isError).toBeUndefined()
    expect(result.content[0].text).toContain('Q: Wat kost een AI-agent?')
    expect(result.content[0].text).toContain('https://aintern.nl/kennisbank/ai-agent-kosten')
    expect(result.content[0].text).toContain('Id: kennisbank:ai-agent-kosten')
  })

  it('get_article surfaces 404 as isError tool result', async () => {
    const res = await handleMessage({
      jsonrpc: '2.0',
      id: 12,
      method: 'tools/call',
      params: { name: 'get_article', arguments: { source: 'newsflow', slug: 'bestaat-niet' } },
    })
    const result = res?.result as { content: Array<{ text: string }>; isError?: boolean }
    expect(result.isError).toBe(true)
    expect(result.content[0].text).toContain('bestaat-niet')
  })
})

// ── HTTP handler ──────────────────────────────────────────────────────────────

describe('handler', () => {
  it('GET returns 405 with Allow: POST', async () => {
    const res = await handler(postEvent(null, 'GET'), mockContext)
    expect(res.statusCode).toBe(405)
    expect(res.headers?.Allow).toBe('POST')
  })

  it('OPTIONS returns 204 with wildcard CORS', async () => {
    const res = await handler(postEvent(null, 'OPTIONS'), mockContext)
    expect(res.statusCode).toBe(204)
    expect(res.headers?.['Access-Control-Allow-Origin']).toBe('*')
  })

  it('malformed JSON returns 400 with -32700', async () => {
    const res = await handler(postEvent('{nope'), mockContext)
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error.code).toBe(-32700)
  })

  it('notification-only POST returns 202 with empty body', async () => {
    const res = await handler(
      postEvent({ jsonrpc: '2.0', method: 'notifications/initialized' }),
      mockContext,
    )
    expect(res.statusCode).toBe(202)
    expect(res.body).toBe('')
  })

  it('single request returns 200 with a JSON-RPC response and no session header', async () => {
    const res = await handler(postEvent({ jsonrpc: '2.0', id: 1, method: 'ping' }), mockContext)
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ jsonrpc: '2.0', id: 1, result: {} })
    expect(res.headers?.['Mcp-Session-Id']).toBeUndefined()
  })

  it('batch requests return an array of responses', async () => {
    const res = await handler(
      postEvent([
        { jsonrpc: '2.0', id: 1, method: 'ping' },
        { jsonrpc: '2.0', method: 'notifications/initialized' },
        { jsonrpc: '2.0', id: 2, method: 'tools/list' },
      ]),
      mockContext,
    )
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(2)
  })

  it('empty batch returns 400', async () => {
    const res = await handler(postEvent([]), mockContext)
    expect(res.statusCode).toBe(400)
  })

  it('oversized batch returns 400 (SEC-HIGH amplification cap)', async () => {
    const batch = Array.from({ length: 21 }, (_, i) => ({
      jsonrpc: '2.0',
      id: i,
      method: 'ping',
    }))
    const res = await handler(postEvent(batch), mockContext)
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error.code).toBe(-32600)
  })
})

// ── HTTP handler — /ask (NLWeb) ────────────────────────────────────────────────

describe('handler — /ask', () => {
  // loadQaItems() caches at module scope with a 10-min TTL. The earlier
  // 'tools with stubbed fetch' suite already warms that cache for the
  // statically-imported `handler`, so these tests reset the module registry
  // and re-import fresh per test to get an isolated, uncached instance that
  // actually sees this describe's fetch stub.
  let askHandler: typeof handler

  beforeEach(async () => {
    vi.resetModules()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('aintern-kennisbank') && String(url).endsWith('/qa.json')) {
          return new Response(
            JSON.stringify({
              items: [
                {
                  question: 'Wat kost een AI-agent?',
                  answer: 'Vanaf enkele honderden euro per maand.',
                  slug: 'ai-agent-kosten',
                  title: 'AI-agent kosten',
                  category: 'AI Automatisering',
                  publishedAt: '2026-06-01',
                },
              ],
            }),
            { status: 200 },
          )
        }
        if (String(url).includes('aintern-newsflow') && String(url).endsWith('/qa.json')) {
          return new Response(
            JSON.stringify({
              items: [
                {
                  question: 'Hoe start ik met een AI-agent?',
                  answer: 'Begin met een workflow-scan.',
                  slug: 'starten-met-ai-agent',
                  title: 'Starten met AI-agents',
                  publishedAt: '2026-07-01',
                },
              ],
            }),
            { status: 200 },
          )
        }
        return new Response('not found', { status: 404 })
      }),
    )
    ;({ handler: askHandler } = await import('./mcp-server'))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('OPTIONS returns 204 with wildcard CORS', async () => {
    const res = await askHandler(
      { ...askGetEvent({}), httpMethod: 'OPTIONS' } as unknown as APIGatewayProxyEvent,
      mockContext,
    )
    expect(res.statusCode).toBe(204)
    expect(res.headers?.['Access-Control-Allow-Origin']).toBe('*')
  })

  it('basic query (GET) returns results with scores and query_id', async () => {
    const res = await askHandler(askGetEvent({ query: 'kosten AI-agent' }), mockContext)
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(typeof body.query_id).toBe('string')
    expect(body.results.length).toBeGreaterThan(0)
    const hit = body.results[0]
    expect(hit.url).toBe('https://aintern.nl/kennisbank/ai-agent-kosten')
    expect(hit.name).toBe('Wat kost een AI-agent?')
    expect(hit.site).toBe('kennisbank')
    expect(typeof hit.score).toBe('number')
    expect(hit.score).toBeGreaterThan(0)
    expect(hit.description).toBe('Vanaf enkele honderden euro per maand.')
    expect(hit.schema_object).toMatchObject({
      '@type': 'Question',
      name: 'Wat kost een AI-agent?',
      url: 'https://aintern.nl/kennisbank/ai-agent-kosten',
      acceptedAnswer: { '@type': 'Answer', text: 'Vanaf enkele honderden euro per maand.' },
    })
  })

  it('basic query (POST JSON body) returns the same shape as GET', async () => {
    const res = await askHandler(askPostEvent({ query: 'kosten AI-agent' }), mockContext)
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.results.length).toBeGreaterThan(0)
  })

  it('echoes a provided query_id instead of generating one', async () => {
    const res = await askHandler(
      askGetEvent({ query: 'kosten AI-agent', query_id: 'client-supplied-id' }),
      mockContext,
    )
    expect(JSON.parse(res.body).query_id).toBe('client-supplied-id')
  })

  it('site filter restricts results to the requested source', async () => {
    const res = await askHandler(askGetEvent({ query: 'AI-agent', site: 'newsflow' }), mockContext)
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.results.length).toBeGreaterThan(0)
    expect(body.results.every((r: { site: string }) => r.site === 'newsflow')).toBe(true)
  })

  it('no matches returns 200 with an empty results array', async () => {
    const res = await askHandler(askGetEvent({ query: 'blockchain quantum' }), mockContext)
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).results).toEqual([])
  })

  it('decontextualized_query overrides query when present', async () => {
    const res = await askHandler(
      askGetEvent({ query: 'volledig irrelevante tekst', decontextualized_query: 'kosten AI-agent' }),
      mockContext,
    )
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.results.length).toBeGreaterThan(0)
    expect(body.results[0].name).toBe('Wat kost een AI-agent?')
  })

  it('mode and streaming are accepted but ignored — still returns the list shape', async () => {
    const res = await askHandler(
      askGetEvent({ query: 'kosten AI-agent', mode: 'summarize', streaming: 'true' }),
      mockContext,
    )
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(Array.isArray(body.results)).toBe(true)
    expect(body.results.length).toBeGreaterThan(0)
  })

  it('missing query returns 400', async () => {
    const res = await askHandler(askGetEvent({}), mockContext)
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).error).toBeDefined()
  })
})
