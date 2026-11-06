'use client'

import { useEffect } from 'react'

import type { IUseAuthBootstrapParams } from '@/components/AuthProvider/AuthProvider.type'
import { useAuthStore } from '@/stores/auth.store'

export const useAuthBootstrap = ({
  gateway
}: IUseAuthBootstrapParams): void => {
  const setSession = useAuthStore((s) => s.setSession)
  const setStatus = useAuthStore((s) => s.setStatus)

  useEffect(() => {
    setStatus('loading')

    void gateway.getSession().then((session) => {
      setSession(session)
      setStatus(session ? 'authenticated' : 'unauthenticated')
    })

    const sub = gateway.onAuthStateChange({
      onChange: ({ session }) => {
        setSession(session)
        setStatus(session ? 'authenticated' : 'unauthenticated')
      }
    })

    return () => {
      sub.unsubscribe()
    }
  }, [gateway, setSession, setStatus])
}
