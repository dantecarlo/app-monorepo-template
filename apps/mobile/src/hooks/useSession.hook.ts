import { useAuthStore } from '@/stores/auth.store'

// useShallow keeps the same object while the session and the status are
// unchanged: a selector that builds a new object on every read never settles.
export const useSession = () =>
  useAuthStore.useShallow((s) => ({
    session: s.session,
    status: s.status
  }))
