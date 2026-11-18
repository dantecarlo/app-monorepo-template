/** A change to a store: some of its fields, or a function of the state that returns them. */
export type AppStoreUpdateType<TState> =
  | Partial<TState>
  | ((state: TState) => Partial<TState>)

/** What an initializer reads and changes the state through. */
export interface IAppStoreAccess<TState> {
  get: () => TState
  set: (update: AppStoreUpdateType<TState>) => void
}

/** A store that survives a new launch of the app. */
export interface IAppStorePersistOptions<TState> {
  /** The storage key. */
  name: string
  /** The fields that survive: every field when absent. */
  partialize?: (state: TState) => Partial<TState>
}

export interface ICreateAppStoreParams<TState> {
  /** The initial state, actions included, built over get and set. */
  initializer: (access: IAppStoreAccess<TState>) => TState
  persist?: IAppStorePersistOptions<TState>
}

/**
 * A store: a hook that returns the value its selector reads, and renders
 * again when that value changes.
 */
export interface IAppStore<TState> {
  <TSelected>(select: (state: TState) => TSelected): TSelected
  getInitialState: () => TState
  getState: () => TState
  setState: (update: AppStoreUpdateType<TState>) => void
  /**
   * A hook for an object or an array built from the state: the same
   * reference while each of its entries is unchanged, so it settles.
   */
  useShallow: <TSelected>(
    select: (state: TState) => TSelected
  ) => TSelected
}
