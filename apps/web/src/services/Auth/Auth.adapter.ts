import type { IAuthSession } from '@app/core'

import type { ISignedInUser } from '@/services/Auth/auth.type'

// Keeps the user id and drops the access token, so the token never sits in
// the mutation cache a screen reads.
export const adaptSignedInUser = (
  session: IAuthSession
): ISignedInUser => ({
  userId: session.userId
})
