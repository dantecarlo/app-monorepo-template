import { expect, test } from 'vitest'

import { ConsentStatusEnum } from '#src/index'

test('names the four consent statuses', () => {
  expect(ConsentStatusEnum).toEqual({
    DENIED: 'denied',
    GRANTED: 'granted',
    NOT_REQUIRED: 'not-required',
    PENDING: 'pending'
  })
})
