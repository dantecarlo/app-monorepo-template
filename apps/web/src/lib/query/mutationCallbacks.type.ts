import type { MutationOptions } from '@tanstack/react-query'

import type {
  IAppMutationErrorParams,
  IAppMutationMutateParams,
  IAppMutationSettledParams,
  IAppMutationSuccessParams
} from '@/lib/query/useAppMutation.type'

/** What a mutation runs on each outcome, each callback taking one object. */
export interface IMutationCallbacks<TData, TError, TVariables> {
  onError: (params: IAppMutationErrorParams<TError, TVariables>) => void
  /** Left out, the query client's default onMutate stays. */
  onMutate?: (
    params: IAppMutationMutateParams<TVariables>
  ) => Promise<void> | void
  onSettled: (
    params: IAppMutationSettledParams<TData, TError, TVariables>
  ) => void
  onSuccess: (params: IAppMutationSuccessParams<TData, TVariables>) => void
}

/** The same callbacks as TanStack Query calls them, with positional arguments. */
export type MutationCallbacksType<TData, TError, TVariables> = Pick<
  MutationOptions<TData, TError, TVariables>,
  'onError' | 'onMutate' | 'onSettled' | 'onSuccess'
>
