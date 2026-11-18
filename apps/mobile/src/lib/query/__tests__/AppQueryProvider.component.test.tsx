import { describe, expect, test } from 'vitest'

import { AppQueryProvider } from '@/lib/query/AppQueryProvider.component'
import type { IAppQueryProviderProps } from '@/lib/query/AppQueryProvider.type'
import { useAppQuery } from '@/lib/query/useAppQuery.hook'
import { createTestQueryClient } from '@/test/query.helper'
import { renderHook, waitFor } from '@/test/test.helper'

const PROVIDED_KEY = ['provided']
const PROVIDED_DATA = 7

describe('AppQueryProvider', () => {
  test('gives its tree the query client it is handed', async () => {
    const client = createTestQueryClient()
    const Wrapper = ({
      children
    }: Pick<IAppQueryProviderProps, 'children'>) => (
      <AppQueryProvider client={client}>{children}</AppQueryProvider>
    )

    const { result } = renderHook(
      () =>
        useAppQuery<number>({
          queryOptions: {
            queryFn: async () => PROVIDED_DATA,
            queryKey: PROVIDED_KEY
          }
        }),
      { wrapper: Wrapper }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(PROVIDED_DATA)
    expect(client.getQueryData(PROVIDED_KEY)).toBe(PROVIDED_DATA)
  })
})
