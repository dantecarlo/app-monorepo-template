import {
  CAPTURE_URL_PROPERTY_PATTERN,
  HEATMAP_DATA_PROPERTY,
  URL_SUFFIX_PATTERN
} from '@/lib/posthog/scrubCaptureUrls.constant'
import type {
  CapturePropertiesType,
  ICaptureEvent,
  IScrubHeatmapDataParams,
  IScrubPropertiesParams,
  IScrubPropertyParams,
  IScrubUrlParams
} from '@/lib/posthog/scrubCaptureUrls.type'

/** Drops the query string and the fragment of a URL or a path. */
export const scrubUrl = ({ value }: IScrubUrlParams): string =>
  value.replace(URL_SUFFIX_PATTERN, '')

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const toPoints = (points: unknown): unknown[] =>
  Array.isArray(points) ? points : [points]

// Two URLs that scrub to the same key merge their points.
const scrubHeatmapData = ({
  data
}: IScrubHeatmapDataParams): Record<string, unknown[]> =>
  Object.entries(data).reduce<Record<string, unknown[]>>(
    (scrubbed, [url, points]) => {
      const key = scrubUrl({ value: url })
      scrubbed[key] = [...(scrubbed[key] ?? []), ...toPoints(points)]
      return scrubbed
    },
    {}
  )

const scrubProperty = ({ key, value }: IScrubPropertyParams): unknown => {
  if (key === HEATMAP_DATA_PROPERTY && isRecord(value)) {
    return scrubHeatmapData({ data: value })
  }
  if (
    CAPTURE_URL_PROPERTY_PATTERN.test(key) &&
    typeof value === 'string'
  ) {
    return scrubUrl({ value })
  }
  return value
}

const scrubProperties = ({
  properties
}: IScrubPropertiesParams): CapturePropertiesType =>
  Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [
      key,
      scrubProperty({ key, value })
    ])
  )

/**
 * The `before_send` of the PostHog client. Every URL the SDK attaches to an
 * event, its person or its heatmap leaves without its query string and its
 * fragment. An event an earlier hook dropped stays dropped. The SDK calls
 * it with the event alone.
 */
export const scrubCaptureUrls = <TEvent extends ICaptureEvent>(
  event: TEvent | null
): TEvent | null => {
  if (!event) return event

  const { $set, $set_once, properties } = event

  return {
    ...event,
    ...($set && { $set: scrubProperties({ properties: $set }) }),
    ...($set_once && {
      $set_once: scrubProperties({ properties: $set_once })
    }),
    properties: scrubProperties({ properties })
  }
}
