import type {
  IBuildImageUrlParams,
  IBuildSignedImageUrlParams,
  IImageDeliveryPort
} from '@app/core'

import { R2_DEFAULT_PUBLIC_BASE } from '#src/imageDelivery.constant'
import { signImageUrl } from '#src/signedImageUrl.helper'

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

    return signImageUrl({
      expiresInSeconds,
      secret: signingSecret,
      url: buildPublicUrl({ path, publicBaseUrl })
    })
  }
})
