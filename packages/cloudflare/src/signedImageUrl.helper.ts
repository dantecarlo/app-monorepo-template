import { hmacHexSignature } from '#src/hmacHexSignature.helper'
import {
  SECONDS_TO_MILLISECONDS,
  SIGNED_URL_EXPIRY_QUERY_KEY,
  SIGNED_URL_SIGNATURE_QUERY_KEY
} from '#src/imageDelivery.constant'
import type { ISignImageUrlParams } from '#src/signedImageUrl.type'

// The string both adapters sign: the URL path and its query, `exp` included
// and `sig` not yet appended.
const toCanonicalMessage = ({ url }: { url: URL }): string =>
  `${url.pathname}?${url.searchParams.toString()}`

const currentUnixSeconds = (): number =>
  Math.floor(Date.now() / SECONDS_TO_MILLISECONDS)

/**
 * Adds `exp` (now, in Unix seconds, plus `expiresInSeconds`) to `url`, then
 * `sig`, the HMAC-SHA256 hex of the canonical message keyed by `secret`.
 */
export const signImageUrl = async ({
  expiresInSeconds,
  secret,
  url
}: ISignImageUrlParams): Promise<string> => {
  const signed = new URL(url)
  signed.searchParams.set(
    SIGNED_URL_EXPIRY_QUERY_KEY,
    String(currentUnixSeconds() + expiresInSeconds)
  )
  const signature = await hmacHexSignature({
    message: toCanonicalMessage({ url: signed }),
    secret
  })
  signed.searchParams.set(SIGNED_URL_SIGNATURE_QUERY_KEY, signature)
  return signed.toString()
}
