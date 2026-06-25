import { describe, expect, test } from 'vitest'

import { PII_KEYS, scrubPII } from './scrubPII.helper'

// ---------------------------------------------------------------------------
// PII_KEYS export shape
// ---------------------------------------------------------------------------

describe('PII_KEYS', () => {
  test('is a ReadonlySet', () => {
    expect(PII_KEYS).toBeInstanceOf(Set)
  })

  test('contains expected sensitive keys', () => {
    expect(PII_KEYS.has('email')).toBe(true)
    expect(PII_KEYS.has('password')).toBe(true)
    expect(PII_KEYS.has('token')).toBe(true)
    expect(PII_KEYS.has('phone')).toBe(true)
    expect(PII_KEYS.has('secret')).toBe(true)
    expect(PII_KEYS.has('access_token')).toBe(true)
    expect(PII_KEYS.has('refresh_token')).toBe(true)
    expect(PII_KEYS.has('payer_name')).toBe(true)
    expect(PII_KEYS.has('full_name')).toBe(true)
    expect(PII_KEYS.has('raw_text')).toBe(true)
  })

  test('contains transport-header and cookie keys', () => {
    expect(PII_KEYS.has('authorization')).toBe(true)
    expect(PII_KEYS.has('cookie')).toBe(true)
    expect(PII_KEYS.has('set-cookie')).toBe(true)
    expect(PII_KEYS.has('apikey')).toBe(true)
    expect(PII_KEYS.has('jwt')).toBe(true)
    expect(PII_KEYS.has('session')).toBe(true)
  })

  test('does NOT contain "name" (business name is not PII by default)', () => {
    expect(PII_KEYS.has('name')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Redaction of each PII key
// ---------------------------------------------------------------------------

describe('scrubPII — PII key redaction', () => {
  const sensitiveKeys = [
    'email',
    'password',
    'token',
    'phone',
    'secret',
    'access_token',
    'refresh_token',
    'payer_name',
    'payername',
    'full_name',
    'fullname',
    'phonenumber',
    'raw_text',
    'rawtext',
    'accesstoken'
  ]

  for (const key of sensitiveKeys) {
    test(`redacts "${key}"`, () => {
      const result = scrubPII({ [key]: 'sensitive-value' })
      expect((result as Record<string, unknown>)[key]).toBe('[redacted]')
    })
  }
})

// ---------------------------------------------------------------------------
// Case-insensitivity
// ---------------------------------------------------------------------------

describe('scrubPII — case-insensitive matching', () => {
  test('redacts "Email" (PascalCase)', () => {
    const r = scrubPII({ Email: 'user@example.com' }) as Record<
      string,
      unknown
    >
    expect(r.Email).toBe('[redacted]')
  })

  test('redacts "EMAIL" (UPPER_CASE)', () => {
    const r = scrubPII({ EMAIL: 'user@example.com' }) as Record<
      string,
      unknown
    >
    expect(r.EMAIL).toBe('[redacted]')
  })

  test('redacts "PASSWORD" (upper)', () => {
    const r = scrubPII({ PASSWORD: 'secret' }) as Record<string, unknown>
    expect(r.PASSWORD).toBe('[redacted]')
  })
})

// ---------------------------------------------------------------------------
// Normalized matching — transport headers and cookies (Sentry request payload)
// ---------------------------------------------------------------------------

describe('scrubPII — normalized header/cookie matching', () => {
  test('redacts request.headers.Authorization (Bearer token)', () => {
    const event = {
      request: {
        headers: {
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig'
        }
      }
    }
    const result = scrubPII(event) as typeof event
    expect(result.request.headers.Authorization).toBe('[redacted]')
  })

  test('redacts request.headers.Cookie (sb-access-token)', () => {
    const event = {
      request: {
        headers: {
          Cookie: 'sb-access-token=eyJ...; sb-refresh-token=abc'
        }
      }
    }
    const result = scrubPII(event) as typeof event
    expect(result.request.headers.Cookie).toBe('[redacted]')
  })

  test('redacts hyphenated header variants ("access-token", "set-cookie")', () => {
    const r = scrubPII({
      'access-token': 'a',
      'set-cookie': 'b'
    }) as Record<string, unknown>
    expect(r['access-token']).toBe('[redacted]')
    expect(r['set-cookie']).toBe('[redacted]')
  })

  test('redacts "x-api-key" header', () => {
    const r = scrubPII({ 'x-api-key': 'k' }) as Record<string, unknown>
    expect(r['x-api-key']).toBe('[redacted]')
  })

  test('does NOT over-redact substring matches like "tokenCount"', () => {
    const r = scrubPII({
      apikeyLabel: 'public',
      tokenCount: 42
    }) as Record<string, unknown>
    expect(r.tokenCount).toBe(42)
    expect(r.apikeyLabel).toBe('public')
  })
})

// ---------------------------------------------------------------------------
// Non-PII preservation
// ---------------------------------------------------------------------------

describe('scrubPII — non-PII fields are preserved', () => {
  test('preserves "name" (not in PII_KEYS)', () => {
    const r = scrubPII({ name: 'Acme Corp' }) as Record<string, unknown>
    expect(r.name).toBe('Acme Corp')
  })

  test('preserves "amount"', () => {
    const r = scrubPII({ amount: 9999 }) as Record<string, unknown>
    expect(r.amount).toBe(9999)
  })

  test('preserves "id"', () => {
    const r = scrubPII({ id: 'abc-123' }) as Record<string, unknown>
    expect(r.id).toBe('abc-123')
  })

  test('preserves "status"', () => {
    const r = scrubPII({ status: 'active' }) as Record<string, unknown>
    expect(r.status).toBe('active')
  })

  test('preserves "code"', () => {
    const r = scrubPII({ code: 'ERR_001' }) as Record<string, unknown>
    expect(r.code).toBe('ERR_001')
  })

  test('preserves "message"', () => {
    const r = scrubPII({ message: 'not found' }) as Record<string, unknown>
    expect(r.message).toBe('not found')
  })
})

// ---------------------------------------------------------------------------
// Nested objects
// ---------------------------------------------------------------------------

describe('scrubPII — nested objects', () => {
  test('redacts PII in nested objects', () => {
    const input = {
      user: {
        email: 'test@test.com',
        name: 'John'
      }
    }
    const result = scrubPII(input) as typeof input
    expect(result.user.email).toBe('[redacted]')
    expect(result.user.name).toBe('John')
  })

  test('redacts PII at multiple nesting levels', () => {
    const input = {
      level1: {
        level2: {
          email: 'deep@test.com',
          id: 42
        }
      }
    }
    const result = scrubPII(input) as typeof input
    expect(result.level1.level2.email).toBe('[redacted]')
    expect(result.level1.level2.id).toBe(42)
  })
})

// ---------------------------------------------------------------------------
// Arrays
// ---------------------------------------------------------------------------

describe('scrubPII — arrays', () => {
  test('recurses into arrays', () => {
    const input = [
      { email: 'a@test.com', id: 1 },
      { email: 'b@test.com', id: 2 }
    ]
    const result = scrubPII(input) as typeof input
    expect(result[0].email).toBe('[redacted]')
    expect(result[0].id).toBe(1)
    expect(result[1].email).toBe('[redacted]')
  })

  test('handles arrays of primitives', () => {
    expect(scrubPII([1, 2, 3])).toEqual([1, 2, 3])
    expect(scrubPII(['a', 'b'])).toEqual(['a', 'b'])
  })
})

// ---------------------------------------------------------------------------
// Circular references
// ---------------------------------------------------------------------------

describe('scrubPII — circular references', () => {
  test('replaces circular reference with "[circular]"', () => {
    const obj: Record<string, unknown> = { id: 1 }
    obj.self = obj
    const result = scrubPII(obj) as Record<string, unknown>
    expect(result.id).toBe(1)
    expect(result.self).toBe('[circular]')
  })
})

// ---------------------------------------------------------------------------
// Primitives / edge cases
// ---------------------------------------------------------------------------

describe('scrubPII — primitives and edge cases', () => {
  test('returns strings as-is', () => {
    expect(scrubPII('hello')).toBe('hello')
  })

  test('returns numbers as-is', () => {
    expect(scrubPII(42)).toBe(42)
  })

  test('returns null as-is', () => {
    expect(scrubPII(null)).toBeNull()
  })

  test('returns undefined as-is', () => {
    expect(scrubPII(undefined)).toBeUndefined()
  })

  test('returns boolean as-is', () => {
    expect(scrubPII(true)).toBe(true)
  })

  test('handles empty object', () => {
    expect(scrubPII({})).toEqual({})
  })

  test('handles empty array', () => {
    expect(scrubPII([])).toEqual([])
  })
})
