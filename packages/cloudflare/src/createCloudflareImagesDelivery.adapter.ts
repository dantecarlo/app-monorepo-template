import type {
  IBuildImageUrlParams,
  IBuildSignedImageUrlParams,
  IImageDeliveryPort
} from '@app/core'

import {
  CLOUDFLARE_IMAGES_DEFAULT_VARIANT,
  CLOUDFLARE_IMAGES_DELIVERY_BASE
} from '#src/imageDelivery.constant'
import { signImageUrl } from '#src/signedImageUrl.helper'

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
}: ICreateCloudflareImagesDeliveryParams = {}): IImageDeliveryPort => {
  const buildImageUrl = ({ path }: IBuildImageUrlParams): string =>
    accountHash ? buildPublicUrl({ accountHash, path, variant }) : path

  return {
    buildImageUrl,
    buildSignedImageUrl: async ({
      expiresInSeconds,
      path
    }: IBuildSignedImageUrlParams): Promise<string> => {
      if (!accountHash || !signingKey) return buildImageUrl({ path })

      return signImageUrl({
        expiresInSeconds,
        secret: signingKey,
        url: buildPublicUrl({ accountHash, path, variant })
      })
    }
  }
}
