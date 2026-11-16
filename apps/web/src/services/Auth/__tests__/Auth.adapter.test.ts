import type { IAuthSession } from '@app/core'
import { describe, expect, test } from 'vitest'

import { adaptSignedInUser } from '@/services/Auth/Auth.adapter'

describe('adaptSignedInUser', () => {
  test('keeps the user id and drops the access token', () => {
    const session: IAuthSession = {
      accessToken: 'access-token',
      expiresAt: 1_900_000_000,
      userId: 'usr_1'
    }

    expect(adaptSignedInUser(session)).toEqual({ userId: 'usr_1' })
  })
})
