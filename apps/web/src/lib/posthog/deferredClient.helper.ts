import type {
  DeferredCallType,
  ICreateDeferredClientParams,
  IDeferredClient
} from '@/lib/posthog/deferredClient.type'

/**
 * A client that loads on demand. Nothing is loading until `start`; while it
 * loads, every call is held in order, up to `limit`, the oldest dropped
 * first; once it loads, the held calls run in order and every later call
 * runs at once. A failed load drops the held calls and leaves nothing
 * loading. `stop` drops the held calls and every later call at once, and
 * resolves to the client it forgot, or to the one a load it interrupted
 * brings, which is not kept and runs none of the dropped calls; to whoever
 * started that load it resolves to undefined.
 */
export const createDeferredClient = <TClient>({
  limit
}: ICreateDeferredClientParams): IDeferredClient<TClient> => {
  const held: DeferredCallType<TClient>[] = []
  const state: {
    client?: TClient
    loading?: Promise<TClient | undefined>
    // What the load in flight brings, kept or not.
    loaded?: Promise<TClient | undefined>
  } = {}

  const hold = (call: DeferredCallType<TClient>): void => {
    held.push(call)
    if (held.length > limit) held.shift()
  }

  const settle = (client: TClient | undefined): TClient | undefined => {
    state.loading = undefined
    state.loaded = undefined
    state.client = client
    const calls = held.splice(0)
    if (client) calls.forEach((call) => call(client))
    return client
  }

  return {
    run: (call) => {
      if (state.client) {
        call(state.client)
        return
      }
      if (state.loading) hold(call)
    },

    settled: async () => state.loading ?? state.client,

    start: ({ load }) => {
      if (state.client) return Promise.resolve(state.client)
      if (state.loading) return state.loading
      const loaded = load().then(
        (client): TClient | undefined => client,
        () => undefined
      )
      const loading: Promise<TClient | undefined> = loaded.then(
        (client) =>
          state.loading === loading ? settle(client) : undefined
      )
      state.loading = loading
      state.loaded = loaded
      return loading
    },

    stop: async () => {
      const forgotten = state.client ?? state.loaded
      state.client = undefined
      state.loading = undefined
      state.loaded = undefined
      held.length = 0
      return forgotten
    }
  }
}
