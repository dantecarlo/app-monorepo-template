import { createHmac } from 'node:crypto'

import type {
  IBuildImageUrlParams,
  IBuildSignedImageUrlParams,
  IImageDeliveryPort
} from '@app/core'

import {
  CLOUDFLARE_IMAGES_DEFAULT_VARIANT,
  CLOUDFLARE_IMAGES_DELIVERY_BASE,
  HMAC_ALGORITHM,
  HMAC_DIGEST_ENCODING,
  SECONDS_TO_MILLISECONDS,
  SIGNED_URL_EXPIRY_QUERY_KEY,
  SIGNED_URL_SIGNATURE_QUERY_KEY
} from './imageDelivery.constant'

export interface ICreateCloudflareImagesDeliveryParams {
  accountHash?: string
  signingKey?: string
  variant?: string
}

const buildPublicUrl = ({
  accountHash,
  path,
  variant
}: {
  accountHash: string
  path: string
  variant: string
}): string =>
  `${CLOUDFLARE_IMAGES_DELIVERY_BASE}/${accountHash}/${path.replace(/^\//, '')}/${variant}`

export const createCloudflareImagesDelivery = ({
  accountHash = process.env.CLOUDFLARE_IMAGES_ACCOUNT_HASH,
  signingKey = process.env.CLOUDFLARE_IMAGES_SIGNING_KEY,
  variant = CLOUDFLARE_IMAGES_DEFAULT_VARIANT
}: ICreateCloudflareImagesDeliveryParams = {}): IImageDeliveryPort => ({
  buildImageUrl: ({ path }: IBuildImageUrlParams): string =>
    accountHash ? buildPublicUrl({ accountHash, path, variant }) : path,
  buildSignedImageUrl: async ({
    expiresInSeconds,
    path
  }: IBuildSignedImageUrlParams): Promise<string> => {
    if (!accountHash || !signingKey) return path

    const publicUrl = buildPublicUrl({ accountHash, path, variant })
    const url = new URL(publicUrl)
    const expiry =
      Math.floor(Date.now() / SECONDS_TO_MILLISECONDS) + expiresInSeconds
    url.searchParams.set(SIGNED_URL_EXPIRY_QUERY_KEY, String(expiry))

    const signature = createHmac(HMAC_ALGORITHM, signingKey)
      .update(`${url.pathname}?${url.searchParams.toString()}`)
      .digest(HMAC_DIGEST_ENCODING)
    url.searchParams.set(SIGNED_URL_SIGNATURE_QUERY_KEY, signature)

    return url.toString()
  }
})
