export interface IBuildImageUrlParams {
  path: string
}

export interface IBuildSignedImageUrlParams {
  expiresInSeconds: number
  path: string
}

export interface IImageDeliveryPort {
  buildImageUrl(params: IBuildImageUrlParams): string
  buildSignedImageUrl(params: IBuildSignedImageUrlParams): Promise<string>
}
