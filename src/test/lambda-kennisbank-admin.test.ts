// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { APIGatewayProxyEvent, Context } from 'aws-lambda'

// ── Mock AWS SDK and JWT ───────────────────────────────────────────────────────

const mockS3Send = vi.hoisted(() => vi.fn())
const mockSsmSend = vi.hoisted(() => vi.fn())
const mockJwtVerify = vi.hoisted(() => vi.fn())

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({ send: mockS3Send })),
  GetObjectCommand: vi.fn((p: object) => ({ ...p, __cmd: 'GetObject' })),
  ListObjectsV2Command: vi.fn((p: object) => ({ ...p, __cmd: 'ListObjectsV2' })),
  PutObjectCommand: vi.fn((p: object) => ({ ...p, __cmd: 'PutObject' })),
  DeleteObjectCommand: vi.fn((p: object) => ({ ...p, __cmd: 'DeleteObject' })),
}))

vi.mock('@aws-sdk/client-ssm', () => ({
  SSMClient: vi.fn(() => ({ send: mockSsmSend })),
  GetParameterCommand: vi.fn((p: object) => ({ ...p, __cmd: 'GetParameter' })),
}))

vi.mock('jsonwebtoken', () => ({
  default: { verify: mockJwtVerify },
  verify: mockJwtVerify,
}))

import { handler } from '../../lambda/src/kennisbank-admin'

// ── Test fixtures ─────────────────────────────────────────────────────────────

const mockIndex = {
  posts: [
    {
      slug: 'ai-voor-mkb',
      title: 'AI voor het MKB',
      category: 'AI Automatisering',
      publishedAt: '2026-04-15',
      excerpt: 'Test excerpt',
      metaDescription: 'Test meta',
    },
  ],
}

const mockPost = {
  slug: 'ai-voor-mkb',
  title: 'AI voor het MKB',
  category: 'AI Automatisering',
  publishedAt: '2026-04-15',
  excerpt: 'Test excerpt',
  metaDescription: 'Test meta',
  content: '<p>Test content</p>',
  tags: ['mkb'],
  status: 'published' as const,
}

const mockContext: Context = {
  awsRequestId: 'test-request-id',
  invokedFunctionArn: 'arn:aws:lambda:eu-west-2:123456789:function:test:dev',
  functionName: 'test',
  functionVersion: '1',
  memoryLimitInMB: '256',
  logGroupName: '/aws/lambda/test',
  logStreamName: 'test',
  callbackWaitsForEmptyEventLoop: false,
  getRemainingTimeInMillis: () => 30000,
  done: vi.fn(),
  fail: vi.fn(),
  succeed: vi.fn(),
}

function makeEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: 'GET',
    path: '/admin/kennisbank',
    headers: { Authorization: 'Bearer valid-token', origin: 'http://localhost:5173' },
    body: null,
    queryStringParameters: null,
    pathParameters: null,
    multiValueQueryStringParameters: null,
    multiValueHeaders: {},
    requestContext: {} as APIGatewayProxyEvent['requestContext'],
    resource: '',
    stageVariables: null,
    isBase64Encoded: false,
    ...overrides,
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()

  // SSM returns JWT secret
  mockSsmSend.mockResolvedValue({ Parameter: { Value: 'test-secret' } })

  // JWT verify passes by default
  mockJwtVerify.mockReturnValue({ sub: 'admin' })

  // Default S3 send: handle by command type
  mockS3Send.mockImplementation(async (cmd: { __cmd: string; Key?: string }) => {
    if (cmd.__cmd === 'GetObject') {
      if (cmd.Key === 'index.json') {
        return { Body: { transformToString: async () => JSON.stringify(mockIndex) } }
      }
      return { Body: { transformToString: async () => JSON.stringify(mockPost) } }
    }
    if (cmd.__cmd === 'ListObjectsV2') {
      return {
        Contents: [
          { Key: 'posts/ai-voor-mkb.json', LastModified: new Date('2026-04-15') },
        ],
        IsTruncated: false,
      }
    }
    // PutObject, DeleteObject
    return {}
  })
})

// ── Auth guard ────────────────────────────────────────────────────────────────

describe('auth guard', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const event = makeEvent({ headers: { origin: 'http://localhost:5173' } })
    const res = await handler(event, mockContext)
    expect(res.statusCode).toBe(401)
  })

  it('returns 401 when token scheme is not Bearer', async () => {
    const event = makeEvent({ headers: { Authorization: 'Basic dXNlcjpwYXNz' } })
    const res = await handler(event, mockContext)
    expect(res.statusCode).toBe(401)
  })

  it('returns 401 when JWT verification fails', async () => {
    mockJwtVerify.mockImplementationOnce(() => {
      throw new Error('invalid signature')
    })
    const event = makeEvent()
    const res = await handler(event, mockContext)
    expect(res.statusCode).toBe(401)
  })
})

// ── GET /admin/kennisbank (list) ──────────────────────────────────────────────

describe('GET /admin/kennisbank', () => {
  it('returns 200 with articles array', async () => {
    const event = makeEvent({ httpMethod: 'GET', path: '/admin/kennisbank' })
    const res = await handler(event, mockContext)
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(Array.isArray(body.articles)).toBe(true)
    expect(body.articles.length).toBeGreaterThan(0)
  })

  it('marks articles as published when slug is in index', async () => {
    const event = makeEvent({ httpMethod: 'GET', path: '/admin/kennisbank' })
    const res = await handler(event, mockContext)
    const { articles } = JSON.parse(res.body)
    expect(articles[0].status).toBe('published')
  })

  it('marks articles as draft when slug is absent from index', async () => {
    // S3 has a post file not in index
    mockS3Send.mockImplementation(async (cmd: { __cmd: string; Key?: string }) => {
      if (cmd.__cmd === 'GetObject' && cmd.Key === 'index.json') {
        return { Body: { transformToString: async () => JSON.stringify({ posts: [] }) } }
      }
      if (cmd.__cmd === 'ListObjectsV2') {
        return {
          Contents: [{ Key: 'posts/draft-article.json', LastModified: new Date() }],
          IsTruncated: false,
        }
      }
      return {}
    })
    const event = makeEvent({ httpMethod: 'GET', path: '/admin/kennisbank' })
    const res = await handler(event, mockContext)
    const { articles } = JSON.parse(res.body)
    expect(articles[0].status).toBe('draft')
  })
})

// ── GET /admin/kennisbank/:slug ───────────────────────────────────────────────

describe('GET /admin/kennisbank/:slug', () => {
  it('returns 200 with post data when slug exists', async () => {
    const event = makeEvent({ httpMethod: 'GET', path: '/admin/kennisbank/ai-voor-mkb' })
    const res = await handler(event, mockContext)
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.slug).toBe('ai-voor-mkb')
    expect(body.title).toBe('AI voor het MKB')
  })

  it('returns 404 when slug does not exist in S3', async () => {
    mockS3Send.mockImplementation(async (cmd: { __cmd: string; Key?: string }) => {
      if (cmd.__cmd === 'GetObject' && cmd.Key?.startsWith('posts/')) {
        throw new Error('NoSuchKey: The specified key does not exist')
      }
      if (cmd.__cmd === 'GetObject' && cmd.Key === 'index.json') {
        return { Body: { transformToString: async () => JSON.stringify(mockIndex) } }
      }
      return {}
    })
    const event = makeEvent({ httpMethod: 'GET', path: '/admin/kennisbank/niet-bestaand' })
    const res = await handler(event, mockContext)
    expect(res.statusCode).toBe(404)
  })
})

// ── PUT /admin/kennisbank/:slug (save draft) ──────────────────────────────────

describe('PUT /admin/kennisbank/:slug', () => {
  it('returns 200 when draft is saved successfully', async () => {
    const event = makeEvent({
      httpMethod: 'PUT',
      path: '/admin/kennisbank/nieuw-artikel',
      body: JSON.stringify({ ...mockPost, slug: 'nieuw-artikel' }),
    })
    const res = await handler(event, mockContext)
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).slug).toBe('nieuw-artikel')
  })

  it('returns 400 when slug in body does not match path', async () => {
    const event = makeEvent({
      httpMethod: 'PUT',
      path: '/admin/kennisbank/slug-a',
      body: JSON.stringify({ ...mockPost, slug: 'slug-b' }),
    })
    const res = await handler(event, mockContext)
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when category is invalid', async () => {
    const event = makeEvent({
      httpMethod: 'PUT',
      path: '/admin/kennisbank/nieuw-artikel',
      body: JSON.stringify({ ...mockPost, slug: 'nieuw-artikel', category: 'Ongeldige Categorie' }),
    })
    const res = await handler(event, mockContext)
    expect(res.statusCode).toBe(400)
  })
})

// ── POST /admin/kennisbank/:slug/publish ──────────────────────────────────────

describe('POST /admin/kennisbank/:slug/publish', () => {
  it('returns 200 with slug and publishedAt on success', async () => {
    const event = makeEvent({
      httpMethod: 'POST',
      path: '/admin/kennisbank/ai-voor-mkb/publish',
      body: JSON.stringify(mockPost),
    })
    const res = await handler(event, mockContext)
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.slug).toBe('ai-voor-mkb')
    expect(body.publishedAt).toBe('2026-04-15')
  })

  it('calls S3 PutObject at least twice (post + index) and generates sitemap', async () => {
    const putCalls: string[] = []
    mockS3Send.mockImplementation(async (cmd: { __cmd: string; Key?: string }) => {
      if (cmd.__cmd === 'PutObject') putCalls.push(cmd.Key ?? '')
      if (cmd.__cmd === 'GetObject' && cmd.Key === 'index.json') {
        return { Body: { transformToString: async () => JSON.stringify(mockIndex) } }
      }
      if (cmd.__cmd === 'ListObjectsV2') {
        return { Contents: [{ Key: 'posts/ai-voor-mkb.json', LastModified: new Date() }], IsTruncated: false }
      }
      return {}
    })
    const event = makeEvent({
      httpMethod: 'POST',
      path: '/admin/kennisbank/ai-voor-mkb/publish',
      body: JSON.stringify(mockPost),
    })
    await handler(event, mockContext)
    // post file + index.json + sitemap.xml
    expect(putCalls).toContain('posts/ai-voor-mkb.json')
    expect(putCalls).toContain('index.json')
    expect(putCalls).toContain('sitemap.xml')
  })

  it('returns 400 when category is invalid', async () => {
    const event = makeEvent({
      httpMethod: 'POST',
      path: '/admin/kennisbank/ai-voor-mkb/publish',
      body: JSON.stringify({ ...mockPost, category: 'Fout' }),
    })
    const res = await handler(event, mockContext)
    expect(res.statusCode).toBe(400)
  })
})

// ── DELETE /admin/kennisbank/:slug ────────────────────────────────────────────

describe('DELETE /admin/kennisbank/:slug', () => {
  it('returns 200 on successful delete', async () => {
    const event = makeEvent({
      httpMethod: 'DELETE',
      path: '/admin/kennisbank/ai-voor-mkb',
    })
    const res = await handler(event, mockContext)
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).slug).toBe('ai-voor-mkb')
  })

  it('removes slug from index and regenerates sitemap when article was published', async () => {
    const putCalls: string[] = []
    mockS3Send.mockImplementation(async (cmd: { __cmd: string; Key?: string }) => {
      if (cmd.__cmd === 'PutObject') putCalls.push(cmd.Key ?? '')
      if (cmd.__cmd === 'GetObject' && cmd.Key === 'index.json') {
        return { Body: { transformToString: async () => JSON.stringify(mockIndex) } }
      }
      if (cmd.__cmd === 'ListObjectsV2') {
        return { Contents: [], IsTruncated: false }
      }
      return {}
    })
    const event = makeEvent({
      httpMethod: 'DELETE',
      path: '/admin/kennisbank/ai-voor-mkb',
    })
    await handler(event, mockContext)
    expect(putCalls).toContain('index.json')
    expect(putCalls).toContain('sitemap.xml')
  })
})

// ── CORS headers ──────────────────────────────────────────────────────────────

describe('CORS headers', () => {
  it('returns correct CORS origin for localhost (dev alias)', async () => {
    const event = makeEvent({
      httpMethod: 'GET',
      path: '/admin/kennisbank',
      headers: { Authorization: 'Bearer valid-token', origin: 'http://localhost:5173' },
    })
    const res = await handler(event, mockContext)
    expect(res.headers?.['Access-Control-Allow-Origin']).toBe('http://localhost:5173')
  })
})
