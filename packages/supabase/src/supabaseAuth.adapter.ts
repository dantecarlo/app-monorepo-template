import type {
  IAuthGateway,
  IAuthSession,
  IAuthSubscription,
  IOnAuthStateChangeParams,
  ISignInWithPasswordParams
} from '@app/core'

import { fromBackendClient } from '#src/backendClient.adapter'
import type { BackendClientType } from '#src/backendClient.type'

const toAuthSession = (session: {
  access_token: string
  expires_at?: number
  user: { id: string }
}): IAuthSession => ({
  accessToken: session.access_token,
  expiresAt: session.expires_at ?? null,
  userId: session.user.id
})

/**
 * The auth gateway over a backend client of this package: it unwraps the
 * opaque client once and reaches the SDK's auth through it.
 */
export const createSupabaseAuthGateway = ({
  client: backendClient
}: {
  client: BackendClientType
}): IAuthGateway => {
  const client = fromBackendClient({ client: backendClient })
  return {
    getSession: async () => {
      const { data } = await client.auth.getSession()
      if (data.session === null) return null
      return toAuthSession(data.session)
    },

    onAuthStateChange: ({
      onChange
    }: IOnAuthStateChangeParams): IAuthSubscription => {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        onChange({ session: session ? toAuthSession(session) : null })
      })
      return { unsubscribe: () => data.subscription.unsubscribe() }
    },

    signIn: async ({
      email,
      password
    }: ISignInWithPasswordParams): Promise<IAuthSession> => {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      })
      if (error !== null) throw error
      return toAuthSession(data.session)
    },

    signOut: async () => {
      await client.auth.signOut()
    }
  }
}
