import type {
  IBuildImageUrlParams,
  IBuildSignedImageUrlParams,
  IImageDeliveryPort
} from '@app/core'

import { hmacHexSignature } from './hmacHexSignature.helper'
import {
  R2_DEFAULT_PUBLIC_BASE,
  SECONDS_TO_MILLISECONDS,
  SIGNED_URL_EXPIRY_QUERY_KEY,
  SIGNED_URL_SIGNATURE_QUERY_KEY
} from './imageDelivery.constant'

export interface ICreateR2SignedDeliveryParams {
  publicBaseUrl?: string
  signingSecret?: string
}

const buildPublicUrl = ({
  path,
  publicBaseUrl
}: {
  path: string
  publicBaseUrl: string
}): string =>
  publicBaseUrl
    ? `${publicBaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
    : path

export const createR2SignedDelivery = ({
  publicBaseUrl = process.env.R2_PUBLIC_BASE_URL ?? R2_DEFAULT_PUBLIC_BASE,
  signingSecret = process.env.R2_SECRET_ACCESS_KEY
}: ICreateR2SignedDeliveryParams = {}): IImageDeliveryPort => ({
  buildImageUrl: ({ path }: IBuildImageUrlParams): string =>
    buildPublicUrl({ path, publicBaseUrl }),
  buildSignedImageUrl: async ({
    expiresInSeconds,
    path
  }: IBuildSignedImageUrlParams): Promise<string> => {
    if (!publicBaseUrl || !signingSecret) {
      return buildPublicUrl({ path, publicBaseUrl })
    }

    const url = new URL(buildPublicUrl({ path, publicBaseUrl }))
    const expiry =
      Math.floor(Date.now() / SECONDS_TO_MILLISECONDS) + expiresInSeconds
    url.searchParams.set(SIGNED_URL_EXPIRY_QUERY_KEY, String(expiry))

    const signature = await hmacHexSignature({
      message: `${url.pathname}?${url.searchParams.toString()}`,
      secret: signingSecret
    })
    url.searchParams.set(SIGNED_URL_SIGNATURE_QUERY_KEY, signature)

    return url.toString()
  }
})
