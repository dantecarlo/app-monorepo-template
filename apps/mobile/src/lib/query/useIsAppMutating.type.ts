import type { AppMutationKeyType } from '@/lib/query/useAppMutation.type'

export interface IIsAppMutatingParams {
  /** The exact key of the mutation: a mutation under a longer key does not count. */
  mutationKey: AppMutationKeyType
}
