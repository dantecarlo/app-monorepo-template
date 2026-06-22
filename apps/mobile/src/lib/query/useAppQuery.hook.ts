// Mirrors apps/web/src/lib/query/useAppQuery.hook.ts.
// TanStack Query v5 works identically in React Native.
// 'use client' directive removed — not applicable in RN.

import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
  type QueryKey,
} from '@tanstack/react-query';
import { useToastStore } from '@/stores/toast.store';

export interface AppQueryOptions<TData, TError = Error> {
  queryOptions: UseQueryOptions<TData, TError>;
  adapter?: (raw: TData) => TData;
  errorMessage?: string;
}

export function useAppQuery<TData, TError extends Error = Error>({
  queryOptions,
  adapter,
  errorMessage,
}: AppQueryOptions<TData, TError>): UseQueryResult<TData, TError> {
  const addToast = useToastStore((s) => s.add);

  const result = useQuery<TData, TError>({
    ...queryOptions,
    ...(adapter ? { select: (raw: TData) => adapter(raw) } : {}),
  } as UseQueryOptions<TData, TError, TData, QueryKey>);

  if (result.isError && result.error) {
    const message =
      errorMessage ??
      (result.error instanceof Error ? result.error.message : 'An error occurred');
    setTimeout(() => addToast({ variant: 'error', message }), 0);
  }

  return result;
}
