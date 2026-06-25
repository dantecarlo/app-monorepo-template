// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import type {
  IBuildImageUrlParams,
  IBuildSignedImageUrlParams,
  IImageDeliveryPort
} from './IImageDeliveryPort.type'

export interface ICreatePublicImageDeliveryParams {
  baseUrl?: string
}

const toPublicUrl = ({
  baseUrl,
  path
}: {
  baseUrl: string
  path: string
}) =>
  baseUrl
    ? `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
    : path

export const createPublicImageDelivery = ({
  baseUrl = ''
}: ICreatePublicImageDeliveryParams = {}): IImageDeliveryPort => ({
  buildImageUrl: ({ path }: IBuildImageUrlParams): string =>
    toPublicUrl({ baseUrl, path }),
  buildSignedImageUrl: async ({
    path
  }: IBuildSignedImageUrlParams): Promise<string> =>
    toPublicUrl({ baseUrl, path })
})
