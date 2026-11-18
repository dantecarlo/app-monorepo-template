/** What a failed mutation hands the caller's onError. */
export interface IAppMutationErrorParams<TError, TVariables> {
  error: TError
  variables: TVariables
}

/** What a successful mutation hands the caller's onSuccess. */
export interface IAppMutationSuccessParams<TData, TVariables> {
  data: TData
  variables: TVariables
}

/** What a mutation runs, and what it does once it settles. */
export interface IAppMutationConfig<TData, TVariables, TError = Error> {
  /** How long a settled mutation with no observer stays cached, in ms. */
  gcTime?: number
  mutationFn: (variables: TVariables) => Promise<TData>
  onError?: (params: IAppMutationErrorParams<TError, TVariables>) => void
  onSuccess?: (
    params: IAppMutationSuccessParams<TData, TVariables>
  ) => void
}

export interface IAppMutationOptions<TData, TVariables, TError = Error> {
  /** Override the default error toast message */
  errorMessage?: string
  mutationOptions: IAppMutationConfig<TData, TVariables, TError>
  /** Optional success toast message */
  successMessage?: string
}

/** What one call of mutate runs once that call settles. */
export interface IAppMutateCallbacks {
  onSettled?: () => void
}

/** What a component reads from a mutation, and nothing of the library under it. */
export interface IAppMutationResult<TData, TVariables, TError = Error> {
  data: TData | undefined
  error: TError | null
  isError: boolean
  isPending: boolean
  isSuccess: boolean
  /** Runs the mutation with its variables, and the callbacks of this call. */
  mutate: (variables: TVariables, callbacks?: IAppMutateCallbacks) => void
  /** Clears the outcome, and the variables with it. */
  reset: () => void
}
