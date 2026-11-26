import { create, type StateCreator } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow as useShallowSelector } from 'zustand/react/shallow'

import type {
  IAppStore,
  ICreateAppStoreParams
} from '@/lib/store/createAppStore.type'

/**
 * A typed store, and the only file of this app that imports zustand: every
 * store under src/stores is created here, so a swap of the state library
 * rewrites this file and nothing else. A persisted store keeps the fields
 * its partialize names in local storage, under its name.
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
          partialize: persistOptions.partialize
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
