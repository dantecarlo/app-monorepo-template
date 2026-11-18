import { describe, expect, test, vi } from 'vitest'

vi.mock('@/lib/i18n/useAppTranslator.hook', () => ({
  useAppTranslator: () => ({
    has: () => false,
    locale: 'en',
    t: (key: string) => key
  })
}))

import { useAppMutation } from '@/lib/query/useAppMutation.hook'
import { useIsAppMutating } from '@/lib/query/useIsAppMutating.hook'
import { createQueryWrapper } from '@/test/query.helper'
import { act, renderHook, waitFor } from '@/test/test.helper'

const SAVE_KEY = ['items', 'save']
// A prefix of the key: an exact match does not count it.
const ITEMS_KEY = ['items']

describe('useIsAppMutating', () => {
  test('is true while a mutation of exactly that key runs, and false once it settles', async () => {
    let finish: (value: string) => void = () => undefined
    const { result } = renderHook(
      () => ({
        exact: useIsAppMutating({ mutationKey: SAVE_KEY }),
        prefix: useIsAppMutating({ mutationKey: ITEMS_KEY }),
        save: useAppMutation<string, void>({
          mutationOptions: {
            mutationFn: () =>
              new Promise<string>((resolve) => {
                finish = resolve
              }),
            mutationKey: SAVE_KEY
          }
        })
      }),
      { wrapper: createQueryWrapper() }
    )

    expect(result.current.exact).toBe(false)

    act(() => result.current.save.mutate())

    await waitFor(() => expect(result.current.exact).toBe(true))
    expect(result.current.prefix).toBe(false)

    act(() => finish('ok'))

    await waitFor(() => expect(result.current.exact).toBe(false))
  })
})
