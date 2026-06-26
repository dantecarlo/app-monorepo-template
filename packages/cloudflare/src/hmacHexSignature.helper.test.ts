import { expect, test } from 'vitest'

import { hmacHexSignature } from './hmacHexSignature.helper'

const SECRET = 'r2-secret'
const MESSAGE = '/file.png?exp=600'

test('hmacHexSignature returns the HMAC-SHA256 hex digest of the message', async () => {
  const signature = await hmacHexSignature({
    message: MESSAGE,
    secret: SECRET
  })
  expect(signature).toBe(
    '7321e49ad17daf44a20793a1b438263b2fdf8570358e285fe1cd0c9dfd236d57'
  )
})

test('hmacHexSignature is deterministic for the same input', async () => {
  const first = await hmacHexSignature({
    message: MESSAGE,
    secret: SECRET
  })
  const second = await hmacHexSignature({
    message: MESSAGE,
    secret: SECRET
  })
  expect(first).toBe(second)
})

test('hmacHexSignature produces a 64-char lowercase hex string', async () => {
  const signature = await hmacHexSignature({
    message: MESSAGE,
    secret: SECRET
  })
  expect(signature).toMatch(/^[0-9a-f]{64}$/)
})
