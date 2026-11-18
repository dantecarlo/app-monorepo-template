'use client'

import type { ISignInWithPasswordParams } from '@app/core'
import { useCallback } from 'react'

import { useAppMutation } from '@/lib/query/useAppMutation.hook'
import { useAppRouter } from '@/lib/routing'
import {
  SIGN_IN_GC_TIME_MS,
  SIGN_IN_REDIRECT_PATH
} from '@/screens/Login/Login.constant'
import { adaptSignedInUser, signInWithPassword } from '@/services/Auth'
import type { ISignedInUser } from '@/services/Auth/auth.type'

/**
 * The sign-in mutation: credentials → auth service → auth gateway. On
 * success it replaces the login route with the home page; a failure is the
 * mutation's error toast, from the AppError's messageKey.
 *
 * A mutation keeps its variables, here the email and the password, in the
 * mutation cache for as long as it lives there. So each sign-in resets the
 * observer once it settles, and the mutation, with no observer left and a
 * zero gcTime, leaves the cache: no password stays behind it.
 */
export const useSignIn = () => {
  const router = useAppRouter()

  const mutation = useAppMutation<
    ISignedInUser,
    ISignInWithPasswordParams
  >({
    mutationOptions: {
      gcTime: SIGN_IN_GC_TIME_MS,
      mutationFn: async (credentials) =>
        adaptSignedInUser(await signInWithPassword(credentials)),
      onSuccess: () => {
        router.replace(SIGN_IN_REDIRECT_PATH)
      }
    }
  })
  const { mutate, reset } = mutation

  const signIn = useCallback(
    (credentials: ISignInWithPasswordParams) => {
      mutate(credentials, { onSettled: reset })
    },
    [mutate, reset]
  )

  return { ...mutation, mutate: signIn }
}
