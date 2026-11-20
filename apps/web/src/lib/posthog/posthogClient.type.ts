// The PostHog client as this app uses it: the calls the observability and
// consent adapters make. posthogClient.adapter.ts, the one file that imports
// the SDK, assigns the SDK's client to it, so a call the SDK drops or renames
// fails the type check there.

// Every severity PostHog accepts; the port maps onto all of them but `trace`.
export type PostHogLogLevelType =
  | 'debug'
  | 'error'
  | 'fatal'
  | 'info'
  | 'trace'
  | 'warn'

export type PostHogPropertiesType = Record<string, unknown>

export interface IPostHogLogRecord {
  attributes?: PostHogPropertiesType
  body: string
  level?: PostHogLogLevelType
}

export interface IPostHogOptInOptions {
  captureEventName?: false
}

export interface IPostHogResetOptions {
  resetDeviceID?: boolean
}

// The one option the consent API sets after init: whether the SDK requests
// its flags.
export interface IPostHogFlagsConfig {
  advanced_disable_flags: boolean
}

export interface IPostHogClient {
  addExceptionStep(
    message: string,
    properties?: PostHogPropertiesType
  ): void
  captureException(
    error: unknown,
    properties?: PostHogPropertiesType
  ): unknown
  captureLog(record: IPostHogLogRecord): void
  identify(distinctId: string, properties?: PostHogPropertiesType): void
  opt_in_capturing(options?: IPostHogOptInOptions): void
  opt_out_capturing(): void
  reloadFeatureFlags(): void
  reset(options?: IPostHogResetOptions): void
  set_config(config: IPostHogFlagsConfig): void
}
