import { afterEach, describe, expect, test } from 'vitest'

import { createAppStore } from '@/lib/store/createAppStore.helper'
import type { IAppStorePersistOptions } from '@/lib/store/createAppStore.type'
import { act, renderHook } from '@/test/test.helper'

interface ICounterState {
  count: number
  double: () => void
  increment: () => void
  label: string
  step: number
}

const INITIAL_LABEL = 'start'
const CHANGED_LABEL = 'changed'
const PERSIST_NAME = 'test-counter'

// The fields a persisted counter keeps across a reload: the count only.
const KEEP_COUNT: IAppStorePersistOptions<ICounterState> = {
  name: PERSIST_NAME,
  partialize: (s) => ({ count: s.count })
}

const createCounterStore = (
  persist?: IAppStorePersistOptions<ICounterState>
) =>
  createAppStore<ICounterState>({
    initializer: ({ get, set }) => ({
      count: 0,
      double() {
        set({ count: get().count * 2 })
      },
      increment() {
        set((s) => ({ count: s.count + 1 }))
      },
      label: INITIAL_LABEL,
      step: 1
    }),
    persist
  })

afterEach(() => {
  localStorage.clear()
})

describe('createAppStore', () => {
  test("re-renders a selector's reader when its value changes", () => {
    const useCounter = createCounterStore()
    const { result } = renderHook(() => useCounter((s) => s.count))

    expect(result.current).toBe(0)

    act(() => useCounter.getState().increment())

    expect(result.current).toBe(1)
  })

  test('keeps the same object for a shallow selection while its fields are unchanged', () => {
    const useCounter = createCounterStore()
    const { rerender, result } = renderHook(() =>
      useCounter.useShallow((s) => ({ count: s.count, label: s.label }))
    )
    const first = result.current

    rerender()
    act(() => useCounter.setState({ step: 2 }))

    expect(result.current).toBe(first)

    act(() => useCounter.getState().increment())

    expect(result.current).not.toBe(first)
    expect(result.current).toEqual({ count: 1, label: INITIAL_LABEL })
  })

  test('reads and updates the state outside React', () => {
    const useCounter = createCounterStore()

    useCounter.setState({ count: 3 })
    useCounter.getState().double()

    expect(useCounter.getState().count).toBe(6)
    expect(useCounter.getInitialState().count).toBe(0)
  })

  test('keeps the fields partialize names in local storage, and starts from them', () => {
    const useSaved = createCounterStore(KEEP_COUNT)

    act(() => {
      useSaved.getState().increment()
      useSaved.setState({ label: CHANGED_LABEL })
    })

    expect(
      JSON.parse(localStorage.getItem(PERSIST_NAME) ?? 'null')
    ).toEqual(expect.objectContaining({ state: { count: 1 } }))

    const useReloaded = createCounterStore(KEEP_COUNT)

    expect(useReloaded.getState().count).toBe(1)
    expect(useReloaded.getState().label).toBe(INITIAL_LABEL)
  })
})
