import { create, type StateCreator } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { useShallow as useShallowSelector } from 'zustand/react/shallow'

import { keyValueStorage } from '@/lib/storage'
import type {
  IAppStore,
  ICreateAppStoreParams
} from '@/lib/store/createAppStore.type'

// A persisted store writes through the device's key-value storage port, the
// one seam of AsyncStorage; zustand reads and writes JSON strings through it.
// zustand's StateStorage calls setItem with the name and the value as two
// arguments: they arrive as one list and reach the port as one item.
const deviceStorage = createJSONStorage(() => ({
  getItem: (name: string) => keyValueStorage.getItem({ key: name }),
  removeItem: (name: string) => keyValueStorage.removeItem({ key: name }),
  setItem: (...[name, value]: [name: string, value: string]) =>
    keyValueStorage.setItem({ key: name, value })
}))

/**
 * A typed store, and the only file of this app that imports zustand: every
 * store under src/stores is created here, so a swap of the state library
 * rewrites this file and nothing else. A persisted store keeps the fields
 * its partialize names on the device, under its name.
 */
export const createAppStore = <TState>({
  initializer,
  persist: persistOptions
}: ICreateAppStoreParams<TState>): IAppStore<TState> => {
  // zustand calls a state creator with set, get and the store as three
  // arguments: the initializer takes the first two as one object.
  const stateCreator: StateCreator<TState> = (...[set, get]) =>
    initializer({ get, set })

  const useStore = persistOptions
    ? create<TState>()(
        persist(stateCreator, {
          name: persistOptions.name,
          partialize: persistOptions.partialize,
          storage: deviceStorage
        })
      )
    : create<TState>()(stateCreator)

  const useAppStore = <TSelected>(
    select: (state: TState) => TSelected
  ): TSelected => useStore(select)

  return Object.assign(useAppStore, {
    getInitialState: useStore.getInitialState,
    getState: useStore.getState,
    setState: useStore.setState,
    useShallow: <TSelected>(
      select: (state: TState) => TSelected
    ): TSelected => useStore(useShallowSelector(select))
  })
}
