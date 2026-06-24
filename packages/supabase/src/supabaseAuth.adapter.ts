import type {
  IAuthGateway,
  IAuthSession,
  IAuthSubscription,
  IOnAuthStateChangeParams,
  ISignInWithPasswordParams
} from '@app/core'
import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from './types'

const toAuthSession = (session: {
  access_token: string
  expires_at?: number
  user: { id: string }
}): IAuthSession => ({
  accessToken: session.access_token,
  expiresAt: session.expires_at ?? null,
  userId: session.user.id
})

export const createSupabaseAuthGateway = ({
  client
}: {
  client: SupabaseClient<Database>
}): IAuthGateway => ({
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
})
