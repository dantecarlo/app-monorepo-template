# packages/cloudflare — living spec

> **Governs:** `packages/cloudflare/src`
> **ID prefix:** `CLOUDFLARE`
> **Derived from:** `docs/infrastructure.md`, `docs/images.md`, `docs/architecture/shared.md`
> **Verified against the code:** 2026-11-14 at `9afce2d`

## Purpose

The cloudflare package implements three packages/core ports for the Cloudflare edge: the origin
guard, which checks the shared-secret header with an edge-safe full-length compare; Turnstile bot
protection, which fails closed in production when no secret is set; and image delivery, which
builds Cloudflare Images and R2 URLs signed with Web Crypto HMAC. The ports themselves belong to
packages/core, and the apps/web composition root wires the adapters and turns a result into a
403 or a 400.

## Requirements

### Requirement: CLOUDFLARE-01 — Entry point exposes the four adapter factories

The cloudflare package SHALL expose from its entry point exactly four factories: createCloudflareImagesDelivery, createCloudflareOriginGuard, createR2SignedDelivery and createTurnstileBotProtection, each returning a port defined by packages/core.

**Evidence:** `packages/cloudflare/src/index.ts:1`, `packages/cloudflare/src/index.ts:4`

#### Scenario: a consumer imports the package

- **GIVEN** an app that depends on the cloudflare package
- **WHEN** it imports from the package entry point
- **THEN** the four factories are available and no helper or constant module is exported
- **Test:** Not covered — every test imports its adapter module directly; only the consumers' typecheck reads the entry point

### Requirement: CLOUDFLARE-02 — Configuration defaults to environment variables

The cloudflare package SHALL default every factory option it is not given to its environment variable: CF_ORIGIN_SECRET for the origin guard, TURNSTILE_SECRET_KEY for bot protection, CLOUDFLARE_IMAGES_ACCOUNT_HASH and CLOUDFLARE_IMAGES_SIGNING_KEY for Cloudflare Images, and R2_PUBLIC_BASE_URL and R2_SECRET_ACCESS_KEY for R2.

**Evidence:** `packages/cloudflare/src/createCloudflareOriginGuard.adapter.ts:41`, `packages/cloudflare/src/createTurnstileBotProtection.adapter.ts:37`, `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.ts:34`, `packages/cloudflare/src/createR2SignedDelivery.adapter.ts:32`

#### Scenario: a factory is called with no options

- **GIVEN** the environment variables of a factory are set
- **WHEN** the factory is called with no argument
- **THEN** the adapter it returns uses those values
- **Test:** Not covered — every test passes its options explicitly

### Requirement: CLOUDFLARE-03 — The origin guard passes every request when no secret is configured

The cloudflare package SHALL make the origin guard report a request as trusted, with the reason NOT_CONFIGURED, whenever no origin secret is configured.

**Evidence:** `packages/cloudflare/src/createCloudflareOriginGuard.adapter.ts:46`

#### Scenario: no origin secret

- **GIVEN** an origin guard created with no origin secret
- **WHEN** it checks a request that carries no origin header
- **THEN** the result is trusted, with the reason NOT_CONFIGURED
- **Test:** `packages/cloudflare/src/createCloudflareOriginGuard.adapter.test.ts` › "assertTrustedOrigin passes through when no secret is configured"

### Requirement: CLOUDFLARE-04 — The origin guard rejects a request without the origin header

The cloudflare package SHALL make the origin guard report a request as untrusted, with the reason MISSING_HEADER, when a secret is configured and the request carries no x-cf-origin-secret header.

**Evidence:** `packages/cloudflare/src/createCloudflareOriginGuard.adapter.ts:54`, `packages/cloudflare/src/cloudflare.constant.ts:10`

#### Scenario: the header is absent

- **GIVEN** an origin guard created with an origin secret
- **WHEN** it checks a request whose x-cf-origin-secret header is absent
- **THEN** the result is untrusted, with the reason MISSING_HEADER
- **Test:** `packages/cloudflare/src/createCloudflareOriginGuard.adapter.test.ts` › "assertTrustedOrigin rejects a missing header"

### Requirement: CLOUDFLARE-05 — The origin guard rejects a header that differs from the secret

The cloudflare package SHALL make the origin guard report a request as untrusted, with the reason MISMATCH, when its x-cf-origin-secret header differs from the configured secret, a header of another length included.

**Evidence:** `packages/cloudflare/src/createCloudflareOriginGuard.adapter.ts:61`, `packages/cloudflare/src/createCloudflareOriginGuard.adapter.ts:28`

#### Scenario: a different value

- **GIVEN** an origin guard created with an origin secret
- **WHEN** it checks a request whose header holds another value
- **THEN** the result is untrusted, with the reason MISMATCH
- **Test:** `packages/cloudflare/src/createCloudflareOriginGuard.adapter.test.ts` › "assertTrustedOrigin rejects a mismatched header"

#### Scenario: a prefix of the secret

- **GIVEN** an origin guard created with an origin secret
- **WHEN** it checks a request whose header holds the secret without its last character
- **THEN** the result is untrusted, with the reason MISMATCH
- **Test:** `packages/cloudflare/src/createCloudflareOriginGuard.adapter.test.ts` › "assertTrustedOrigin rejects a length-mismatch (prefix) header as untrusted"

### Requirement: CLOUDFLARE-06 — The secret comparison runs over the whole secret

The cloudflare package SHALL compare a presented secret of the configured length against it character by character over the full length, accumulating every difference instead of stopping at the first, with no node:crypto or Buffer so it runs in the edge runtime.

**Evidence:** `packages/cloudflare/src/createCloudflareOriginGuard.adapter.ts:30`, `packages/cloudflare/src/createCloudflareOriginGuard.adapter.ts:31`

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

#### Scenario: the comparison time does not depend on where the secrets differ

- **GIVEN** two wrong secrets of the configured length, differing at the first and at the last character
- **WHEN** the guard compares each
- **THEN** both comparisons visit every character
- **Test:** Not covered — timing is not observable in a unit test; only the loop at the evidence line shows it

### Requirement: CLOUDFLARE-07 — The origin guard trusts a matching header

The cloudflare package SHALL make the origin guard report a request as trusted, with no reason, when its x-cf-origin-secret header equals the configured secret.

**Evidence:** `packages/cloudflare/src/createCloudflareOriginGuard.adapter.ts:68`

#### Scenario: the header equals the secret

- **GIVEN** an origin guard created with an origin secret
- **WHEN** it checks a request whose header holds that secret
- **THEN** the result is trusted and carries no reason
- **Test:** `packages/cloudflare/src/createCloudflareOriginGuard.adapter.test.ts` › "assertTrustedOrigin trusts when the header matches the secret"

### Requirement: CLOUDFLARE-08 — Bot protection passes every token outside production when no secret is set

The cloudflare package SHALL make bot protection resolve a verification as successful, without calling Cloudflare, when no Turnstile secret is configured and NODE_ENV is not production.

**Evidence:** `packages/cloudflare/src/createTurnstileBotProtection.adapter.ts:55`

#### Scenario: no secret in development

- **GIVEN** bot protection created with no secret, outside production
- **WHEN** it verifies any token
- **THEN** the result is successful
- **Test:** `packages/cloudflare/src/createTurnstileBotProtection.adapter.test.ts` › "verifyToken no-ops to success when no secret is configured"

### Requirement: CLOUDFLARE-09 — Bot protection fails closed in production when no secret is set

The cloudflare package SHALL make bot protection resolve a verification as unsuccessful, with the error code turnstile-secret-not-configured and an error logged, when no Turnstile secret is configured and NODE_ENV is production.

**Evidence:** `packages/cloudflare/src/createTurnstileBotProtection.adapter.ts:46`, `packages/cloudflare/src/createTurnstileBotProtection.adapter.ts:51`

#### Scenario: no secret in production

- **GIVEN** bot protection created with no secret, and NODE_ENV set to production
- **WHEN** it verifies any token
- **THEN** the result is unsuccessful
- **Test:** `packages/cloudflare/src/createTurnstileBotProtection.adapter.test.ts` › "verifyToken fails CLOSED when no secret is configured in production"

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
- **Test:** `packages/cloudflare/src/createTurnstileBotProtection.adapter.test.ts` › "verifyToken posts the secret and token to siteverify"

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
- **Test:** `packages/cloudflare/src/createTurnstileBotProtection.adapter.test.ts` › "verifyToken maps a successful siteverify response"

#### Scenario: a failed verification

- **GIVEN** siteverify answers failure with error codes
- **WHEN** bot protection verifies a token
- **THEN** the result is unsuccessful and carries those error codes
- **Test:** `packages/cloudflare/src/createTurnstileBotProtection.adapter.test.ts` › "verifyToken maps a failed siteverify response with error codes"

### Requirement: CLOUDFLARE-12 — A failed siteverify call rejects

The cloudflare package SHALL let a network failure of the siteverify call reject the verification with that error, never resolving it as successful.

**Evidence:** `packages/cloudflare/src/createTurnstileBotProtection.adapter.ts:63`

#### Scenario: the network is down

- **GIVEN** bot protection created with a secret, and a fetch that rejects
- **WHEN** it verifies a token
- **THEN** the verification rejects with the fetch error
- **Test:** `packages/cloudflare/src/createTurnstileBotProtection.adapter.test.ts` › "verifyToken does not throw an unhandled rejection on fetch failure"

### Requirement: CLOUDFLARE-13 — Signatures are HMAC-SHA256 over Web Crypto

The cloudflare package SHALL sign a message with HMAC-SHA256 through Web Crypto and return the digest as 64 lowercase hexadecimal characters.

**Evidence:** `packages/cloudflare/src/hmacHexSignature.helper.ts:31`, `packages/cloudflare/src/hmacHexSignature.helper.ts:38`, `packages/cloudflare/src/hmacHexSignature.helper.ts:12`

#### Scenario: a known message and secret

- **GIVEN** a fixed secret and message
- **WHEN** the message is signed
- **THEN** the signature equals the known HMAC-SHA256 hex digest
- **Test:** `packages/cloudflare/src/hmacHexSignature.helper.test.ts` › "hmacHexSignature returns the HMAC-SHA256 hex digest of the message"

#### Scenario: the same input twice

- **GIVEN** a fixed secret and message
- **WHEN** the message is signed twice
- **THEN** both signatures are equal
- **Test:** `packages/cloudflare/src/hmacHexSignature.helper.test.ts` › "hmacHexSignature is deterministic for the same input"

#### Scenario: the digest shape

- **GIVEN** a fixed secret and message
- **WHEN** the message is signed
- **THEN** the signature is 64 lowercase hexadecimal characters
- **Test:** `packages/cloudflare/src/hmacHexSignature.helper.test.ts` › "hmacHexSignature produces a 64-char lowercase hex string"

### Requirement: CLOUDFLARE-14 — Cloudflare Images builds the public delivery URL

The cloudflare package SHALL build a Cloudflare Images URL as the imagedelivery.net base, the account hash, the path without its leading slash and the variant (public by default), and return the path unchanged when no account hash is configured.

**Evidence:** `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.ts:31`, `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.ts:39`, `packages/cloudflare/src/imageDelivery.constant.ts:3`

#### Scenario: an account hash is configured

- **GIVEN** Cloudflare Images delivery created with an account hash
- **WHEN** it builds the URL of a path
- **THEN** the URL carries the account hash
- **Test:** `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.test.ts` › "buildImageUrl builds a delivery url when an account hash is set"

#### Scenario: no account hash

- **GIVEN** Cloudflare Images delivery created with no account hash
- **WHEN** it builds the URL of a path
- **THEN** the path comes back unchanged
- **Test:** `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.test.ts` › "buildImageUrl returns raw path when no account hash is configured"

#### Scenario: the full URL shape

- **GIVEN** Cloudflare Images delivery created with an account hash and no variant
- **WHEN** it builds the URL of a path with a leading slash
- **THEN** the URL is the delivery base, the hash, the path without the slash and the public variant
- **Test:** Not covered — the test asserts only that the URL contains the account hash

### Requirement: CLOUDFLARE-15 — Cloudflare Images signs an expiring URL

The cloudflare package SHALL sign a Cloudflare Images URL, when both the account hash and the signing key are configured, by adding exp (the current Unix time in seconds plus the requested lifetime) and then sig, the HMAC-SHA256 hex of the URL path and its query, keyed by the signing key.

**Evidence:** `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.ts:48`, `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.ts:52`, `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.ts:56`

#### Scenario: both credentials are configured

- **GIVEN** Cloudflare Images delivery created with an account hash and a signing key
- **WHEN** it builds a signed URL with a lifetime
- **THEN** the URL carries exp and sig
- **Test:** `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.test.ts` › "buildSignedImageUrl appends exp and sig when credentials are present"

### Requirement: CLOUDFLARE-16 — Cloudflare Images returns the bare path when it cannot sign

The cloudflare package SHALL return the path it was given, unsigned and without the delivery base, from a Cloudflare Images signed-URL request when the account hash or the signing key is missing.

**Evidence:** `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.ts:44`

#### Scenario: no signing key

- **GIVEN** Cloudflare Images delivery created with an account hash and no signing key
- **WHEN** it builds a signed URL
- **THEN** the result carries no sig
- **Test:** `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.test.ts` › "buildSignedImageUrl falls back to public when no signing key is set"

#### Scenario: the result is the bare path

- **GIVEN** Cloudflare Images delivery created with an account hash and no signing key
- **WHEN** it builds a signed URL of a path
- **THEN** the result is that path, not the public delivery URL
- **Test:** Not covered — the test asserts only that no sig is present

### Requirement: CLOUDFLARE-17 — R2 joins the public base and the path

The cloudflare package SHALL build an R2 URL by joining the public base URL, without its trailing slash, and the path, without its leading slash, and return the path unchanged when no public base is configured.

**Evidence:** `packages/cloudflare/src/createR2SignedDelivery.adapter.ts:27`, `packages/cloudflare/src/createR2SignedDelivery.adapter.ts:28`

#### Scenario: a public base is configured

- **GIVEN** R2 delivery created with a public base URL
- **WHEN** it builds the URL of a path
- **THEN** the URL is the base, a slash and the path
- **Test:** `packages/cloudflare/src/createR2SignedDelivery.adapter.test.ts` › "buildImageUrl joins the public base and path"

#### Scenario: no public base

- **GIVEN** R2 delivery created with an empty public base
- **WHEN** it builds the URL of a path
- **THEN** the path comes back unchanged
- **Test:** `packages/cloudflare/src/createR2SignedDelivery.adapter.test.ts` › "buildImageUrl returns raw path when no public base is configured"

### Requirement: CLOUDFLARE-18 — R2 signs an expiring URL

The cloudflare package SHALL sign an R2 URL, when both the public base and the signing secret are configured, by adding exp (the current Unix time in seconds plus the requested lifetime) and then sig, the HMAC-SHA256 hex of the URL path and its query, keyed by the signing secret.

**Evidence:** `packages/cloudflare/src/createR2SignedDelivery.adapter.ts:46`, `packages/cloudflare/src/createR2SignedDelivery.adapter.ts:50`, `packages/cloudflare/src/createR2SignedDelivery.adapter.ts:54`

#### Scenario: both credentials are configured

- **GIVEN** R2 delivery created with a public base and a signing secret
- **WHEN** it builds a signed URL with a lifetime
- **THEN** the URL carries exp and sig
- **Test:** `packages/cloudflare/src/createR2SignedDelivery.adapter.test.ts` › "buildSignedImageUrl appends exp and sig when credentials are present"

### Requirement: CLOUDFLARE-19 — R2 returns the unsigned URL when it cannot sign

The cloudflare package SHALL return the unsigned R2 URL from a signed-URL request when the public base or the signing secret is missing.

**Evidence:** `packages/cloudflare/src/createR2SignedDelivery.adapter.ts:41`

#### Scenario: no signing secret

- **GIVEN** R2 delivery created with a public base and no signing secret
- **WHEN** it builds a signed URL
- **THEN** the result carries no sig
- **Test:** `packages/cloudflare/src/createR2SignedDelivery.adapter.test.ts` › "buildSignedImageUrl falls back to public when no secret is set"

## Open questions

- **Q1** — `docs/images.md:51` and `docs/images.md:65` say Cloudflare Images falls back to the
  plain public URL when it cannot sign, but
  `packages/cloudflare/src/createCloudflareImagesDelivery.adapter.ts:44` returns the bare path;
  R2 does return the public URL (`packages/cloudflare/src/createR2SignedDelivery.adapter.ts:42`).
  CLOUDFLARE-16 states the code.
- **Q2** — `docs/images.md:41` says a leaked signed URL stops working, but nothing in the
  repository checks the `exp` and `sig` that
  `packages/cloudflare/src/createR2SignedDelivery.adapter.ts:54` writes, and R2 is not known to
  check that form of signature by itself (not verified against Cloudflare).
- **Q3** — The test at `packages/cloudflare/src/createTurnstileBotProtection.adapter.test.ts:30`
  is titled "does not throw an unhandled rejection", but it asserts that the call rejects.
  CLOUDFLARE-12 states the code, which rejects.
