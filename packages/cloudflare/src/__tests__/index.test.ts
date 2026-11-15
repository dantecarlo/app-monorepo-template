import { expect, test } from 'vitest'

import * as entry from '#src/index'

test('the entry point exposes the four adapter factories and the signed-URL verifier', () => {
  expect(Object.keys(entry).sort()).toEqual([
    'SignedImageUrlRejectionEnum',
    'createCloudflareImagesDelivery',
    'createCloudflareOriginGuard',
    'createR2SignedDelivery',
    'createTurnstileBotProtection',
    'verifySignedImageUrl'
  ])
  expect(entry.SignedImageUrlRejectionEnum).toEqual({
    EXPIRED: 'expired',
    MALFORMED: 'malformed',
    NOT_CONFIGURED: 'not_configured',
    SIGNATURE_MISMATCH: 'signature_mismatch'
  })
})
