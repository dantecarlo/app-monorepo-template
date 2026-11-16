'use client'

import type { ISignInWithPasswordParams } from '@app/core'
import { useRouter } from 'next/navigation'

import { useAppMutation } from '@/lib/query/useAppMutation.hook'
import { SIGN_IN_REDIRECT_PATH } from '@/screens/Login/Login.constant'
import { adaptSignedInUser, signInWithPassword } from '@/services/Auth'
import type { ISignedInUser } from '@/services/Auth/auth.type'

/**
 * The sign-in mutation: credentials → auth service → auth gateway. On
 * success it replaces the login route with the home page; a failure is the
 * mutation's error toast, from the AppError's messageKey.
 */
export const useSignIn = () => {
  const router = useRouter()

  return useAppMutation<ISignedInUser, ISignInWithPasswordParams>({
    mutationOptions: {
      mutationFn: async (credentials) =>
        adaptSignedInUser(await signInWithPassword(credentials)),
      onSuccess: () => {
        router.replace(SIGN_IN_REDIRECT_PATH)
      }
    }
  })
}
