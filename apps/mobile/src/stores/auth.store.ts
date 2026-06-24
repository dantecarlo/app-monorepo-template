import type { IAuthSession } from '@app/core'
import { create } from 'zustand'

export type AuthStatusType =
  | 'authenticated'
  | 'loading'
  | 'unauthenticated'

interface IAuthState {
  reset: () => void
  session: IAuthSession | null
  setSession: (session: IAuthSession | null) => void
  setStatus: (status: AuthStatusType) => void
  status: AuthStatusType
}

export const selectSession = (s: IAuthState): IAuthSession | null =>
  s.session
export const selectAuthStatus = (s: IAuthState): AuthStatusType => s.status

export const useAuthStore = create<IAuthState>((set) => ({
  reset() {
    set({ session: null, status: 'unauthenticated' })
  },
  session: null,
  setSession(session) {
    set({ session })
  },
  setStatus(status) {
    set({ status })
  },
  status: 'loading'
}))
