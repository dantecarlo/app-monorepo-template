import {
  buildServiceError,
  type IAuthSession,
  type ISignInWithPasswordParams
} from '@app/core'

import { getAuthGateway } from '@/lib/auth/authGateway.adapter'

/**
 * Signs in with an email and a password through the auth gateway port.
 * Returns the gateway's session; a rejection becomes an AppError whose
 * messageKey the mutation toast resolves, never a field error.
 */
export const signInWithPassword = async ({
  email,
  password
}: ISignInWithPasswordParams): Promise<IAuthSession> => {
  try {
    return await getAuthGateway().signIn({ email, password })
  } catch (error) {
    throw buildServiceError({ error })
  }
}
