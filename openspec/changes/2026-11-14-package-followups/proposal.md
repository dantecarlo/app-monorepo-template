# Proposal: verify signed image URLs, and close the package follow-ups F15 to F18

> **Status:** open

## Why

Writing the living specs found defects in three packages, recorded as follow-ups in the table
"Follow-ups the living specs found" of `docs/INIT_AND_HARNESS_PLAN.md`:

- **F8** (packages/cloudflare): both image adapters sign a URL with an `exp` and a `sig`
  (`packages/cloudflare/src/createR2SignedDelivery.adapter.ts:54`), but nothing in the repository
  checks either, so `docs/images.md:41`, "a leaked URL stops working", holds only where
  Cloudflare checks the URL itself. Cloudflare Images does, for an image that requires signed
  URLs; an R2 bucket does not. The Cloudflare Images fallback also returns the bare path
  (`packages/cloudflare/src/createCloudflareImagesDelivery.adapter.ts:44`) where
  `docs/images.md:51` and `docs/images.md:65` say it returns the public URL. These are Q1 and Q2
  of the packages/cloudflare spec.
- **F15** (packages/cloudflare): the Turnstile test titled "does not throw an unhandled
  rejection" asserts that the call rejects (Q3 of the packages/cloudflare spec).
- **F16** (packages/tooling): the declaration of `signalProcessTree` says it signals the child and
  its descendants, while on POSIX it reaches them only for a child spawned with
  `TREE_SPAWN_OPTIONS` (Q1 of the packages/tooling spec).
- **F18** (packages/core): `scrubPII` returns a graph that shares each scrubbed copy where the
  input shared an object, so a serializer with no depth limit writes a shared copy once per path
  that reaches it. Nothing says so.

F17, the `package-src-alias` fix in `eslint-local-rules/`, changes no living spec (the lint rules
have none, `openspec/README.md` § 2.1), so it is a small change built in its own commit, outside
this folder.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the
  other styles, but everything centralized in styles and the tokens. Fix everything you mention
  applying what is recommended, and once everything is fixed tell the Arquitecto to integrate it
  and fix everything"

The decisions this change applies, taken by the session that runs this follow-up wave and
recorded here:

- F8: verification lives in a pure function of packages/cloudflare, beside the signer, with the
  same secret and the same canonical string. It compares the signature in constant time and
  rejects an expired, malformed or tampered URL. Every caller that serves a signed URL calls it.
  The Cloudflare Images fallback does what `docs/images.md` says.
- F15: the code, the living spec (CLOUDFLARE-12) and the assertion agree that a failed siteverify
  call rejects with its error; only the title disagrees, so the title is renamed.
- F18: documentation only, no behaviour changes.

## What changes

- packages/cloudflare: `verifySignedImageUrl({ secret, url, nowInSeconds? })` returns
  `{ valid: true }` for a URL signed with that secret before its `exp`, and otherwise
  `{ valid: false, reason }`, the reason one of `SignedImageUrlRejectionEnum`: `expired`,
  `malformed` (no URL, an `exp` or `sig` missing or repeated, an `exp` that is not whole seconds,
  a `sig` that is not 64 lowercase hex characters), `not_configured` (no secret) or
  `signature_mismatch`. It reads no environment variable and does no I/O. Both adapters sign
  through one `signImageUrl` beside it, so signer and verifier share the canonical string,
  the URL path and its query without `sig`. The package entry point exports the verifier and
  its reasons.
- packages/cloudflare: the origin guard's full-length comparison moves to
  `isConstantTimeEqual`, which the verifier uses to compare the signature.
- packages/cloudflare: the Cloudflare Images adapter returns the public delivery URL from
  `buildSignedImageUrl` when the signing key is missing, and the path when the account hash is.
- packages/cloudflare: the Turnstile test is renamed "verifyToken rejects with the fetch error
  when siteverify cannot be reached" and asserts the very error fetch rejected with.
- `docs/images.md`: says that Cloudflare Images checks its own signed URLs and an R2 bucket does
  not, so a private R2 object is served by a Worker or a route that calls `verifySignedImageUrl`
  first, from a bucket that is not public; and states the fallback the code now has.
- packages/tooling: the declaration and the JSDoc of `signalProcessTree` say that on POSIX the
  descendants are reached only for a child spawned with `TREE_SPAWN_OPTIONS`.
- packages/core: the contract comment of `scrubPII` and CORE-23 say that the result shares each
  scrubbed copy where the input shared the object, and that Sentry, whose normalization depth
  neither app changes, bounds what it serializes.

## Out of scope

- A route or Worker in apps/web that serves R2 objects: the template serves none today (its
  composition root, `apps/web/src/lib/image-delivery/imageDelivery.adapter.ts`, binds the
  unsigned public delivery), so no caller exists to wire, and the doc says where one goes.
- `docs/maps/global-map.md:74` and `docs/infrastructure.md`, which call the R2 form "presigned":
  they are outside this change's files; the report of this change names them.
- Changing what `scrubPII` returns, or setting a `normalizeDepth` in the Sentry configs.

## Affected specs

- `openspec/specs/packages/cloudflare/spec.md`: CLOUDFLARE-20 added; CLOUDFLARE-01,
  CLOUDFLARE-06, CLOUDFLARE-12, CLOUDFLARE-15, CLOUDFLARE-16 and CLOUDFLARE-18 modified; Q1, Q2
  and Q3 closed.
- `openspec/specs/packages/tooling/spec.md`: TOOLING-12 modified; Q1 closed.
- `openspec/specs/packages/core/spec.md`: CORE-23 modified.
