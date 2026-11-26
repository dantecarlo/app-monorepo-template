# packages/cloudflare — living spec

> **Governs:** `packages/cloudflare/src`
> **ID prefix:** `CLOUDFLARE`
> **Derived from:** `docs/infrastructure.md`, `docs/images.md`, `docs/architecture/shared.md`
> **Verified against the code:** 2026-11-25 at `12d6b224`

## Purpose

The cloudflare package implements three packages/core ports for the Cloudflare edge: the origin
guard, which checks the shared-secret header with an edge-safe full-length compare; Turnstile bot
protection, which fails closed in production when no secret is set; and image delivery, which
builds Cloudflare Images and R2 URLs signed with Web Crypto HMAC. Beside the signer, a verifier
checks such a URL for whatever serves it. The ports themselves belong to packages/core, and the
apps/web composition root wires the adapters and turns a result into a 403 or a 400.

## Requirements

### Requirement: CLOUDFLARE-01 — Entry point exposes the four adapter factories and the URL verifier

The cloudflare package SHALL expose from its entry point exactly four factories,
createCloudflareImagesDelivery, createCloudflareOriginGuard, createR2SignedDelivery and
createTurnstileBotProtection, each returning a port defined by packages/core, plus
verifySignedImageUrl and its reasons, SignedImageUrlRejectionEnum; no other helper or constant
module is exported.

**Evidence:** `packages/cloudflare/src/index.ts:1`, `packages/cloudflare/src/index.ts:5`, `packages/cloudflare/src/index.ts:11`

#### Scenario: a consumer imports the package

- **GIVEN** an app that depends on the cloudflare package
- **WHEN** it imports from the package entry point
- **THEN** exactly the four factories, verifySignedImageUrl and SignedImageUrlRejectionEnum are
  available
- **Test:** `packages/cloudflare/src/__tests__/index.test.ts` › "the entry point exposes the four adapter factories and the signed-URL verifier"

### Requirement: CLOUDFLARE-02 — Configuration defaults to environment variables

The cloudflare package SHALL default every factory option it is not given to its environment variable: CF_ORIGIN_SECRET for the origin guard, TURNSTILE_SECRET_KEY for bot protection, CLOUDFLARE_IMAGES_ACCOUNT_HASH and CLOUDFLARE_IMAGES_SIGNING_KEY for Cloudflare Images, and R2_PUBLIC_BASE_URL and R2_SECRET_ACCESS_KEY for R2.

**Evidence:** `packages/cloudflare/src/createCloudflareOriginGuard.adapter.ts:16`, `packages/cloudflare/src/createTurnstileBotProtection.adapter.ts:37`, `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.ts:31`, `packages/cloudflare/src/createR2SignedDelivery.adapter.ts:27`

#### Scenario: a factory is called with no options

- **GIVEN** the environment variables of a factory are set
- **WHEN** the factory is called with no argument
- **THEN** the adapter it returns uses those values
- **Test:** Not covered — every test passes its options explicitly

### Requirement: CLOUDFLARE-03 — The origin guard passes every request when no secret is configured

The cloudflare package SHALL make the origin guard report a request as trusted, with the reason NOT_CONFIGURED, whenever no origin secret is configured.

**Evidence:** `packages/cloudflare/src/createCloudflareOriginGuard.adapter.ts:21`

#### Scenario: no origin secret

- **GIVEN** an origin guard created with no origin secret
- **WHEN** it checks a request that carries no origin header
- **THEN** the result is trusted, with the reason NOT_CONFIGURED
- **Test:** `packages/cloudflare/src/__tests__/createCloudflareOriginGuard.adapter.test.ts` › "assertTrustedOrigin passes through when no secret is configured"

### Requirement: CLOUDFLARE-04 — The origin guard rejects a request without the origin header

The cloudflare package SHALL make the origin guard report a request as untrusted, with the reason MISSING_HEADER, when a secret is configured and the request carries no x-cf-origin-secret header.

**Evidence:** `packages/cloudflare/src/createCloudflareOriginGuard.adapter.ts:29`, `packages/cloudflare/src/cloudflare.constant.ts:10`

#### Scenario: the header is absent

- **GIVEN** an origin guard created with an origin secret
- **WHEN** it checks a request whose x-cf-origin-secret header is absent
- **THEN** the result is untrusted, with the reason MISSING_HEADER
- **Test:** `packages/cloudflare/src/__tests__/createCloudflareOriginGuard.adapter.test.ts` › "assertTrustedOrigin rejects a missing header"

### Requirement: CLOUDFLARE-05 — The origin guard rejects a header that differs from the secret

The cloudflare package SHALL make the origin guard report a request as untrusted, with the reason MISMATCH, when its x-cf-origin-secret header differs from the configured secret, a header of another length included.

**Evidence:** `packages/cloudflare/src/createCloudflareOriginGuard.adapter.ts:36`, `packages/cloudflare/src/constantTimeEqual.helper.ts:19`

#### Scenario: a different value

- **GIVEN** an origin guard created with an origin secret
- **WHEN** it checks a request whose header holds another value
- **THEN** the result is untrusted, with the reason MISMATCH
- **Test:** `packages/cloudflare/src/__tests__/createCloudflareOriginGuard.adapter.test.ts` › "assertTrustedOrigin rejects a mismatched header"

#### Scenario: a prefix of the secret

- **GIVEN** an origin guard created with an origin secret
- **WHEN** it checks a request whose header holds the secret without its last character
- **THEN** the result is untrusted, with the reason MISMATCH
- **Test:** `packages/cloudflare/src/__tests__/createCloudflareOriginGuard.adapter.test.ts` › "assertTrustedOrigin rejects a length-mismatch (prefix) header as untrusted"

### Requirement: CLOUDFLARE-06 — The secret comparison runs over the whole secret

The cloudflare package SHALL compare a presented secret of the configured length against it
character by character over the full length, accumulating every difference instead of stopping
at the first, with no node:crypto or Buffer so it runs in the edge runtime; the origin guard and
the signed-URL verifier both compare through this one function, isConstantTimeEqual.

**Evidence:** `packages/cloudflare/src/constantTimeEqual.helper.ts:21`, `packages/cloudflare/src/constantTimeEqual.helper.ts:22`,
`packages/cloudflare/src/createCloudflareOriginGuard.adapter.ts:36`, `packages/cloudflare/src/signedImageUrl.helper.ts:111`

#### Scenario: a wrong secret of the same length

- **GIVEN** an origin guard created with an origin secret
- **WHEN** it checks a header of the same length whose characters all differ
- **THEN** the result is untrusted, with the reason MISMATCH
- **Test:** `packages/cloudflare/src/__tests__/createCloudflareOriginGuard.adapter.test.ts` › "assertTrustedOrigin rejects an equal-length mismatch via edge-safe constant-time compare"

#### Scenario: only the last character differs

- **GIVEN** an origin guard created with an origin secret
- **WHEN** it checks a header equal to the secret except for its last character
- **THEN** the result is untrusted, with the reason MISMATCH
- **Test:** `packages/cloudflare/src/__tests__/createCloudflareOriginGuard.adapter.test.ts` › "assertTrustedOrigin rejects a single trailing-character difference"

#### Scenario: the comparison itself

- **GIVEN** a string, the same string, strings of its length that differ at the first or the
  last character, and strings one character shorter or longer
- **WHEN** isConstantTimeEqual compares each against the first
- **THEN** only the same string is equal
- **Test:** `packages/cloudflare/src/__tests__/constantTimeEqual.helper.test.ts` › "isConstantTimeEqual is true for the same string only"

#### Scenario: the comparison time does not depend on where the secrets differ

- **GIVEN** two wrong secrets of the configured length, differing at the first and at the last
  character
- **WHEN** the guard compares each
- **THEN** both comparisons visit every character
- **Test:** Not covered — timing is not observable in a unit test; only the loop at the evidence
  line shows it

### Requirement: CLOUDFLARE-07 — The origin guard trusts a matching header

The cloudflare package SHALL make the origin guard report a request as trusted, with no reason, when its x-cf-origin-secret header equals the configured secret.

**Evidence:** `packages/cloudflare/src/createCloudflareOriginGuard.adapter.ts:43`

#### Scenario: the header equals the secret

- **GIVEN** an origin guard created with an origin secret
- **WHEN** it checks a request whose header holds that secret
- **THEN** the result is trusted and carries no reason
- **Test:** `packages/cloudflare/src/__tests__/createCloudflareOriginGuard.adapter.test.ts` › "assertTrustedOrigin trusts when the header matches the secret"

### Requirement: CLOUDFLARE-08 — Bot protection passes every token outside production when no secret is set

The cloudflare package SHALL make bot protection resolve a verification as successful, without calling Cloudflare, when no Turnstile secret is configured and NODE_ENV is not production.

**Evidence:** `packages/cloudflare/src/createTurnstileBotProtection.adapter.ts:55`

#### Scenario: no secret in development

- **GIVEN** bot protection created with no secret, outside production
- **WHEN** it verifies any token
- **THEN** the result is successful
- **Test:** `packages/cloudflare/src/__tests__/createTurnstileBotProtection.adapter.test.ts` › "verifyToken no-ops to success when no secret is configured"

### Requirement: CLOUDFLARE-09 — Bot protection fails closed in production when no secret is set

The cloudflare package SHALL make bot protection resolve a verification as unsuccessful, with the error code turnstile-secret-not-configured and an error logged, when no Turnstile secret is configured and NODE_ENV is production.

**Evidence:** `packages/cloudflare/src/createTurnstileBotProtection.adapter.ts:46`, `packages/cloudflare/src/createTurnstileBotProtection.adapter.ts:51`

#### Scenario: no secret in production

- **GIVEN** bot protection created with no secret, and NODE_ENV set to production
- **WHEN** it verifies any token
- **THEN** the result is unsuccessful
- **Test:** `packages/cloudflare/src/__tests__/createTurnstileBotProtection.adapter.test.ts` › "verifyToken fails CLOSED when no secret is configured in production"

#### Scenario: the failure names its cause

- **GIVEN** bot protection created with no secret, and NODE_ENV set to production
- **WHEN** it verifies any token
- **THEN** the result carries the error code turnstile-secret-not-configured
- **Test:** Not covered — the production test asserts only that the result is unsuccessful

### Requirement: CLOUDFLARE-10 — Bot protection posts the secret and token to siteverify

The cloudflare package SHALL verify a token, when a secret is configured, by a POST to the Turnstile siteverify URL whose form body holds the secret, the token as the response field and, when given, the remote IP.

**Evidence:** `packages/cloudflare/src/createTurnstileBotProtection.adapter.ts:58`, `packages/cloudflare/src/createTurnstileBotProtection.adapter.ts:61`, `packages/cloudflare/src/createTurnstileBotProtection.adapter.ts:63`, `packages/cloudflare/src/cloudflare.constant.ts:1`

#### Scenario: a token with a remote IP

- **GIVEN** bot protection created with a secret
- **WHEN** it verifies a token and a remote IP
- **THEN** the posted body holds the secret, the token as response and the IP as remoteip
- **Test:** `packages/cloudflare/src/__tests__/createTurnstileBotProtection.adapter.test.ts` › "verifyToken posts the secret and token to siteverify"

#### Scenario: a token without a remote IP

- **GIVEN** bot protection created with a secret
- **WHEN** it verifies a token with no remote IP
- **THEN** the posted body has no remoteip field
- **Test:** Not covered — the only body test passes a remote IP

### Requirement: CLOUDFLARE-11 — The siteverify response is mapped to the neutral result

The cloudflare package SHALL return the siteverify answer as the neutral bot-verification result of packages/core, carrying success, hostname, challengeTs and errorCodes, so the Cloudflare response shape never leaves the adapter.

**Evidence:** `packages/cloudflare/src/createTurnstileBotProtection.adapter.ts:29`

#### Scenario: a successful verification

- **GIVEN** siteverify answers success with a hostname and a challenge timestamp
- **WHEN** bot protection verifies a token
- **THEN** it calls siteverify once and the result is successful, with that hostname and challengeTs
- **Test:** `packages/cloudflare/src/__tests__/createTurnstileBotProtection.adapter.test.ts` › "verifyToken maps a successful siteverify response"

#### Scenario: a failed verification

- **GIVEN** siteverify answers failure with error codes
- **WHEN** bot protection verifies a token
- **THEN** the result is unsuccessful and carries those error codes
- **Test:** `packages/cloudflare/src/__tests__/createTurnstileBotProtection.adapter.test.ts` › "verifyToken maps a failed siteverify response with error codes"

### Requirement: CLOUDFLARE-12 — A failed siteverify call rejects

The cloudflare package SHALL let a network failure of the siteverify call reject the
verification with that error, never resolving it as successful.

**Evidence:** `packages/cloudflare/src/createTurnstileBotProtection.adapter.ts:63`

#### Scenario: the network is down

- **GIVEN** bot protection created with a secret, and a fetch that rejects
- **WHEN** it verifies a token
- **THEN** the verification rejects with the very error the fetch rejected with
- **Test:** `packages/cloudflare/src/__tests__/createTurnstileBotProtection.adapter.test.ts` › "verifyToken rejects with the fetch error when siteverify cannot be reached"

### Requirement: CLOUDFLARE-13 — Signatures are HMAC-SHA256 over Web Crypto

The cloudflare package SHALL sign a message with HMAC-SHA256 through Web Crypto and return the digest as 64 lowercase hexadecimal characters.

**Evidence:** `packages/cloudflare/src/hmacHexSignature.helper.ts:31`, `packages/cloudflare/src/hmacHexSignature.helper.ts:38`, `packages/cloudflare/src/hmacHexSignature.helper.ts:12`

#### Scenario: a known message and secret

- **GIVEN** a fixed secret and message
- **WHEN** the message is signed
- **THEN** the signature equals the known HMAC-SHA256 hex digest
- **Test:** `packages/cloudflare/src/__tests__/hmacHexSignature.helper.test.ts` › "hmacHexSignature returns the HMAC-SHA256 hex digest of the message"

#### Scenario: the same input twice

- **GIVEN** a fixed secret and message
- **WHEN** the message is signed twice
- **THEN** both signatures are equal
- **Test:** `packages/cloudflare/src/__tests__/hmacHexSignature.helper.test.ts` › "hmacHexSignature is deterministic for the same input"

#### Scenario: the digest shape

- **GIVEN** a fixed secret and message
- **WHEN** the message is signed
- **THEN** the signature is 64 lowercase hexadecimal characters
- **Test:** `packages/cloudflare/src/__tests__/hmacHexSignature.helper.test.ts` › "hmacHexSignature produces a 64-char lowercase hex string"

### Requirement: CLOUDFLARE-14 — Cloudflare Images builds the public delivery URL

The cloudflare package SHALL build a Cloudflare Images URL as the imagedelivery.net base, the account hash, the path without its leading slash and the variant (public by default), and return the path unchanged when no account hash is configured.

**Evidence:** `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.ts:28`, `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.ts:36`, `packages/cloudflare/src/imageDelivery.constant.ts:3`

#### Scenario: an account hash is configured

- **GIVEN** Cloudflare Images delivery created with an account hash
- **WHEN** it builds the URL of a path
- **THEN** the URL carries the account hash
- **Test:** `packages/cloudflare/src/__tests__/createCloudflareImagesDelivery.adapter.test.ts` › "buildImageUrl builds a delivery url when an account hash is set"

#### Scenario: no account hash

- **GIVEN** Cloudflare Images delivery created with no account hash
- **WHEN** it builds the URL of a path
- **THEN** the path comes back unchanged
- **Test:** `packages/cloudflare/src/__tests__/createCloudflareImagesDelivery.adapter.test.ts` › "buildImageUrl returns raw path when no account hash is configured"

#### Scenario: the full URL shape

- **GIVEN** Cloudflare Images delivery created with an account hash and no variant
- **WHEN** it builds the URL of a path with a leading slash
- **THEN** the URL is the delivery base, the hash, the path without the slash and the public variant
- **Test:** Not covered — the test asserts only that the URL contains the account hash

### Requirement: CLOUDFLARE-15 — Cloudflare Images signs an expiring URL

The cloudflare package SHALL sign a Cloudflare Images URL, when both the account hash and the
signing key are configured, by adding exp (the current Unix time in seconds plus the requested
lifetime) and then sig, the HMAC-SHA256 hex of the URL path and its query, keyed by the signing
key, through the signer the verifier of CLOUDFLARE-20 shares.

**Evidence:** `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.ts:46`, `packages/cloudflare/src/signedImageUrl.helper.ts:36`,
`packages/cloudflare/src/signedImageUrl.helper.ts:40`, `packages/cloudflare/src/signedImageUrl.helper.ts:44`

#### Scenario: both credentials are configured

- **GIVEN** Cloudflare Images delivery created with an account hash and a signing key
- **WHEN** it builds a signed URL with a lifetime
- **THEN** the URL carries exp and sig
- **Test:** `packages/cloudflare/src/__tests__/createCloudflareImagesDelivery.adapter.test.ts` › "buildSignedImageUrl appends exp and sig when credentials are present"

#### Scenario: the exact signed URL

- **GIVEN** Cloudflare Images delivery created with an account hash and a signing key, and the
  clock at 2026-01-01T00:00:00Z
- **WHEN** it builds a URL of `img.png` signed for 300 seconds
- **THEN** the URL is the public delivery URL with exp 1767225900 and the HMAC-SHA256 hex of its
  path and that query
- **Test:** `packages/cloudflare/src/__tests__/createCloudflareImagesDelivery.adapter.test.ts` › "buildSignedImageUrl signs the path and exp with the signing key, at a fixed time"

### Requirement: CLOUDFLARE-16 — Cloudflare Images returns the public URL when it cannot sign

The cloudflare package SHALL return the unsigned public delivery URL from a Cloudflare Images
signed-URL request when the signing key is missing, and the path it was given when the account
hash is missing, as `buildImageUrl` does.

**Evidence:** `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.ts:44`, `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.ts:36`

#### Scenario: no signing key

- **GIVEN** Cloudflare Images delivery created with an account hash and no signing key
- **WHEN** it builds a signed URL of a path
- **THEN** the result is the public delivery URL of that path, with no exp and no sig
- **Test:** `packages/cloudflare/src/__tests__/createCloudflareImagesDelivery.adapter.test.ts` › "buildSignedImageUrl falls back to public when no signing key is set"

#### Scenario: no account hash

- **GIVEN** Cloudflare Images delivery created with no account hash
- **WHEN** it builds a signed URL of a path
- **THEN** the path comes back unchanged
- **Test:** `packages/cloudflare/src/__tests__/createCloudflareImagesDelivery.adapter.test.ts` › "buildSignedImageUrl returns the raw path when no account hash is configured"

### Requirement: CLOUDFLARE-17 — R2 joins the public base and the path

The cloudflare package SHALL build an R2 URL by joining the public base URL, without its trailing slash, and the path, without its leading slash, and return the path unchanged when no public base is configured.

**Evidence:** `packages/cloudflare/src/createR2SignedDelivery.adapter.ts:22`, `packages/cloudflare/src/createR2SignedDelivery.adapter.ts:23`

#### Scenario: a public base is configured

- **GIVEN** R2 delivery created with a public base URL
- **WHEN** it builds the URL of a path
- **THEN** the URL is the base, a slash and the path
- **Test:** `packages/cloudflare/src/__tests__/createR2SignedDelivery.adapter.test.ts` › "buildImageUrl joins the public base and path"

#### Scenario: no public base

- **GIVEN** R2 delivery created with an empty public base
- **WHEN** it builds the URL of a path
- **THEN** the path comes back unchanged
- **Test:** `packages/cloudflare/src/__tests__/createR2SignedDelivery.adapter.test.ts` › "buildImageUrl returns raw path when no public base is configured"

### Requirement: CLOUDFLARE-18 — R2 signs an expiring URL

The cloudflare package SHALL sign an R2 URL, when both the public base and the signing secret are
configured, by adding exp (the current Unix time in seconds plus the requested lifetime) and then
sig, the HMAC-SHA256 hex of the URL path and its query, keyed by the signing secret, through the
signer the verifier of CLOUDFLARE-20 shares.

**Evidence:** `packages/cloudflare/src/createR2SignedDelivery.adapter.ts:40`, `packages/cloudflare/src/signedImageUrl.helper.ts:36`,
`packages/cloudflare/src/signedImageUrl.helper.ts:40`, `packages/cloudflare/src/signedImageUrl.helper.ts:44`

#### Scenario: both credentials are configured

- **GIVEN** R2 delivery created with a public base and a signing secret
- **WHEN** it builds a signed URL with a lifetime
- **THEN** the URL carries exp and sig
- **Test:** `packages/cloudflare/src/__tests__/createR2SignedDelivery.adapter.test.ts` › "buildSignedImageUrl appends exp and sig when credentials are present"

#### Scenario: the exact signed URL

- **GIVEN** R2 delivery created with a public base and a signing secret, and the clock at
  2026-01-01T00:00:00Z
- **WHEN** it builds a URL of `file.png` signed for 600 seconds
- **THEN** the URL is the base and the path with exp 1767226200 and the HMAC-SHA256 hex of its
  path and that query
- **Test:** `packages/cloudflare/src/__tests__/createR2SignedDelivery.adapter.test.ts` › "buildSignedImageUrl signs the path and exp with the secret, at a fixed time"

### Requirement: CLOUDFLARE-19 — R2 returns the unsigned URL when it cannot sign

The cloudflare package SHALL return the unsigned R2 URL from a signed-URL request when the public base or the signing secret is missing.

**Evidence:** `packages/cloudflare/src/createR2SignedDelivery.adapter.ts:36`

#### Scenario: no signing secret

- **GIVEN** R2 delivery created with a public base and no signing secret
- **WHEN** it builds a signed URL
- **THEN** the result carries no sig
- **Test:** `packages/cloudflare/src/__tests__/createR2SignedDelivery.adapter.test.ts` › "buildSignedImageUrl falls back to public when no secret is set"

### Requirement: CLOUDFLARE-20 — A signed image URL is verified before it is served

The cloudflare package SHALL accept a signed image URL in `verifySignedImageUrl`, a function
that reads no environment variable and does no I/O, only when its `sig` equals, compared in
constant time, the HMAC-SHA256 hex the signer computes with the given secret over the same
canonical string (the URL path and its query without `sig`) and its `exp` is later than the
current Unix time in seconds, and reject every other URL with its reason: `not_configured` when
the secret is empty; `malformed` when the URL cannot be parsed, `exp` or `sig` is missing or
repeated, `exp` is not a whole number of seconds or `sig` is not 64 lowercase hexadecimal
characters; `signature_mismatch` when the signature differs; and `expired` when a genuine
signature has passed its `exp`, or the clock it is checked against is not a finite number. Its
result, `SignedImageUrlVerificationType`, is either
`{ valid: true }` or `{ valid: false, reason }`.

**Evidence:** `packages/cloudflare/src/signedImageUrl.helper.ts:92`,
`packages/cloudflare/src/signedImageUrl.helper.ts:97`, `packages/cloudflare/src/signedImageUrl.helper.ts:73`,
`packages/cloudflare/src/signedImageUrl.helper.ts:76`, `packages/cloudflare/src/signedImageUrl.helper.ts:77`,
`packages/cloudflare/src/signedImageUrl.helper.ts:106`, `packages/cloudflare/src/signedImageUrl.helper.ts:111`,
`packages/cloudflare/src/signedImageUrl.helper.ts:117`, `packages/cloudflare/src/imageDelivery.constant.ts:11`,
`packages/cloudflare/src/imageDelivery.constant.ts:13`, `packages/cloudflare/src/signedImageUrl.type.ts:24-26`

#### Scenario: a URL signed with the secret, before it expires

- **GIVEN** a URL signed for 600 seconds with a secret
- **WHEN** it is verified with that secret before the 600 seconds pass
- **THEN** it is valid and carries no reason
- **Test:** `packages/cloudflare/src/__tests__/signedImageUrl.helper.test.ts` › "verifySignedImageUrl accepts a URL signImageUrl signed, before it expires"

#### Scenario: a URL that already had a query

- **GIVEN** a URL with the query `?v=2`, signed for 600 seconds with a secret
- **WHEN** it is verified with that secret before the 600 seconds pass
- **THEN** it is valid
- **Test:** `packages/cloudflare/src/__tests__/signedImageUrl.helper.test.ts` › "verifySignedImageUrl accepts a URL that already had a query when it was signed"

#### Scenario: a URL either adapter signed

- **GIVEN** a URL signed by the R2 adapter with its signing secret, and one signed by the
  Cloudflare Images adapter with its signing key
- **WHEN** each is verified with the secret that signed it
- **THEN** both are valid
- **Test:** `packages/cloudflare/src/__tests__/signedImageUrl.helper.test.ts` › "verifySignedImageUrl accepts a URL either adapter signed with its secret"

#### Scenario: an expired URL

- **GIVEN** a URL signed for 600 seconds
- **WHEN** it is verified at its `exp`, and again later
- **THEN** both times it is not valid, with the reason `expired`
- **Test:** `packages/cloudflare/src/__tests__/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects a URL whose exp has passed as expired"

#### Scenario: a clock that is not a finite number

- **GIVEN** a URL signed for 600 seconds
- **WHEN** it is verified against a clock of NaN, and against one of infinity
- **THEN** both times it is not valid, with the reason `expired`
- **Test:** `packages/cloudflare/src/__tests__/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects as expired when the clock is not a finite number"

#### Scenario: a tampered signature

- **GIVEN** a signed URL whose `sig` has one hexadecimal character changed
- **WHEN** it is verified
- **THEN** it is not valid, with the reason `signature_mismatch`
- **Test:** `packages/cloudflare/src/__tests__/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects a tampered signature as a signature mismatch"

#### Scenario: a tampered path, query or expiry, or another secret

- **GIVEN** a signed URL whose path names another file, one with a query parameter added, one
  with a later `exp`, and one checked with another secret
- **WHEN** each is verified
- **THEN** none is valid, each with the reason `signature_mismatch`
- **Test:** `packages/cloudflare/src/__tests__/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects a changed path, an added query, a later exp and another secret as a signature mismatch"

#### Scenario: a missing parameter

- **GIVEN** a signed URL with its `exp` removed, and one with its `sig` removed
- **WHEN** each is verified
- **THEN** neither is valid, each with the reason `malformed`
- **Test:** `packages/cloudflare/src/__tests__/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects a URL missing its exp or sig as malformed"

#### Scenario: a signature of the wrong length

- **GIVEN** a signed URL whose `sig` lost its first character, and one with a character added
- **WHEN** each is verified
- **THEN** neither is valid, each with the reason `malformed`
- **Test:** `packages/cloudflare/src/__tests__/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects a signature of the wrong length as malformed"

#### Scenario: a repeated parameter, an exp that is not seconds, or no URL

- **GIVEN** a signed URL with a second `sig`, one with a second `exp`, one whose `exp` is not a
  whole number, one whose `sig` is upper-case, and a string that is not a URL
- **WHEN** each is verified
- **THEN** none is valid, each with the reason `malformed`
- **Test:** `packages/cloudflare/src/__tests__/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects a repeated parameter, an exp that is not seconds and a string that is not a URL as malformed"

#### Scenario: no secret

- **GIVEN** a signed URL
- **WHEN** it is verified with an empty secret
- **THEN** it is not valid, with the reason `not_configured`
- **Test:** `packages/cloudflare/src/__tests__/signedImageUrl.helper.test.ts` › "verifySignedImageUrl rejects every URL when no secret is configured"

#### Scenario: the result type

- **GIVEN** `SignedImageUrlVerificationType`, the type of the result
- **WHEN** a valid result with no reason and a rejected one with its reason are checked against it,
  and its valid variant is read for a reason, and a rejected result with no reason is checked
- **THEN** the first two are assignable, the valid variant has no reason property, and the rejected
  result with no reason is not assignable
- **Test:** `packages/cloudflare/src/__tests__/signedImageUrl.helper.test.ts` › "a verification is either valid with no reason, or rejected with one"
