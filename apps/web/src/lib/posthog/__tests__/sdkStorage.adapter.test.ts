import { afterEach, expect, test, vi } from 'vitest'

import { removeSdkStorage } from '@/lib/posthog/sdkStorage.adapter'

const KEY = 'phc_contract_key'

// What posthog-js keeps for the key: its persistence, in a cookie and in
// local and session storage, the parts it keeps beside it, and its consent.
const PERSISTENCE = `ph_${KEY}_posthog`
const WINDOW_ID = `ph_${KEY}_window_id`
const CONSENT = `__ph_opt_in_out_${KEY}`

// What it keeps for another project, and what the app keeps.
const OTHER_PERSISTENCE = 'ph_phc_other_key_posthog'
const APP_VALUE = 'app.theme'

const ORIGINAL_URL = window.location.href

// happy-dom moves the page to another URL through its own handle, which its
// types do not add to window.
const setPageUrl = ({ url }: { url: string }): void =>
  (
    window as unknown as { happyDOM: { setURL: (next: string) => void } }
  ).happyDOM.setURL(url)

const cookieNames = () =>
  document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0]?.trim())
    .filter(Boolean)

afterEach(() => {
  vi.restoreAllMocks()
  cookieNames().forEach((name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  })
  localStorage.clear()
  sessionStorage.clear()
  setPageUrl({ url: ORIGINAL_URL })
})

test('removes every value posthog-js keeps for the key and nothing else', () => {
  ;[PERSISTENCE, CONSENT, OTHER_PERSISTENCE, APP_VALUE].forEach((name) =>
    localStorage.setItem(name, 'stored')
  )
  ;[PERSISTENCE, WINDOW_ID, OTHER_PERSISTENCE].forEach((name) =>
    sessionStorage.setItem(name, 'stored')
  )
  document.cookie = `${PERSISTENCE}=stored; path=/`
  document.cookie = `${OTHER_PERSISTENCE}=stored; path=/`

  removeSdkStorage({ key: KEY })

  expect(Object.keys(localStorage).sort()).toEqual(
    [APP_VALUE, OTHER_PERSISTENCE].sort()
  )
  expect(Object.keys(sessionStorage)).toEqual([OTHER_PERSISTENCE])
  expect(cookieNames()).toEqual([OTHER_PERSISTENCE])
})

// A browser keeps a cookie set on a parent domain apart from one of the same
// name on the host, so only an expiry on that domain removes it.
test('expires the cookie PostHog set on a parent domain', () => {
  setPageUrl({ url: 'https://app.example.com/dashboard' })
  document.cookie = `${PERSISTENCE}=stored; path=/; domain=.example.com`
  expect(cookieNames()).toEqual([PERSISTENCE])
  const written = vi.spyOn(document, 'cookie', 'set')

  removeSdkStorage({ key: KEY })

  expect(written).toHaveBeenCalledWith(
    `${PERSISTENCE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=example.com`
  )
  expect(cookieNames()).toEqual([])
})

// A browser that blocks site data throws on reading either storage.
test('throws nothing when the browser blocks site data', () => {
  const blocked = () => {
    throw new Error('SecurityError')
  }
  vi.spyOn(window, 'localStorage', 'get').mockImplementation(blocked)
  vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(blocked)
  document.cookie = `${PERSISTENCE}=stored; path=/`

  expect(() => removeSdkStorage({ key: KEY })).not.toThrow()
  expect(cookieNames()).toEqual([])
})
