export const SignedImageUrlRejectionEnum = {
  EXPIRED: 'expired',
  MALFORMED: 'malformed',
  NOT_CONFIGURED: 'not_configured',
  SIGNATURE_MISMATCH: 'signature_mismatch'
} as const

export type SignedImageUrlRejectionType =
  (typeof SignedImageUrlRejectionEnum)[keyof typeof SignedImageUrlRejectionEnum]

export interface ISignImageUrlParams {
  expiresInSeconds: number
  secret: string
  url: string
}

export interface IVerifySignedImageUrlParams {
  nowInSeconds?: number
  secret: string
  url: string
}

export interface ISignedImageUrlVerification {
  reason?: SignedImageUrlRejectionType
  valid: boolean
}
