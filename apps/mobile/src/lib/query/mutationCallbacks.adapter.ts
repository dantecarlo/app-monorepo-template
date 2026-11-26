import type {
  IMutationCallbacks,
  MutationCallbacksType
} from '@/lib/query/mutationCallbacks.type'

/**
 * The callbacks of a mutation as TanStack Query calls them, built from ones
 * that each take a single object. The library calls onError(error,
 * variables), onMutate(variables), onSettled(data, error, variables) and
 * onSuccess(data, variables), each with its own arguments after those: this
 * is the one place that meets that signature, reading each argument list as
 * one tuple. An onMutate left out stays out.
 */
export const toMutationCallbacks = <TData, TError, TVariables>({
  onError,
  onMutate,
  onSettled,
  onSuccess
}: IMutationCallbacks<TData, TError, TVariables>): MutationCallbacksType<
  TData,
  TError,
  TVariables
> => ({
  onError: (...[error, variables]) => onError({ error, variables }),
  ...(onMutate
    ? { onMutate: (variables: TVariables) => onMutate({ variables }) }
    : {}),
  onSettled: (...[data, error, variables]) =>
    onSettled({ data, error, variables }),
  onSuccess: (...[data, variables]) => onSuccess({ data, variables })
})
