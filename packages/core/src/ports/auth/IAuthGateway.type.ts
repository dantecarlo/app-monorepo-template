export interface IAuthSession {
  accessToken: string
  expiresAt: number | null
  userId: string
}

export interface IAuthUser {
  email: string | null
  id: string
}

export interface ISignInWithPasswordParams {
  email: string
  password: string
}

export interface IOnAuthStateChangeParams {
  onChange(params: { session: IAuthSession | null }): void
}

export interface IAuthSubscription {
  unsubscribe(): void
}

export interface IAuthGateway {
  getSession(): Promise<IAuthSession | null>
  onAuthStateChange(params: IOnAuthStateChangeParams): IAuthSubscription
  signIn(params: ISignInWithPasswordParams): Promise<IAuthSession>
  signOut(): Promise<void>
}
