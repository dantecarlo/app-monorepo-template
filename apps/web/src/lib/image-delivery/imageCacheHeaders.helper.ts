import {
  CACHE_CONTROL_HEADER,
  IMAGE_CACHE_CONTROL_VALUE
} from '@/lib/image-delivery/imageCacheHeaders.constant'

export interface IImageCacheHeader {
  key: string
  value: string
}

export const buildImageCacheHeaders = (): IImageCacheHeader[] => [
  { key: CACHE_CONTROL_HEADER, value: IMAGE_CACHE_CONTROL_VALUE }
]
