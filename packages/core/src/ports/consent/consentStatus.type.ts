// Where the user stands on consent. `not-required` is a provider set up to ask
// no consent, or no provider at all: a consent banner shows only on `pending`.
export const ConsentStatusEnum = {
  DENIED: 'denied',
  GRANTED: 'granted',
  NOT_REQUIRED: 'not-required',
  PENDING: 'pending'
} as const

export type ConsentStatusType =
  (typeof ConsentStatusEnum)[keyof typeof ConsentStatusEnum]
