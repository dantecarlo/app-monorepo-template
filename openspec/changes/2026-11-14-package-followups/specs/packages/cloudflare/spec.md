# Delta: packages/cloudflare

> **Change:** `2026-11-14-package-followups`

## ADDED Requirements

### Requirement: CLOUDFLARE-20 — A signed image URL is verified before it is served

The cloudflare package SHALL verify a signed image URL with `verifySignedImageUrl`, a function
that reads no environment variable and does no I/O, given the signing secret: it SHALL accept the
URL only when its `sig` equals, compared in constant time, the HMAC-SHA256 hex that the signer
computes with that secret over the same canonical string (the URL path and its query without
`sig`), and its `exp` is later than the current Unix time in seconds; and it SHALL reject every
other URL with a reason: `not_configured` when the secret is empty, `malformed` when the URL
cannot be parsed, `exp` or `sig` is missing or repeated, `exp` is not a whole number of seconds
or `sig` is not 64 lowercase hexadecimal characters, `signature_mismatch` when the signature
differs, and `expired` when a genuine signature has passed its `exp`.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a URL signed with the secret, before it expires

- **GIVEN** a URL signed for 600 seconds with a secret
- **WHEN** it is verified with that secret before the 600 seconds pass
- **THEN** it is valid and carries no reason
- **Test:** `packages/cloudflare/src/signedImageUrl.helper.test.ts` › "verifySignedImageUrl accepts a URL signImageUrl signed, before it expires"

#### Scenario: a URL either adapter signed

- **GIVEN** a URL signed by the R2 adapter with its signing secret, and one signed by the
  Cloudflare Images adapter with its signing key
- **WHEN** each is verified with the secret that signed it
- **THEN** both are valid
- **Test:** `packages/cloudflare/src/signedImageUrl.helper.test.ts` › "verifySignedImageUrl accepts a URL either adapter signed with its secret"

#### Scenario: an expired URL

- **GIVEN** a URL signed for 600 seconds
- **WHEN** it is verified at its `exp`, and again later
- **THEN** both times it is not valid, with the reason `expired`
- **Test:** `packages/cloudflare/src/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects a URL whose exp has passed as expired"

#### Scenario: a tampered signature

- **GIVEN** a signed URL whose `sig` has one hexadecimal character changed
- **WHEN** it is verified
- **THEN** it is not valid, with the reason `signature_mismatch`
- **Test:** `packages/cloudflare/src/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects a tampered signature as a signature mismatch"

#### Scenario: a tampered path, query or expiry

- **GIVEN** a signed URL whose path names another file, one with a query parameter added, one
  with a later `exp`, and one checked with another secret
- **WHEN** each is verified
- **THEN** none is valid, each with the reason `signature_mismatch`
- **Test:** `packages/cloudflare/src/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects a tampered path as a signature mismatch"

#### Scenario: a missing parameter

- **GIVEN** a signed URL with its `exp` removed, and one with its `sig` removed
- **WHEN** each is verified
- **THEN** neither is valid, each with the reason `malformed`
- **Test:** `packages/cloudflare/src/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects a URL missing its exp or sig as malformed"

#### Scenario: a signature of the wrong length

- **GIVEN** a signed URL whose `sig` lost its last character, and one with a character added
- **WHEN** each is verified
- **THEN** neither is valid, each with the reason `malformed`
- **Test:** `packages/cloudflare/src/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects a signature of the wrong length as malformed"

#### Scenario: a repeated parameter, an exp that is not seconds, or no URL

- **GIVEN** a signed URL with a second `sig`, one with a second `exp`, one whose `exp` is not a
  whole number, one whose `sig` is upper-case, and a string that is not a URL
- **WHEN** each is verified
- **THEN** none is valid, each with the reason `malformed`
- **Test:** `packages/cloudflare/src/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects a repeated parameter, an exp that is not seconds and a string that is not a URL as malformed"

#### Scenario: no secret

- **GIVEN** a signed URL
- **WHEN** it is verified with an empty secret
- **THEN** it is not valid, with the reason `not_configured`
- **Test:** `packages/cloudflare/src/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects every URL when no secret is configured"

## MODIFIED Requirements

### Requirement: CLOUDFLARE-01 — Entry point exposes the four adapter factories and the URL verifier

The cloudflare package SHALL expose from its entry point exactly four factories,
createCloudflareImagesDelivery, createCloudflareOriginGuard, createR2SignedDelivery and
createTurnstileBotProtection, each returning a port defined by packages/core, plus
verifySignedImageUrl and its reasons, SignedImageUrlRejectionEnum; no other helper or constant
module is exported.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a consumer imports the package

- **GIVEN** an app that depends on the cloudflare package
- **WHEN** it imports from the package entry point
- **THEN** exactly the four factories, verifySignedImageUrl and SignedImageUrlRejectionEnum are
  available
- **Test:** `packages/cloudflare/src/index.test.ts` › "the entry point exposes the four adapter factories and the signed-URL verifier"

### Requirement: CLOUDFLARE-06 — The secret comparison runs over the whole secret

The cloudflare package SHALL compare a presented secret of the configured length against it
character by character over the full length, accumulating every difference instead of stopping
at the first, with no node:crypto or Buffer so it runs in the edge runtime; the origin guard and
the signed-URL verifier both compare through this one function, isConstantTimeEqual.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a wrong secret of the same length

- **GIVEN** an origin guard created with an origin secret
- **WHEN** it checks a header of the same length whose characters all differ
- **THEN** the result is untrusted, with the reason MISMATCH
- **Test:** `packages/cloudflare/src/createCloudflareOriginGuard.adapter.test.ts` › "assertTrustedOrigin rejects an equal-length mismatch via edge-safe constant-time compare"

#### Scenario: only the last character differs

- **GIVEN** an origin guard created with an origin secret
- **WHEN** it checks a header equal to the secret except for its last character
- **THEN** the result is untrusted, with the reason MISMATCH
- **Test:** `packages/cloudflare/src/createCloudflareOriginGuard.adapter.test.ts` › "assertTrustedOrigin rejects a single trailing-character difference"

#### Scenario: the comparison itself

- **GIVEN** a string, the same string, strings of its length that differ at the first or the
  last character, and strings one character shorter or longer
- **WHEN** isConstantTimeEqual compares each against the first
- **THEN** only the same string is equal
- **Test:** `packages/cloudflare/src/constantTimeEqual.helper.test.ts` › "isConstantTimeEqual is true for the same string only"

#### Scenario: the comparison time does not depend on where the secrets differ

- **GIVEN** two wrong secrets of the configured length, differing at the first and at the last
  character
- **WHEN** the guard compares each
- **THEN** both comparisons visit every character
- **Test:** Not covered — timing is not observable in a unit test; only the loop at the evidence
  line shows it

### Requirement: CLOUDFLARE-12 — A failed siteverify call rejects

The cloudflare package SHALL let a network failure of the siteverify call reject the
verification with that error, never resolving it as successful.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the network is down

- **GIVEN** bot protection created with a secret, and a fetch that rejects
- **WHEN** it verifies a token
- **THEN** the verification rejects with the very error the fetch rejected with
- **Test:** `packages/cloudflare/src/createTurnstileBotProtection.adapter.test.ts` › "verifyToken rejects with the fetch error when siteverify cannot be reached"

### Requirement: CLOUDFLARE-15 — Cloudflare Images signs an expiring URL

The cloudflare package SHALL sign a Cloudflare Images URL, when both the account hash and the
signing key are configured, by adding exp (the current Unix time in seconds plus the requested
lifetime) and then sig, the HMAC-SHA256 hex of the URL path and its query, keyed by the signing
key, through the signer the verifier of CLOUDFLARE-20 shares.

**Evidence:** written at apply time, when the code exists.

#### Scenario: both credentials are configured

- **GIVEN** Cloudflare Images delivery created with an account hash and a signing key
- **WHEN** it builds a signed URL with a lifetime
- **THEN** the URL carries exp and sig
- **Test:** `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.test.ts` › "buildSignedImageUrl appends exp and sig when credentials are present"

#### Scenario: the exact signed URL

- **GIVEN** Cloudflare Images delivery created with an account hash and a signing key, and the
  clock at 2026-01-01T00:00:00Z
- **WHEN** it builds a URL of `img.png` signed for 300 seconds
- **THEN** the URL is the public delivery URL with exp 1767225900 and the HMAC-SHA256 hex of its
  path and that query
- **Test:** `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.test.ts` › "buildSignedImageUrl signs the path and exp with the signing key, at a fixed time"

### Requirement: CLOUDFLARE-16 — Cloudflare Images returns the public URL when it cannot sign

The cloudflare package SHALL return the unsigned public delivery URL from a Cloudflare Images
signed-URL request when the signing key is missing, and the path it was given when the account
hash is missing, as `buildImageUrl` does.

**Evidence:** written at apply time, when the code exists.

#### Scenario: no signing key

- **GIVEN** Cloudflare Images delivery created with an account hash and no signing key
- **WHEN** it builds a signed URL of a path
- **THEN** the result is the public delivery URL of that path, with no exp and no sig
- **Test:** `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.test.ts` › "buildSignedImageUrl falls back to public when no signing key is set"

#### Scenario: no account hash

- **GIVEN** Cloudflare Images delivery created with no account hash
- **WHEN** it builds a signed URL of a path
- **THEN** the path comes back unchanged
- **Test:** `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.test.ts` › "buildSignedImageUrl returns the raw path when no account hash is configured"

### Requirement: CLOUDFLARE-18 — R2 signs an expiring URL

The cloudflare package SHALL sign an R2 URL, when both the public base and the signing secret are
configured, by adding exp (the current Unix time in seconds plus the requested lifetime) and then
sig, the HMAC-SHA256 hex of the URL path and its query, keyed by the signing secret, through the
signer the verifier of CLOUDFLARE-20 shares.

**Evidence:** written at apply time, when the code exists.

#### Scenario: both credentials are configured

- **GIVEN** R2 delivery created with a public base and a signing secret
- **WHEN** it builds a signed URL with a lifetime
- **THEN** the URL carries exp and sig
- **Test:** `packages/cloudflare/src/createR2SignedDelivery.adapter.test.ts` › "buildSignedImageUrl appends exp and sig when credentials are present"

#### Scenario: the exact signed URL

- **GIVEN** R2 delivery created with a public base and a signing secret, and the clock at
  2026-01-01T00:00:00Z
- **WHEN** it builds a URL of `file.png` signed for 600 seconds
- **THEN** the URL is the base and the path with exp 1767226200 and the HMAC-SHA256 hex of its
  path and that query
- **Test:** `packages/cloudflare/src/createR2SignedDelivery.adapter.test.ts` › "buildSignedImageUrl signs the path and exp with the secret, at a fixed time"
