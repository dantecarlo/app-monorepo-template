export type CapturePropertiesType = Record<string, unknown>

// The part of a PostHog event the URL scrub reads. The SDK's own event type
// is assignable to it, so the scrub serves as its `before_send`.
export interface ICaptureEvent {
  $set?: CapturePropertiesType
  $set_once?: CapturePropertiesType
  properties: CapturePropertiesType
}

export interface IScrubUrlParams {
  value: string
}

export interface IScrubPropertiesParams {
  properties: CapturePropertiesType
}

export interface IScrubPropertyParams {
  key: string
  value: unknown
}

export interface IScrubHeatmapDataParams {
  data: Record<string, unknown>
}
