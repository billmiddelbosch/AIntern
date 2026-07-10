/**
 * amplify-webhook.test.ts
 *
 * Unit tests for the Amplify build-webhook trigger.
 * SSM and fetch are mocked so no AWS credentials or network are needed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}))

// Vitest 4: mock implementations called with `new` must use the `function` or
// `class` keyword — arrow functions throw "is not a constructor".
vi.mock('@aws-sdk/client-ssm', () => ({
  SSMClient: vi.fn(function () {
    return { send: mockSend }
  }),
  GetParameterCommand: vi.fn(function (input) {
    return { __type: 'GetParameterCommand', input }
  }),
}))

// Import AFTER mocks are in place
import { triggerAmplifyBuild, isValidWebhookUrl } from './amplify-webhook'

const VALID_URL =
  'https://webhooks.amplify.eu-west-1.amazonaws.com/prod/webhooks?id=abc&token=def'

describe('isValidWebhookUrl', () => {
  it('accepts an Amplify webhook URL', () => {
    expect(isValidWebhookUrl(VALID_URL)).toBe(true)
  })

  it('rejects http, non-Amplify hosts, and garbage', () => {
    expect(isValidWebhookUrl('http://webhooks.amplify.eu-west-1.amazonaws.com/x')).toBe(false)
    expect(isValidWebhookUrl('https://evil.example.com/webhooks')).toBe(false)
    expect(isValidWebhookUrl('https://webhooks.amplify.eu-west-1.amazonaws.com.evil.com/x')).toBe(
      false,
    )
    expect(isValidWebhookUrl('not a url')).toBe(false)
  })
})

describe('triggerAmplifyBuild', () => {
  beforeEach(() => {
    mockSend.mockReset()
    vi.unstubAllGlobals()
  })

  it('POSTs to the webhook URL from SSM and reports success', async () => {
    mockSend.mockResolvedValueOnce({ Parameter: { Value: VALID_URL } })
    const mockFetch = vi.fn().mockResolvedValueOnce({ ok: true, status: 200 })
    vi.stubGlobal('fetch', mockFetch)

    const result = await triggerAmplifyBuild('prod')

    expect(result.success).toBe(true)
    expect(mockSend.mock.calls[0][0].input).toMatchObject({
      Name: '/aintern/prod/amplify/build-webhook-url',
      WithDecryption: true,
    })
    expect(mockFetch).toHaveBeenCalledWith(VALID_URL, expect.objectContaining({ method: 'POST' }))
  })

  it('fails without throwing when the SSM parameter is missing', async () => {
    mockSend.mockRejectedValueOnce(new Error('ParameterNotFound'))
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)

    const result = await triggerAmplifyBuild('dev')

    expect(result.success).toBe(false)
    expect(result.error).toContain('/aintern/dev/amplify/build-webhook-url')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  // NB: each test uses a distinct alias — the module caches the URL per alias for 15 min

  it('rejects a non-Amplify URL from SSM without calling it', async () => {
    mockSend.mockResolvedValueOnce({ Parameter: { Value: 'https://evil.example.com/hook' } })
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)

    const result = await triggerAmplifyBuild('dev-invalid-url')

    expect(result.success).toBe(false)
    expect(result.error).toContain('validation')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('reports failure on a non-2xx webhook response', async () => {
    mockSend.mockResolvedValueOnce({ Parameter: { Value: VALID_URL } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false, status: 403 }))

    const result = await triggerAmplifyBuild('dev-403')

    expect(result.success).toBe(false)
    expect(result.error).toContain('403')
  })

  it('reports failure on a network error', async () => {
    mockSend.mockResolvedValueOnce({ Parameter: { Value: VALID_URL } })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('ETIMEDOUT')))

    const result = await triggerAmplifyBuild('dev-network')

    expect(result.success).toBe(false)
    expect(result.error).toContain('ETIMEDOUT')
  })
})
