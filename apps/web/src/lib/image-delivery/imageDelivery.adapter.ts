import type { IImageDeliveryPort } from '@app/core'
import { createPublicImageDelivery } from '@app/core'

export const imageDelivery: IImageDeliveryPort =
  createPublicImageDelivery() // DEFAULT
// export const imageDelivery: IImageDeliveryPort = createCloudflareImagesDelivery() // Cloudflare Images signed delivery
// export const imageDelivery: IImageDeliveryPort = createR2SignedDelivery() // R2 presigned delivery
