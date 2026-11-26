import { afterEach, expect, expectTypeOf, test, vi } from 'vitest'

import { createCloudflareImagesDelivery } from '#src/createCloudflareImagesDelivery.adapter'
import { createR2SignedDelivery } from '#src/createR2SignedDelivery.adapter'
import {
  signImageUrl,
  verifySignedImageUrl
} from '#src/signedImageUrl.helper'
import {
  SignedImageUrlRejectionEnum,
  type SignedImageUrlRejectionType,
  type SignedImageUrlVerificationType
} from '#src/signedImageUrl.type'

const SECRET = 'r2-secret'
const OTHER_SECRET = 'another-secret'
const PUBLIC_BASE = 'https://assets.test'
const IMAGE_URL = `${PUBLIC_BASE}/file.png`
const EXPIRES_IN_SECONDS = 600
const FIXED_NOW_MS = Date.parse('2026-01-01T00:00:00Z')
const FIXED_NOW_SECONDS = FIXED_NOW_MS / 1000
const EXPIRY_SECONDS = FIXED_NOW_SECONDS + EXPIRES_IN_SECONDS
const LATER_EXPIRY_SECONDS = EXPIRY_SECONDS + 1000
const VALID = { valid: true }
const EXPIRED = {
  reason: SignedImageUrlRejectionEnum.EXPIRED,
  valid: false
}
const MALFORMED = {
  reason: SignedImageUrlRejectionEnum.MALFORMED,
  valid: false
}
const MISMATCH = {
  reason: SignedImageUrlRejectionEnum.SIGNATURE_MISMATCH,
  valid: false
}

const signAtFixedNow = async ({
  url = IMAGE_URL
}: { url?: string } = {}): Promise<string> => {
  vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW_MS)
  return signImageUrl({
    expiresInSeconds: EXPIRES_IN_SECONDS,
    secret: SECRET,
    url
  })
}

const edit = ({
  change,
  url
}: {
  change: (params: URLSearchParams) => void
  url: string
}): string => {
  const edited = new URL(url)
  change(edited.searchParams)
  return edited.toString()
}

const verifyBeforeExpiry = ({
  secret = SECRET,
  url
}: {
  secret?: string
  url: string
}) =>
  verifySignedImageUrl({
    nowInSeconds: FIXED_NOW_SECONDS,
    secret,
    url
  })

afterEach(() => {
  vi.restoreAllMocks()
})

test('verifySignedImageUrl rejects as expired when the clock is not a finite number', async () => {
  const url = await signAtFixedNow()
  const results = await Promise.all(
    [Number.NaN, Number.POSITIVE_INFINITY].map((nowInSeconds) =>
      verifySignedImageUrl({ nowInSeconds, secret: SECRET, url })
    )
  )
  expect(results).toEqual([EXPIRED, EXPIRED])
})

test('signImageUrl keeps the query of the URL and signs it with exp', async () => {
  const url = await signAtFixedNow({ url: `${IMAGE_URL}?v=2` })
  expect(url).toBe(
    'https://assets.test/file.png?v=2&exp=1767226200&sig=9bc769c82df84d77a3d739a24595288aa788f19ca1d7e245a714fa1946d9a39a'
  )
})

test('verifySignedImageUrl accepts a URL signImageUrl signed, before it expires', async () => {
  const url = await signAtFixedNow()
  const lastValidSecond = EXPIRY_SECONDS - 1
  expect(
    await verifySignedImageUrl({
      nowInSeconds: lastValidSecond,
      secret: SECRET,
      url
    })
  ).toEqual(VALID)
  expect(await verifySignedImageUrl({ secret: SECRET, url })).toEqual(
    VALID
  )
})

test('verifySignedImageUrl accepts a URL that already had a query when it was signed', async () => {
  const url = await signAtFixedNow({ url: `${IMAGE_URL}?v=2` })
  expect(await verifyBeforeExpiry({ url })).toEqual(VALID)
})

test('verifySignedImageUrl accepts a URL either adapter signed with its secret', async () => {
  vi.spyOn(Date, 'now').mockReturnValue(FIXED_NOW_MS)
  const r2Url = await createR2SignedDelivery({
    publicBaseUrl: PUBLIC_BASE,
    signingSecret: SECRET
  }).buildSignedImageUrl({
    expiresInSeconds: EXPIRES_IN_SECONDS,
    path: 'file.png'
  })
  const imagesUrl = await createCloudflareImagesDelivery({
    accountHash: 'acct-hash',
    signingKey: OTHER_SECRET
  }).buildSignedImageUrl({
    expiresInSeconds: EXPIRES_IN_SECONDS,
    path: 'img.png'
  })
  expect(await verifyBeforeExpiry({ url: r2Url })).toEqual(VALID)
  expect(
    await verifyBeforeExpiry({ secret: OTHER_SECRET, url: imagesUrl })
  ).toEqual(VALID)
})

test('verifySignedImageUrl rejects a URL whose exp has passed as expired', async () => {
  const url = await signAtFixedNow()
  expect(
    await verifySignedImageUrl({
      nowInSeconds: EXPIRY_SECONDS,
      secret: SECRET,
      url
    })
  ).toEqual(EXPIRED)
  expect(
    await verifySignedImageUrl({
      nowInSeconds: EXPIRY_SECONDS + 1,
      secret: SECRET,
      url
    })
  ).toEqual(EXPIRED)
})

test('verifySignedImageUrl rejects a tampered signature as a signature mismatch', async () => {
  const url = await signAtFixedNow()
  const tampered = edit({
    change: (params) => {
      const signature = params.get('sig') ?? ''
      const last = signature.endsWith('0') ? '1' : '0'
      params.set('sig', `${signature.slice(0, -1)}${last}`)
    },
    url
  })
  expect(await verifyBeforeExpiry({ url: tampered })).toEqual(MISMATCH)
})

test('verifySignedImageUrl rejects a changed path, an added query, a later exp and another secret as a signature mismatch', async () => {
  const url = await signAtFixedNow()
  const otherFile = url.replace('/file.png', '/other.png')
  const addedQuery = edit({
    change: (params) => params.append('v', '2'),
    url
  })
  const laterExpiry = edit({
    change: (params) => params.set('exp', String(LATER_EXPIRY_SECONDS)),
    url
  })
  expect(await verifyBeforeExpiry({ url: otherFile })).toEqual(MISMATCH)
  expect(await verifyBeforeExpiry({ url: addedQuery })).toEqual(MISMATCH)
  expect(await verifyBeforeExpiry({ url: laterExpiry })).toEqual(MISMATCH)
  expect(await verifyBeforeExpiry({ secret: OTHER_SECRET, url })).toEqual(
    MISMATCH
  )
})

test('verifySignedImageUrl rejects a URL missing its exp or sig as malformed', async () => {
  const url = await signAtFixedNow()
  const noExpiry = edit({ change: (params) => params.delete('exp'), url })
  const noSignature = edit({
    change: (params) => params.delete('sig'),
    url
  })
  expect(await verifyBeforeExpiry({ url: noExpiry })).toEqual(MALFORMED)
  expect(await verifyBeforeExpiry({ url: noSignature })).toEqual(MALFORMED)
  expect(await verifyBeforeExpiry({ url: IMAGE_URL })).toEqual(MALFORMED)
})

test('verifySignedImageUrl rejects a signature of the wrong length as malformed', async () => {
  const url = await signAtFixedNow()
  const shorter = edit({
    change: (params) =>
      params.set('sig', (params.get('sig') ?? '').slice(1)),
    url
  })
  const longer = edit({
    change: (params) => params.set('sig', `${params.get('sig') ?? ''}a`),
    url
  })
  expect(await verifyBeforeExpiry({ url: shorter })).toEqual(MALFORMED)
  expect(await verifyBeforeExpiry({ url: longer })).toEqual(MALFORMED)
})

test('verifySignedImageUrl rejects a repeated parameter, an exp that is not seconds and a string that is not a URL as malformed', async () => {
  const url = await signAtFixedNow()
  const signature = new URL(url).searchParams.get('sig') ?? ''
  const malformed = [
    edit({ change: (params) => params.append('sig', signature), url }),
    edit({
      change: (params) => params.append('exp', String(EXPIRY_SECONDS)),
      url
    }),
    edit({ change: (params) => params.set('exp', '1767226200.5'), url }),
    edit({ change: (params) => params.set('exp', '-1'), url }),
    edit({
      change: (params) => params.set('sig', signature.toUpperCase()),
      url
    }),
    'not a url'
  ]
  const verdicts = await Promise.all(
    malformed.map((candidate) => verifyBeforeExpiry({ url: candidate }))
  )
  expect(verdicts).toEqual(malformed.map(() => MALFORMED))
})

test('verifySignedImageUrl rejects every URL when no secret is configured', async () => {
  const url = await signAtFixedNow()
  expect(await verifyBeforeExpiry({ secret: '', url })).toEqual({
    reason: SignedImageUrlRejectionEnum.NOT_CONFIGURED,
    valid: false
  })
})

test('a verification is either valid with no reason, or rejected with one', () => {
  expectTypeOf<{
    valid: true
  }>().toExtend<SignedImageUrlVerificationType>()
  expectTypeOf<{
    reason: SignedImageUrlRejectionType
    valid: false
  }>().toExtend<SignedImageUrlVerificationType>()
  expectTypeOf<
    Extract<SignedImageUrlVerificationType, { valid: true }>
  >().not.toHaveProperty('reason')
  expectTypeOf<{
    valid: false
  }>().not.toExtend<SignedImageUrlVerificationType>()
})
