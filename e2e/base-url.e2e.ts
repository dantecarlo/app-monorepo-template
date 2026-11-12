import { expect, test } from '@playwright/test'

import { BASE_URL_PROTOCOLS } from './base-url.constant'

// Guards the shared baseURL resolution in playwright.config.ts. CI passes
// `E2E_BASE_URL: ${{ vars.E2E_BASE_URL }}`, which is an empty string when the
// repository variable is not defined; an empty baseURL makes every relative
// page.goto fail with "Cannot navigate to invalid URL".
test('baseURL resolves to an absolute http(s) URL', ({ baseURL }) => {
  expect(baseURL, 'baseURL must not be empty').toBeTruthy()

  const { protocol } = new URL(baseURL ?? '')

  expect(BASE_URL_PROTOCOLS).toContain(protocol)
})
