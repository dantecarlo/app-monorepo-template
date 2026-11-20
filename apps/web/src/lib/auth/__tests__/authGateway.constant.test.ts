import { resources } from '@app/i18n'
import { describe, expect, test } from 'vitest'

import {
  SIGN_IN_FAILURE_MESSAGE_KEY,
  SignInFailureEnum
} from '@/lib/auth/authGateway.constant'

// The value a dot-separated key names in a catalog, if any.
const messageAt = ({
  catalog,
  key
}: {
  catalog: object
  key: string
}): unknown =>
  key
    .split('.')
    .reduce<unknown>(
      (node, segment) =>
        node !== null && typeof node === 'object'
          ? (node as Record<string, unknown>)[segment]
          : undefined,
      catalog
    )

describe('auth gateway constants', () => {
  test('names a message every catalog holds for each sign-in failure', () => {
    const keys = Object.values(SignInFailureEnum).map(
      (failure) => SIGN_IN_FAILURE_MESSAGE_KEY[failure]
    )

    expect(keys).toHaveLength(Object.keys(SignInFailureEnum).length)
    for (const { translation } of Object.values(resources)) {
      for (const key of keys) {
        expect(typeof messageAt({ catalog: translation, key }), key).toBe(
          'string'
        )
      }
    }
  })
})
