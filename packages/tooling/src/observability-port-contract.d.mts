/** The severity levels of the observability port, as plain strings. */
export type ObservabilityContractLevelType =
  | 'debug'
  | 'error'
  | 'fatal'
  | 'info'
  | 'warning'

/**
 * The observability port as the contract calls it. `IObservabilityPort` of
 * `@app/core` is assignable to it; the tooling package depends on no
 * workspace package, so the shape is restated here.
 */
export interface IObservabilityContractPort {
  addBreadcrumb?(params: {
    category?: string
    data?: Record<string, unknown>
    level?: ObservabilityContractLevelType
    message: string
  }): void
  captureError(params: {
    context?: Record<string, unknown>
    error: unknown
  }): void
  captureMessage?(params: {
    context?: Record<string, unknown>
    level?: ObservabilityContractLevelType
    message: string
  }): void
  setUser?(params: { user: { email?: string; id: string } | null }): void
}

/** What an adapter's test reports about the provider behind it. */
export interface IObservabilityPortHarness {
  /** The adapter, its provider configured or not; forgets what was delivered. */
  create(params: {
    enabled: boolean
  }): IObservabilityContractPort | Promise<IObservabilityContractPort>
  /** The user the provider holds now, or null. */
  currentUser(): { id?: unknown } | null | undefined
  /** Every payload handed to the provider since the last create(). */
  delivered(): unknown[]
  /** False for an adapter with no provider behind it. */
  delivers: boolean
}

export interface IObservabilityPortContractCase {
  run(params: { harness: IObservabilityPortHarness }): Promise<void>
  title: string
}

/** The contract cases, in the order they register. */
export declare const OBSERVABILITY_PORT_CONTRACT: readonly IObservabilityPortContractCase[]

/** Registers one test per contract case, through the caller's runner. */
export declare const runObservabilityPortContract: (params: {
  harness: IObservabilityPortHarness
  test: (title: string, run: () => Promise<void>) => unknown
}) => void
