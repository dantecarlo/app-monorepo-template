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
