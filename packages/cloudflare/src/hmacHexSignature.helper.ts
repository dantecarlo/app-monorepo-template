import {
  HMAC_HASH_ALGORITHM,
  HMAC_HEX_RADIX,
  HMAC_KEY_USAGE,
  HMAC_SIGN_ALGORITHM
} from './imageDelivery.constant'

const textEncoder = new TextEncoder()

const toHex = (signature: ArrayBuffer): string =>
  Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(HMAC_HEX_RADIX).padStart(2, '0'))
    .join('')

/**
 * Edge-safe HMAC-SHA256 hex signature.
 *
 * The cloudflare package is reachable from the Next.js EDGE runtime through the
 * `apps/web` middleware import graph, where `node:crypto` is unavailable and
 * crashes the request. This helper uses Web Crypto (`globalThis.crypto.subtle`),
 * which is present in both the edge runtime and Node, and returns the same hex
 * digest the previous `createHmac(...).digest('hex')` produced.
 */
export const hmacHexSignature = async ({
  message,
  secret
}: {
  message: string
  secret: string
}): Promise<string> => {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { hash: HMAC_HASH_ALGORITHM, name: HMAC_SIGN_ALGORITHM },
    false,
    [HMAC_KEY_USAGE]
  )
  const signature = await crypto.subtle.sign(
    HMAC_SIGN_ALGORITHM,
    key,
    textEncoder.encode(message)
  )
  return toHex(signature)
}
