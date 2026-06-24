import { useAuthStore } from '@/stores/auth.store'

export const useSession = () =>
  useAuthStore((s) => ({ session: s.session, status: s.status }))
