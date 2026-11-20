import {
  CAPTURE_URL_PROPERTY_PATTERN,
  DIGIT_PATTERN,
  EMAIL_SEGMENT_PATTERN,
  HEATMAP_DATA_PROPERTY,
  PATH_SEGMENT_SEPARATOR,
  REDACTED_SEGMENT,
  SECRET_SEGMENT_MIN_LENGTH,
  URL_ORIGIN_PATTERN,
  URL_SUFFIX_PATTERN,
  WORD_SLUG_PATTERN
} from '@/lib/posthog/scrubCaptureUrls.constant'
import type {
  CapturePropertiesType,
  ICaptureEvent,
  IScrubHeatmapDataParams,
  IScrubPropertiesParams,
  IScrubPropertyParams,
  IScrubSegmentParams,
  IScrubUrlParams
} from '@/lib/posthog/scrubCaptureUrls.type'

// An email, or a long segment that holds a digit and is not a word slug.
const isSecretSegment = ({ segment }: IScrubSegmentParams): boolean =>
  EMAIL_SEGMENT_PATTERN.test(segment) ||
  (segment.length >= SECRET_SEGMENT_MIN_LENGTH &&
    DIGIT_PATTERN.test(segment) &&
    !WORD_SLUG_PATTERN.test(segment))

const scrubPath = ({ value }: IScrubUrlParams): string =>
  value
    .split(PATH_SEGMENT_SEPARATOR)
    .map((segment) =>
      isSecretSegment({ segment }) ? REDACTED_SEGMENT : segment
    )
    .join(PATH_SEGMENT_SEPARATOR)

/**
 * Drops the query string and the fragment of a URL or a path, and replaces
 * every path segment that reads as a secret with `:redacted`. The scheme and
 * the host of a URL are kept, and so is every other segment.
 */
export const scrubUrl = ({ value }: IScrubUrlParams): string => {
  const url = value.replace(URL_SUFFIX_PATTERN, '')
  const [origin = ''] = URL_ORIGIN_PATTERN.exec(url) ?? []
  return `${origin}${scrubPath({ value: url.slice(origin.length) })}`
}

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
 * event, its person or its heatmap leaves without its query string, its
 * fragment and every path segment that reads as a secret. An event an
 * earlier hook dropped stays dropped. The SDK calls it with the event alone.
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
