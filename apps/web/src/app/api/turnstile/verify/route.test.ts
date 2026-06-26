import { NextRequest } from 'next/server'
import { expect, test } from 'vitest'

import { POST } from '@/app/api/turnstile/verify/route'

const VERIFY_URL = 'http://localhost/api/turnstile/verify'
const BAD_REQUEST_STATUS = 400

test('POST returns 400 when the request body is empty', async () => {
  const request = new NextRequest(VERIFY_URL, { method: 'POST' })

  const response = await POST(request)
  const body = (await response.json()) as { success: boolean }

  expect(response.status).toBe(BAD_REQUEST_STATUS)
  expect(body.success).toBe(false)
  expect(response.headers.get('Cache-Control')).toBe('no-store')
})

test('POST returns 400 when the request body is not valid JSON', async () => {
  const request = new NextRequest(VERIFY_URL, {
    body: 'not-json',
    method: 'POST'
  })

  const response = await POST(request)
  const body = (await response.json()) as { success: boolean }

  expect(response.status).toBe(BAD_REQUEST_STATUS)
  expect(body.success).toBe(false)
  expect(response.headers.get('Cache-Control')).toBe('no-store')
})
