import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server'
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

// The origin guard reads CF_ORIGIN_SECRET when its module loads, so each test
// sets the secret, then imports the middleware afresh.
const ORIGIN_SECRET = 'origin-secret-for-tests'
const ORIGIN_SECRET_HEADER = 'x-cf-origin-secret'
const PAGE_URL = 'https://app.example.com/login'
const FORBIDDEN_STATUS = 403
// The header NextResponse.next() sets on a request it lets through.
const NEXT_HEADER = 'x-middleware-next'

const EXEMPT_URLS = [
  'https://app.example.com/_next/static/chunks/main.js',
  'https://app.example.com/_next/image?url=%2Fimages%2Fa.png&w=64&q=75',
  'https://app.example.com/favicon.ico',
  'https://app.example.com/images/logo.png',
  'https://app.example.com/fonts/Inter_400Regular.ttf'
]

const loadMiddleware = async () => import('@/middleware')

const requestWith = (headers: Record<string, string> = {}) =>
  new NextRequest(PAGE_URL, { headers })

describe('middleware', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('CF_ORIGIN_SECRET', ORIGIN_SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('lets a request with the configured origin secret through', async () => {
    const { middleware } = await loadMiddleware()

    const response = middleware(
      requestWith({ [ORIGIN_SECRET_HEADER]: ORIGIN_SECRET })
    )

    expect(response.status).not.toBe(FORBIDDEN_STATUS)
    expect(response.headers.get(NEXT_HEADER)).toBe('1')
  })

  test('answers 403 with an empty body when the origin secret header is missing', async () => {
    const { middleware } = await loadMiddleware()

    const response = middleware(requestWith())

    expect(response.status).toBe(FORBIDDEN_STATUS)
    expect(await response.text()).toBe('')
    expect(response.headers.get(NEXT_HEADER)).toBeNull()
  })

  test('answers 403 with an empty body when the origin secret header is wrong', async () => {
    const { middleware } = await loadMiddleware()

    const response = middleware(
      requestWith({ [ORIGIN_SECRET_HEADER]: 'not-the-secret' })
    )

    expect(response.status).toBe(FORBIDDEN_STATUS)
    expect(await response.text()).toBe('')
  })

  test('does not run for the paths the guard exempts', async () => {
    const { config } = await loadMiddleware()

    EXEMPT_URLS.forEach((url) => {
      expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false)
    })
  })

  test('runs for a page route', async () => {
    const { config } = await loadMiddleware()

    expect(unstable_doesMiddlewareMatch({ config, url: PAGE_URL })).toBe(
      true
    )
  })

  test.each([
    {
      name: 'a wrong secret of the same length',
      presented: 'origin-secret-for-testX'
    },
    {
      name: 'the secret in upper case',
      presented: ORIGIN_SECRET.toUpperCase()
    },
    { name: 'an empty header', presented: '' }
  ])('answers 403 with an empty body for $name', async ({ presented }) => {
    const { middleware } = await loadMiddleware()

    const response = middleware(
      requestWith({ [ORIGIN_SECRET_HEADER]: presented })
    )

    expect(response.status).toBe(FORBIDDEN_STATUS)
    expect(await response.text()).toBe('')
    expect(response.headers.get(NEXT_HEADER)).toBeNull()
  })
})
