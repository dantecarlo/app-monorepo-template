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
