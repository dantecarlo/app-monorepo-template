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

// A valid URL carries no reason; a rejected one always names its reason.
export type SignedImageUrlVerificationType =
  | { reason: SignedImageUrlRejectionType; valid: false }
  | { valid: true }
