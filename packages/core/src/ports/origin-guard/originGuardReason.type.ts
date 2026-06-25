export const OriginGuardReasonEnum = {
  MISMATCH: 'mismatch',
  MISSING_HEADER: 'missing_header',
  NOT_CONFIGURED: 'not_configured'
} as const

export type OriginGuardReasonType =
  (typeof OriginGuardReasonEnum)[keyof typeof OriginGuardReasonEnum]
