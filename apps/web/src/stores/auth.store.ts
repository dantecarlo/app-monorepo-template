import type { IAuthSession } from '@app/core'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

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

// useShallow keeps the same object while the session and the status are
// unchanged: a selector that builds a new object on every read never settles.
export const useSession = () =>
  useAuthStore(
    useShallow((s) => ({ session: s.session, status: s.status }))
  )
