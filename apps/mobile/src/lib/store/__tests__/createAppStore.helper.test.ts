import { createMemoryKeyValueStorage } from '@app/core'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { createAppStore } from '@/lib/store/createAppStore.helper'
import type {
  IAppStorePersistOptions,
  ICreateAppStoreParams
} from '@/lib/store/createAppStore.type'
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

// The fields a persisted counter keeps across a launch: the count only.
const KEEP_COUNT: IAppStorePersistOptions<ICounterState> = {
  name: PERSIST_NAME,
  partialize: (s) => ({ count: s.count })
}

const counterParams = (
  persist?: IAppStorePersistOptions<ICounterState>
): ICreateAppStoreParams<ICounterState> => ({
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

// A fresh device for the persisted store: the project module that owns the
// device storage is replaced by the in-memory storage of @app/core.
const loadOnDevice = async () => {
  vi.resetModules()
  const device = createMemoryKeyValueStorage()
  vi.doMock('@/lib/storage', () => ({ keyValueStorage: device }))
  const helper = await import('@/lib/store/createAppStore.helper')
  return { create: helper.createAppStore, device }
}

afterEach(() => {
  vi.doUnmock('@/lib/storage')
})

describe('createAppStore', () => {
  test("re-renders a selector's reader when its value changes", () => {
    const useCounter = createAppStore(counterParams())
    const { result } = renderHook(() => useCounter((s) => s.count))

    expect(result.current).toBe(0)

    act(() => useCounter.getState().increment())

    expect(result.current).toBe(1)
  })

  test('keeps the same object for a shallow selection while its fields are unchanged', () => {
    const useCounter = createAppStore(counterParams())
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
    const useCounter = createAppStore(counterParams())

    useCounter.setState({ count: 3 })
    useCounter.getState().double()

    expect(useCounter.getState().count).toBe(6)
    expect(useCounter.getInitialState().count).toBe(0)
  })

  test('keeps the fields partialize names in the device storage, and starts from them', async () => {
    const { create, device } = await loadOnDevice()
    const useSaved = create(counterParams(KEEP_COUNT))

    useSaved.getState().increment()
    useSaved.setState({ label: CHANGED_LABEL })

    await vi.waitFor(async () =>
      expect(
        JSON.parse((await device.getItem({ key: PERSIST_NAME })) ?? 'null')
      ).toEqual(expect.objectContaining({ state: { count: 1 } }))
    )

    const useReloaded = create(counterParams(KEEP_COUNT))

    await vi.waitFor(() => expect(useReloaded.getState().count).toBe(1))
    expect(useReloaded.getState().label).toBe(INITIAL_LABEL)
  })
})
