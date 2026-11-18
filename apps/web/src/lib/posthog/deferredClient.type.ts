// A call the deferred client makes on the client once it has one.
export type DeferredCallType<TClient> = (client: TClient) => void

export interface ICreateDeferredClientParams {
  /** The calls held while the client loads; a later one drops the oldest. */
  limit: number
}

export interface IDeferredClientStartParams<TClient> {
  load: () => Promise<TClient>
}

export interface IDeferredClient<TClient> {
  /** Makes the call now while loaded, holds it while loading, else drops it. */
  run(call: DeferredCallType<TClient>): void
  /** The load in flight or the loaded client; undefined while neither. */
  settled(): Promise<TClient | undefined>
  /**
   * Starts one load and resolves to the client, or to undefined when the load
   * fails or a stop overtakes it. A load in flight, or a loaded client, is
   * returned as it is.
   */
  start(
    params: IDeferredClientStartParams<TClient>
  ): Promise<TClient | undefined>
  /** Forgets the client, the load in flight and every held call. */
  stop(): void
}
