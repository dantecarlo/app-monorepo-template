declare const BACKEND_CLIENT_BRAND: unique symbol

/**
 * The backend client as it leaves this package: opaque, so an app that
 * holds one names no Supabase type and cannot reach the SDK through it.
 * Only backendClient.adapter.ts turns an SDK client into one and back, for
 * this package's own adapters.
 */
export type BackendClientType = {
  readonly [BACKEND_CLIENT_BRAND]: typeof BACKEND_CLIENT_BRAND
}
