import { expect, test } from 'vitest'

import {
  scrubCaptureUrls,
  scrubUrl
} from '@/lib/posthog/scrubCaptureUrls.helper'
import type { ICaptureEvent } from '@/lib/posthog/scrubCaptureUrls.type'

const event = (overrides: Partial<ICaptureEvent>): ICaptureEvent => ({
  properties: {},
  ...overrides
})

test('drops the query and the fragment of a page URL', () => {
  expect(
    scrubUrl({
      value: 'https://app.example.com/invite?token=abc#access_token=x'
    })
  ).toBe('https://app.example.com/invite')
  expect(scrubUrl({ value: '/items/42' })).toBe('/items/42')
})

// Segments that read as a secret: a reset token (a JWT), an invite id (a
// UUID), a verification token (hex), a card number and an email.
const RESET_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTYifQ.c2lnbmF0dXJlMTIz'
const INVITE_ID = '550e8400-e29b-41d4-a716-446655440000'
const VERIFY_TOKEN = '9f86d081884c7d65'
const CARD_NUMBER = '4111111111111111'

test('replaces a path segment that reads as a secret', () => {
  expect(
    scrubUrl({
      value: `https://app.example.com/reset/${RESET_TOKEN}?next=/home`
    })
  ).toBe('https://app.example.com/reset/:redacted')
  expect(scrubUrl({ value: `/invite/${INVITE_ID}/accept` })).toBe(
    '/invite/:redacted/accept'
  )
  expect(scrubUrl({ value: `/verify/${VERIFY_TOKEN}` })).toBe(
    '/verify/:redacted'
  )
  expect(scrubUrl({ value: `/cards/${CARD_NUMBER}` })).toBe(
    '/cards/:redacted'
  )
  expect(scrubUrl({ value: '/users/jane@example.com/profile' })).toBe(
    '/users/:redacted/profile'
  )
  expect(scrubUrl({ value: '/users/jane%40example.com' })).toBe(
    '/users/:redacted'
  )
})

test('keeps route names, word slugs and short ids in the path', () => {
  const kept = [
    'https://app.example.com/settings/notifications-and-privacy',
    '/blog/what-changed-in-the-2026-release',
    '/items/42',
    '/orders/a1b2c3d4e5',
    'https://eu-2026-west.example.com/dashboard',
    '$direct'
  ]

  kept.forEach((value) => expect(scrubUrl({ value })).toBe(value))
})

// The digit-and-length rule reads the decoded text: every `%C3` of an
// accented word holds a digit. The URL keeps its encoded form.
test('reads a percent-encoded segment by its decoded text', () => {
  const kept = [
    '/categorias/electrodom%C3%A9sticos',
    '/blog/ma%C3%B1ana',
    '/blog/%E5%8C%97%E4%BA%AC%E7%83%A4%E9%B8%AD'
  ]

  kept.forEach((value) => expect(scrubUrl({ value })).toBe(value))
  expect(scrubUrl({ value: '/reset/k3J9xQ2mZ8%70L4vN7' })).toBe(
    '/reset/:redacted'
  )
})

// A slug of short parts may mix letters and digits; a UUID's last part is
// 12 characters long, and a card number's parts hold no letter.
test('keeps a slug of short parts that mix letters and digits', () => {
  const kept = [
    '/products/samsung-galaxy-s24-ultra-256gb',
    '/docs/getting_started_v2_guide',
    '/blog/migrating-to-react18-today',
    '/blog/top-10000-words-list',
    '/categorias/electrodom%C3%A9sticos'
  ]

  kept.forEach((value) => expect(scrubUrl({ value })).toBe(value))
  expect(scrubUrl({ value: `/invite/${INVITE_ID}` })).toBe(
    '/invite/:redacted'
  )
  expect(scrubUrl({ value: '/pay/4111-1111-1111-1111' })).toBe(
    '/pay/:redacted'
  )
})

// Random secrets come in that shape too: a base64url or nanoid token uses
// `-` and `_` as alphabet characters, and a license, reset or invite key is
// grouped with hyphens. Mixed case, letters and digits interleaved in one
// part, and no word of three letters each refuse the slug.
test('redacts a token shaped as a slug of short parts', () => {
  const tokens = [
    'V1StGXR8_Z5jdHi6B-myT',
    'AbC123-dEf456-GhI789',
    '3f9a-c2e1-77b0-aa12',
    'a1b2-c3d4-e5f6-g7h8',
    'K7QX-9MPL-2RTA-8WNZ',
    'My-Post-About-2026'
  ]

  expect(
    tokens.map((token) => scrubUrl({ value: `/reset/${token}` }))
  ).toEqual(tokens.map(() => '/reset/:redacted'))
})

test('scrubs every URL property of an event and of its person', () => {
  const scrubbed = scrubCaptureUrls(
    event({
      $set: { $current_url: 'https://app.example.com/a?email=x@y.z' },
      $set_once: {
        $initial_pathname: '/reset#token=abc',
        $initial_referrer: 'https://search.example.com/?q=name'
      },
      properties: {
        $current_url: 'https://app.example.com/items?page=2#top',
        $pathname: '/items',
        $referrer: 'https://search.example.com/search?q=person',
        $session_entry_url: 'https://app.example.com/invite?token=abc'
      }
    })
  )

  expect(scrubbed).toEqual({
    $set: { $current_url: 'https://app.example.com/a' },
    $set_once: {
      $initial_pathname: '/reset',
      $initial_referrer: 'https://search.example.com/'
    },
    properties: {
      $current_url: 'https://app.example.com/items',
      $pathname: '/items',
      $referrer: 'https://search.example.com/search',
      $session_entry_url: 'https://app.example.com/invite'
    }
  })
})

test('keys heatmap points by the scrubbed URL', () => {
  const scrubbed = scrubCaptureUrls(
    event({
      properties: {
        $heatmap_data: {
          'https://app.example.com/items?q=a': [{ x: 1 }],
          'https://app.example.com/items?q=b': [{ x: 2 }],
          'https://app.example.com/login#next': { x: 3 }
        }
      }
    })
  )

  expect(scrubbed?.properties).toEqual({
    $heatmap_data: {
      'https://app.example.com/items': [{ x: 1 }, { x: 2 }],
      'https://app.example.com/login': [{ x: 3 }]
    }
  })
})

test('leaves every other property untouched', () => {
  const properties = {
    $browser: 'Chrome',
    $heatmap_data: null,
    $referrer: null,
    $referring_domain: 'search.example.com',
    share_url: 'https://app.example.com/?kept=yes'
  }

  expect(scrubCaptureUrls(event({ properties }))?.properties).toEqual(
    properties
  )
})

test('passes a dropped event through as dropped', () => {
  expect(scrubCaptureUrls(null)).toBeNull()
})
