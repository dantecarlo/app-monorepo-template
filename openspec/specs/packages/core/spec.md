# packages/core — living spec

> **Governs:** `packages/core/src`
> **ID prefix:** `CORE`
> **Derived from:** `AGENTS.md`, `docs/architecture/shared.md`, `docs/code-standards.md`, `docs/maps/global-map.md`
> **Verified against the code:** 2026-11-14 at `9afce2d`

## Purpose

The core package is the framework-agnostic domain layer the apps and the adapter packages build
on. It holds the typed `AppError` and its service-error mapping, and the PII scrubber and
query-key sanitizer that observability sinks rely on. It declares the ports (auth gateway,
backend client, bot protection, image delivery, observability, origin guard) and ships
vendor-free defaults for four of them. The vendor implementations live elsewhere: the auth
gateway, backend client and service-error mapper in packages/supabase; the origin guard, bot
protection and image delivery in packages/cloudflare; the catalogs the message keys resolve in,
in packages/i18n; the Sentry adapters and the error resolver in apps/web and apps/mobile.

## Requirements

### Requirement: CORE-01 — A typed application error

The core package SHALL build an `AppError` as an `Error` named `AppError` whose `message` is its
`code`, carrying the `code` and the optional `messageKey` it is given.

**Evidence:** `packages/core/src/errors/AppError.helper.ts:11-15`

#### Scenario: the message is the code

- **GIVEN** the code `NETWORK_ERROR`
- **WHEN** an `AppError` is built with it
- **THEN** its `message` is `NETWORK_ERROR`
- **Test:** `packages/core/src/errors/AppError.helper.test.ts` › "message equals the code string"

#### Scenario: the name is fixed

- **GIVEN** any code
- **WHEN** an `AppError` is built with it
- **THEN** its `name` is `AppError`
- **Test:** `packages/core/src/errors/AppError.helper.test.ts` › "name is always "AppError""

#### Scenario: no message key is given

- **GIVEN** a code and no `messageKey`
- **WHEN** an `AppError` is built with them
- **THEN** its `messageKey` is undefined
- **Test:** `packages/core/src/errors/AppError.helper.test.ts` › "messageKey is undefined when not provided"

### Requirement: CORE-02 — The cause is kept only when given

The core package SHALL set `cause` on an `AppError` only when the caller passes one.

**Evidence:** `packages/core/src/errors/AppError.helper.ts:17-19`

#### Scenario: a cause is passed

- **GIVEN** an original `Error`
- **WHEN** an `AppError` is built with it as `cause`
- **THEN** the `cause` of the `AppError` is that same `Error`
- **Test:** `packages/core/src/errors/AppError.helper.test.ts` › "cause is attached when provided"

#### Scenario: no cause is passed

- **GIVEN** a code alone
- **WHEN** an `AppError` is built with it
- **THEN** its `cause` is undefined
- **Test:** `packages/core/src/errors/AppError.helper.test.ts` › "cause is not set when omitted"

### Requirement: CORE-03 — An AppError narrows by instanceof

The core package SHALL keep `AppError` on the prototype chain of every instance, so both
`instanceof AppError` and `instanceof Error` hold for it.

**Evidence:** `packages/core/src/errors/AppError.helper.ts:21`

#### Scenario: an AppError is an Error

- **GIVEN** an `AppError`
- **WHEN** it is tested with `instanceof Error`
- **THEN** the test holds
- **Test:** `packages/core/src/errors/AppError.helper.test.ts` › "is instanceof Error (prototype chain fix)"

#### Scenario: a caught AppError is narrowed

- **GIVEN** a thrown `AppError` with a code and a message key
- **WHEN** a `catch` narrows it with `instanceof AppError`
- **THEN** the narrowed value exposes that code and that message key
- **Test:** `packages/core/src/errors/AppError.helper.test.ts` › "can be caught and narrowed by instanceof AppError"

### Requirement: CORE-04 — An AppError passes through unchanged

The core package SHALL return an `AppError` given to `buildServiceError` as the same instance,
before any mapper is consulted.

**Evidence:** `packages/core/src/errors/buildServiceError.helper.ts:17`

#### Scenario: an AppError is built again

- **GIVEN** an `AppError` with the code `FORBIDDEN`
- **WHEN** `buildServiceError` receives it
- **THEN** it returns that same instance
- **Test:** `packages/core/src/errors/buildServiceError.helper.test.ts` › "passes an existing AppError through unchanged"

#### Scenario: an AppError with a mapper

- **GIVEN** an `AppError` and an injected mapper
- **WHEN** `buildServiceError` receives both
- **THEN** it returns the same instance and never calls the mapper
- **Test:** Not covered — the pass-through test passes no mapper, so nothing observes that the
  mapper is skipped.

### Requirement: CORE-05 — A mapped provider error

The core package SHALL turn an error the injected `IServiceErrorMapper` maps into an `AppError`
with the mapper's code, the message key of that code and the raw error as `cause`.

**Evidence:** `packages/core/src/errors/buildServiceError.helper.ts:19-27`

#### Scenario: the mapper recognizes the error

- **GIVEN** a mapper that returns `FORBIDDEN`
- **WHEN** `buildServiceError` receives an `Error` and that mapper
- **THEN** the mapper is called with the error, and the result has the code `FORBIDDEN` and the
  message key `helper.error.forbidden`
- **Test:** `packages/core/src/errors/buildServiceError.helper.test.ts` › "delegates to the injected mapper when provided"

#### Scenario: the raw error is kept

- **GIVEN** a mapper that returns `SERVER_ERROR` for a provider error
- **WHEN** `buildServiceError` receives that error and that mapper
- **THEN** the `cause` of the result is the provider error itself
- **Test:** `packages/core/src/errors/buildServiceError.helper.test.ts` › "attaches the raw error as cause when the mapper maps it"

### Requirement: CORE-06 — An unmapped error becomes UNKNOWN

The core package SHALL turn any other thrown value, given no mapper or a mapper that returns
null, into an `AppError` with the code `UNKNOWN`, the message key `helper.error.generic` and the
value as `cause`.

**Evidence:** `packages/core/src/errors/buildServiceError.helper.ts:30-35`

#### Scenario: a thrown string

- **GIVEN** the thrown value `'boom'` and no mapper
- **WHEN** `buildServiceError` receives it
- **THEN** the result has the code `UNKNOWN` and the message key `helper.error.generic`
- **Test:** `packages/core/src/errors/buildServiceError.helper.test.ts` › "maps an unknown thrown value to UNKNOWN"

#### Scenario: the mapper does not recognize the error

- **GIVEN** a mapper that returns null
- **WHEN** `buildServiceError` receives an `Error` and that mapper
- **THEN** the result has the code `UNKNOWN`
- **Test:** `packages/core/src/errors/buildServiceError.helper.test.ts` › "falls back to UNKNOWN when the mapper returns null"

#### Scenario: the unmapped value is kept

- **GIVEN** a thrown `Error` and no mapper
- **WHEN** `buildServiceError` receives it
- **THEN** the `cause` of the result is that `Error`
- **Test:** Not covered — no test reads the `cause` of an unmapped error.

### Requirement: CORE-07 — Five service error codes, each with a message key

The core package SHALL define the service error codes `FORBIDDEN`, `NETWORK_ERROR`, `NOT_FOUND`,
`SERVER_ERROR` and `UNKNOWN`, each mapped to a message key under `helper.error`.

**Evidence:** `packages/core/src/errors/serviceError.type.ts:1-7`,
`packages/core/src/errors/serviceError.type.ts:12-21`

#### Scenario: every code has a key

- **GIVEN** the codes of `ServiceErrorCodeEnum`
- **WHEN** each is looked up in `SERVICE_ERROR_MESSAGE_KEY_BY_CODE`
- **THEN** every code has a non-empty message key
- **Test:** `packages/core/src/errors/buildServiceError.helper.test.ts` › "exposes a message key for every service error code"

#### Scenario: the key follows the mapped code

- **GIVEN** a mapper that returns `NOT_FOUND`
- **WHEN** `buildServiceError` receives a value and that mapper
- **THEN** the result has the message key `helper.error.notFound`
- **Test:** `packages/core/src/errors/buildServiceError.helper.test.ts` › "uses the mapper-returned code to look up the message key"

#### Scenario: the keys exist in the catalogs

- **GIVEN** the five message keys
- **WHEN** a screen resolves one through the catalogs of packages/i18n
- **THEN** every catalog holds the key
- **Test:** Not covered — no test reads this table against the catalogs of packages/i18n.

### Requirement: CORE-08 — Only structural query-key segments survive

The core package SHALL keep a query-key segment only when it is a string of 1 to 24 letters that
starts with a lowercase letter, and replace every other segment with `[redacted]`.

**Evidence:** `packages/core/src/observability/sanitizeQueryKey.helper.ts:20-33`

#### Scenario: structural segments

- **GIVEN** the key `['items', 'list']`
- **WHEN** it is sanitized
- **THEN** both segments are kept
- **Test:** `packages/core/src/observability/sanitizeQueryKey.helper.test.ts` › "keeps short lowercase structural segments"

#### Scenario: an id segment

- **GIVEN** a key holding a uuid between two structural segments
- **WHEN** it is sanitized
- **THEN** the uuid becomes `[redacted]` and the structural segments stay
- **Test:** `packages/core/src/observability/sanitizeQueryKey.helper.test.ts` › "redacts a uuid-like dynamic segment"

#### Scenario: a segment with digits

- **GIVEN** the key `['users', 'abc123']`
- **WHEN** it is sanitized
- **THEN** `abc123` becomes `[redacted]`
- **Test:** `packages/core/src/observability/sanitizeQueryKey.helper.test.ts` › "redacts segments containing digits"

#### Scenario: a filter object

- **GIVEN** a key holding the object `{ role: 'admin' }`
- **WHEN** it is sanitized
- **THEN** the object becomes `[redacted]`
- **Test:** `packages/core/src/observability/sanitizeQueryKey.helper.test.ts` › "redacts object filter segments"

#### Scenario: a segment over the length limit

- **GIVEN** a segment of 40 lowercase letters
- **WHEN** it is sanitized
- **THEN** it becomes `[redacted]`
- **Test:** `packages/core/src/observability/sanitizeQueryKey.helper.test.ts` › "redacts segments that exceed the structural length limit"

#### Scenario: a number segment

- **GIVEN** the key `['page', 0]`
- **WHEN** it is sanitized
- **THEN** the number becomes `[redacted]`
- **Test:** `packages/core/src/observability/sanitizeQueryKey.helper.test.ts` › "redacts numeric segments"

#### Scenario: a letters-only value

- **GIVEN** a segment such as `itemDetail` or a lowercase username such as `alice`
- **WHEN** it is sanitized
- **THEN** it is kept, since it has the shape of a structural segment
- **Test:** Not covered — no test sanitizes a camelCase or letters-only dynamic value.

### Requirement: CORE-09 — The shape of a sanitized key

The core package SHALL return one sanitized segment for each segment of an array query key, and
the single segment `[redacted]` for a key that is not an array.

**Evidence:** `packages/core/src/observability/sanitizeQueryKey.helper.ts:42-43`

#### Scenario: a key that is not an array

- **GIVEN** the key `'items'`
- **WHEN** it is sanitized
- **THEN** the result is `['[redacted]']`
- **Test:** `packages/core/src/observability/sanitizeQueryKey.helper.test.ts` › "returns a single redacted segment for a non-array key"

#### Scenario: an empty key

- **GIVEN** the key `[]`
- **WHEN** it is sanitized
- **THEN** the result is `[]`
- **Test:** `packages/core/src/observability/sanitizeQueryKey.helper.test.ts` › "handles an empty key"

### Requirement: CORE-10 — The auth gateway port

The core package SHALL declare the `IAuthGateway` port: `getSession` resolves the current session
or null, `signIn` takes an email and a password and resolves a session, `signOut` resolves when
done, and `onAuthStateChange` takes an `onChange` callback that receives a session or null and
returns a subscription with `unsubscribe`.

**Evidence:** `packages/core/src/ports/auth/IAuthGateway.type.ts:1-30`

#### Scenario: an adapter implements the port

- **GIVEN** an auth adapter typed as `IAuthGateway`
- **WHEN** the workspace that holds it is typechecked
- **THEN** it must supply the four members, each session carrying `accessToken`, `expiresAt` (a
  number or null) and `userId`
- **Test:** Not covered — a type-only contract with no runtime code here; `tsc` checks it against
  its implementation in packages/supabase.

### Requirement: CORE-11 — The backend client port

The core package SHALL declare the `IBackendClientProvider` port, whose `createClient` takes a
`url` and an `anonKey` and returns the client type its implementation names.

**Evidence:** `packages/core/src/ports/client/IBackendClientProvider.type.ts:1-8`

#### Scenario: a provider implements the port

- **GIVEN** a client provider typed as `IBackendClientProvider` of its client type
- **WHEN** the workspace that holds it is typechecked
- **THEN** its `createClient` must accept `url` and `anonKey` and return that client type
- **Test:** Not covered — a type-only contract with no runtime code here; `tsc` checks it against
  its implementation in packages/supabase.

### Requirement: CORE-12 — A permissive bot-protection default

The core package SHALL provide `createPermissiveBotProtection`, whose `verifyToken` resolves
`{ success: true }` for any token.

**Evidence:** `packages/core/src/ports/bot-protection/createPermissiveBotProtection.helper.ts:4`

#### Scenario: any token

- **GIVEN** the permissive adapter
- **WHEN** it verifies the token `'anything'`
- **THEN** the result has `success` true
- **Test:** `packages/core/src/ports/bot-protection/createPermissiveBotProtection.helper.test.ts` › "verifyToken resolves success regardless of the token"

#### Scenario: an empty token

- **GIVEN** the permissive adapter
- **WHEN** it verifies an empty token
- **THEN** the result has `success` true
- **Test:** `packages/core/src/ports/bot-protection/createPermissiveBotProtection.helper.test.ts` › "verifyToken resolves success even with an empty token"

### Requirement: CORE-13 — A public image-delivery default

The core package SHALL provide `createPublicImageDelivery`, which builds every image URL, signed
or not, as its `baseUrl` and the path joined by exactly one slash, or as the path unchanged when
no `baseUrl` is set.

**Evidence:** `packages/core/src/ports/image-delivery/createPublicImageDelivery.helper.ts:18-20`,
`packages/core/src/ports/image-delivery/createPublicImageDelivery.helper.ts:22-31`

#### Scenario: no base URL

- **GIVEN** an adapter built with no `baseUrl`
- **WHEN** it builds the URL of `/img.png`
- **THEN** the URL is `/img.png`
- **Test:** `packages/core/src/ports/image-delivery/createPublicImageDelivery.helper.test.ts` › "buildImageUrl returns the raw path when no baseUrl is configured"

#### Scenario: slashes on both sides

- **GIVEN** an adapter built with the base URL `https://cdn.test/`
- **WHEN** it builds the URL of `/img.png`
- **THEN** the URL is `https://cdn.test/img.png`
- **Test:** `packages/core/src/ports/image-delivery/createPublicImageDelivery.helper.test.ts` › "buildImageUrl joins baseUrl and path without duplicate slashes"

#### Scenario: a signed URL is asked for

- **GIVEN** an adapter built with the base URL `https://cdn.test`
- **WHEN** it builds a signed URL of `img.png` that expires in 300 seconds
- **THEN** the URL is the unsigned `https://cdn.test/img.png`
- **Test:** `packages/core/src/ports/image-delivery/createPublicImageDelivery.helper.test.ts` › "buildSignedImageUrl returns the public url unsigned"

### Requirement: CORE-14 — A passthrough origin-guard default

The core package SHALL provide `createPassthroughOriginGuard`, whose `assertTrustedOrigin` returns
`trusted` true with the reason `not_configured` whatever the headers hold.

**Evidence:** `packages/core/src/ports/origin-guard/createPassthroughOriginGuard.helper.ts:5-8`,
`packages/core/src/ports/origin-guard/originGuardReason.type.ts:1-5`

#### Scenario: no origin header

- **GIVEN** headers that hold no value
- **WHEN** the passthrough guard asserts the origin
- **THEN** the result has `trusted` true
- **Test:** `packages/core/src/ports/origin-guard/createPassthroughOriginGuard.helper.test.ts` › "assertTrustedOrigin always trusts regardless of headers"

#### Scenario: the reason is reported

- **GIVEN** headers that hold any value
- **WHEN** the passthrough guard asserts the origin
- **THEN** the result has the reason `OriginGuardReasonEnum.NOT_CONFIGURED`
- **Test:** `packages/core/src/ports/origin-guard/createPassthroughOriginGuard.helper.test.ts` › "assertTrustedOrigin reports the NOT_CONFIGURED reason"

### Requirement: CORE-15 — A no-op observability default

The core package SHALL provide `createNoopObservability`, whose four methods accept any call,
record nothing and return `undefined`.

**Evidence:** `packages/core/src/ports/observability/createNoopObservability.helper.ts:3-8`

#### Scenario: an error is captured

- **GIVEN** the no-op adapter
- **WHEN** it captures an `Error`
- **THEN** the call returns `undefined`
- **Test:** `packages/core/src/ports/observability/createNoopObservability.helper.test.ts` › "captureError is callable and returns undefined"

#### Scenario: a message is captured

- **GIVEN** the no-op adapter
- **WHEN** it captures a message
- **THEN** the call returns `undefined`
- **Test:** `packages/core/src/ports/observability/createNoopObservability.helper.test.ts` › "captureMessage is callable and returns undefined"

#### Scenario: an error with context

- **GIVEN** the no-op adapter
- **WHEN** it captures an `Error` with a context
- **THEN** the call does not throw
- **Test:** `packages/core/src/ports/observability/createNoopObservability.helper.test.ts` › "captureError does not throw with context"

#### Scenario: a user and a breadcrumb

- **GIVEN** the no-op adapter
- **WHEN** it sets a user and adds a breadcrumb
- **THEN** both calls return `undefined`
- **Test:** Not covered — no test calls `setUser` or `addBreadcrumb` on the no-op adapter.

### Requirement: CORE-16 — The console adapter scrubs what it logs

The core package SHALL pass every context, user and breadcrumb payload that
`createConsoleObservability` logs through `scrubPII` before it is written.

**Evidence:** `packages/core/src/ports/observability/createConsoleObservability.helper.ts:35`,
`packages/core/src/ports/observability/createConsoleObservability.helper.ts:45`,
`packages/core/src/ports/observability/createConsoleObservability.helper.ts:58`,
`packages/core/src/ports/observability/createConsoleObservability.helper.ts:74`

#### Scenario: an error context

- **GIVEN** an error context holding an `email` and a `source`
- **WHEN** the console adapter captures the error
- **THEN** the logged `email` is `[redacted]` and the `source` is kept
- **Test:** `packages/core/src/ports/observability/createConsoleObservability.helper.test.ts` › "captureError scrubs PII fields from context"

#### Scenario: a message context

- **GIVEN** a message context holding a `token` and a `userId`
- **WHEN** the console adapter captures the message
- **THEN** the logged `token` is `[redacted]` and the `userId` is kept
- **Test:** `packages/core/src/ports/observability/createConsoleObservability.helper.test.ts` › "captureMessage scrubs PII from context"

#### Scenario: a user

- **GIVEN** a user with an `email` and an `id`
- **WHEN** the console adapter sets it
- **THEN** the logged `email` is `[redacted]` and the `id` is kept
- **Test:** `packages/core/src/ports/observability/createConsoleObservability.helper.test.ts` › "setUser scrubs PII from the user payload"

#### Scenario: breadcrumb data

- **GIVEN** breadcrumb data holding an `email` and a `route`
- **WHEN** the console adapter adds the breadcrumb
- **THEN** the logged `email` is `[redacted]` and the `route` is kept
- **Test:** `packages/core/src/ports/observability/createConsoleObservability.helper.test.ts` › "addBreadcrumb scrubs PII from breadcrumb data"

### Requirement: CORE-17 — The console adapter logs an error by name and message

The core package SHALL reduce the error that `createConsoleObservability` captures to its `name`
and `message`, or to `String(error)` for a value that is not an `Error`, leaving out its stack
and its cause.

**Evidence:** `packages/core/src/ports/observability/createConsoleObservability.helper.ts:16-21`

#### Scenario: an error with a stack and a cause

- **GIVEN** an `Error` that has a stack and a cause
- **WHEN** the console adapter captures it
- **THEN** the logged error holds only its `name` and its `message`
- **Test:** Not covered — no test reads the logged error field.

#### Scenario: an address inside the message

- **GIVEN** an `Error` whose message holds an email address
- **WHEN** the console adapter captures it
- **THEN** the message is logged unchanged, since `scrubPII` redacts by key and never inside a
  string value
- **Test:** Not covered — no test captures an error whose message holds personal data.

### Requirement: CORE-18 — The console adapter routes by level

The core package SHALL write `captureError`, and `captureMessage` at the level `error` or
`fatal`, to `hostConsole.error`, and every other call of `createConsoleObservability` to
`hostConsole.warn`.

**Evidence:** `packages/core/src/ports/observability/createConsoleObservability.helper.ts:48`,
`packages/core/src/ports/observability/createConsoleObservability.helper.ts:62-69`,
`packages/core/src/ports/observability/createConsoleObservability.helper.ts:39`,
`packages/core/src/ports/observability/createConsoleObservability.helper.ts:75`

#### Scenario: an error is captured

- **GIVEN** the console adapter
- **WHEN** it captures an `Error`
- **THEN** `hostConsole.error` is called once
- **Test:** `packages/core/src/ports/observability/createConsoleObservability.helper.test.ts` › "captureError calls console.error"

#### Scenario: a message at the error level

- **GIVEN** the console adapter
- **WHEN** it captures a message at `ObservabilityLevelEnum.ERROR`
- **THEN** `hostConsole.error` is called once and `hostConsole.warn` is not
- **Test:** `packages/core/src/ports/observability/createConsoleObservability.helper.test.ts` › "captureMessage with ERROR level calls console.error"

#### Scenario: a message at the info level

- **GIVEN** the console adapter
- **WHEN** it captures a message at `ObservabilityLevelEnum.INFO`
- **THEN** `hostConsole.warn` is called once and `hostConsole.error` is not
- **Test:** `packages/core/src/ports/observability/createConsoleObservability.helper.test.ts` › "captureMessage with INFO level calls console.warn"

#### Scenario: a message at the fatal level

- **GIVEN** the console adapter
- **WHEN** it captures a message at `ObservabilityLevelEnum.FATAL`
- **THEN** `hostConsole.error` is called
- **Test:** Not covered — no test captures a message at the fatal level.

### Requirement: CORE-19 — The console adapter can be switched off

The core package SHALL make every method of `createConsoleObservability` built with `isEnabled`
false return without writing to the console.

**Evidence:** `packages/core/src/ports/observability/createConsoleObservability.helper.ts:32`,
`packages/core/src/ports/observability/createConsoleObservability.helper.ts:43`,
`packages/core/src/ports/observability/createConsoleObservability.helper.ts:56`,
`packages/core/src/ports/observability/createConsoleObservability.helper.ts:73`

#### Scenario: an error while disabled

- **GIVEN** a console adapter built with `isEnabled` false
- **WHEN** it captures an `Error`
- **THEN** `hostConsole.error` is not called
- **Test:** `packages/core/src/ports/observability/createConsoleObservability.helper.test.ts` › "captureError is suppressed when isEnabled is false"

#### Scenario: a message while disabled

- **GIVEN** a console adapter built with `isEnabled` false
- **WHEN** it captures a message
- **THEN** neither `hostConsole.warn` nor `hostConsole.error` is called
- **Test:** `packages/core/src/ports/observability/createConsoleObservability.helper.test.ts` › "captureMessage is suppressed when isEnabled is false"

#### Scenario: a user while disabled

- **GIVEN** a console adapter built with `isEnabled` false
- **WHEN** it sets the user to null
- **THEN** `hostConsole.warn` is not called
- **Test:** `packages/core/src/ports/observability/createConsoleObservability.helper.test.ts` › "setUser with null is suppressed when isEnabled is false"

#### Scenario: a breadcrumb while disabled

- **GIVEN** a console adapter built with `isEnabled` false
- **WHEN** it adds a breadcrumb
- **THEN** `hostConsole.warn` is not called
- **Test:** `packages/core/src/ports/observability/createConsoleObservability.helper.test.ts` › "addBreadcrumb is suppressed when isEnabled is false"

### Requirement: CORE-20 — The set of sensitive keys

The core package SHALL export `PII_KEYS`, the field names it treats as sensitive: access and
refresh tokens, API keys, authorization, cookie and set-cookie, email, full name, JWT, password,
payer name, phone and phone number, raw text, secret, session and token, without `name`.

**Evidence:** `packages/core/src/utils/scrubPII.helper.ts:22-45`

#### Scenario: personal and credential keys

- **GIVEN** `PII_KEYS`
- **WHEN** it is asked for `email`, `password`, `token`, `phone`, `secret`, `access_token`,
  `refresh_token`, `payer_name`, `full_name` and `raw_text`
- **THEN** it holds each of them
- **Test:** `packages/core/src/utils/scrubPII.helper.test.ts` › "contains expected sensitive keys"

#### Scenario: transport keys

- **GIVEN** `PII_KEYS`
- **WHEN** it is asked for `authorization`, `cookie`, `set-cookie`, `apikey`, `jwt` and `session`
- **THEN** it holds each of them
- **Test:** `packages/core/src/utils/scrubPII.helper.test.ts` › "contains transport-header and cookie keys"

#### Scenario: a business name

- **GIVEN** `PII_KEYS`
- **WHEN** it is asked for `name`
- **THEN** it does not hold it
- **Test:** `packages/core/src/utils/scrubPII.helper.test.ts` › "does NOT contain "name" (business name is not PII by default)"

### Requirement: CORE-21 — Redaction matches the normalized key exactly

The core package SHALL replace with `[redacted]` the whole value of every key that, lowercased
and stripped of every character that is not a letter or a digit, equals a `PII_KEYS` member
normalized the same way.

**Evidence:** `packages/core/src/utils/scrubPII.helper.ts:47-57`,
`packages/core/src/utils/scrubPII.helper.ts:74`

#### Scenario: an upper-case key

- **GIVEN** the object `{ EMAIL: 'user@example.com' }`
- **WHEN** it is scrubbed
- **THEN** `EMAIL` holds `[redacted]`
- **Test:** `packages/core/src/utils/scrubPII.helper.test.ts` › "redacts "EMAIL" (UPPER_CASE)"

#### Scenario: hyphenated header names

- **GIVEN** the keys `access-token` and `set-cookie`
- **WHEN** they are scrubbed
- **THEN** both hold `[redacted]`
- **Test:** `packages/core/src/utils/scrubPII.helper.test.ts` › "redacts hyphenated header variants ("access-token", "set-cookie")"

#### Scenario: a bearer token in request headers

- **GIVEN** an event whose `request.headers.Authorization` holds a bearer token
- **WHEN** it is scrubbed
- **THEN** the header holds `[redacted]`
- **Test:** `packages/core/src/utils/scrubPII.helper.test.ts` › "redacts request.headers.Authorization (Bearer token)"

#### Scenario: a key that only contains a sensitive word

- **GIVEN** the keys `tokenCount` and `apikeyLabel`
- **WHEN** they are scrubbed
- **THEN** both keep their values
- **Test:** `packages/core/src/utils/scrubPII.helper.test.ts` › "does NOT over-redact substring matches like "tokenCount""

#### Scenario: a sensitive key that holds an object

- **GIVEN** a sensitive key whose value is an object
- **WHEN** it is scrubbed
- **THEN** the whole object is replaced by `[redacted]`, not walked
- **Test:** Not covered — every redaction test puts a primitive under the sensitive key.

### Requirement: CORE-22 — The scrub walks every depth

The core package SHALL apply the redaction at every depth of nested objects and arrays, building
new objects and arrays, and return primitives, null and undefined as they are.

**Evidence:** `packages/core/src/utils/scrubPII.helper.ts:59-81`

#### Scenario: a deep object

- **GIVEN** an `email` two objects deep beside an `id`
- **WHEN** the object is scrubbed
- **THEN** the `email` holds `[redacted]` and the `id` is kept
- **Test:** `packages/core/src/utils/scrubPII.helper.test.ts` › "redacts PII at multiple nesting levels"

#### Scenario: an array of records

- **GIVEN** an array of two objects that each hold an `email` and an `id`
- **WHEN** the array is scrubbed
- **THEN** both `email` values hold `[redacted]` and the first `id` is kept
- **Test:** `packages/core/src/utils/scrubPII.helper.test.ts` › "recurses into arrays"

#### Scenario: null

- **GIVEN** the value null
- **WHEN** it is scrubbed
- **THEN** the result is null
- **Test:** `packages/core/src/utils/scrubPII.helper.test.ts` › "returns null as-is"

#### Scenario: the input is left alone

- **GIVEN** an object holding an `email`
- **WHEN** it is scrubbed
- **THEN** the input object still holds the address, and only the returned copy is redacted
- **Test:** Not covered — no test reads the input after the scrub.

#### Scenario: an Error value

- **GIVEN** an object holding an `Error` under a key that is not sensitive
- **WHEN** it is scrubbed
- **THEN** the `Error` becomes an empty object, since its fields are not enumerable
- **Test:** Not covered — no test scrubs an `Error` instance.

### Requirement: CORE-23 — An object met twice is marked circular

The core package SHALL replace an object that one scrub meets a second time with `[circular]`
instead of walking it again.

**Evidence:** `packages/core/src/utils/scrubPII.helper.ts:67-68`

#### Scenario: an object that holds itself

- **GIVEN** an object whose `self` key holds the object itself
- **WHEN** it is scrubbed
- **THEN** `self` holds `[circular]` and the other keys are kept
- **Test:** `packages/core/src/utils/scrubPII.helper.test.ts` › "replaces circular reference with "[circular]""

#### Scenario: one object under two keys

- **GIVEN** an object whose keys `a` and `b` hold the same inner object, with no cycle
- **WHEN** it is scrubbed
- **THEN** `a` holds the scrubbed inner object and `b` holds `[circular]`
- **Test:** Not covered — no test shares one object between two keys.

#### Scenario: an array that holds itself

- **GIVEN** an array that holds itself
- **WHEN** it is scrubbed
- **THEN** the scrub recurses until it throws a `RangeError`, since arrays never enter the set of
  objects already met
- **Test:** Not covered — no test scrubs a cyclic array.

### Requirement: CORE-24 — The host console seam

The core package SHALL reach the host console only through `hostConsole`, which types its
`error` and `warn` members and nothing else, under the ES2022 library with no DOM or Node types.

**Evidence:** `packages/core/src/utils/hostConsole.helper.ts:16-24`, `tsconfig.base.json:5`

#### Scenario: the seam resolves in the runtime

- **GIVEN** the runtime the suite runs in
- **WHEN** `hostConsole` is read
- **THEN** its `error` and `warn` members are functions
- **Test:** `packages/core/src/utils/hostConsole.helper.test.ts` › "hostConsole exposes the members the package depends on"

#### Scenario: a host API without a seam

- **GIVEN** a core source that calls `process`, `window` or `fetch`
- **WHEN** the package is typechecked
- **THEN** the typecheck fails, since the ES2022 library declares none of them
- **Test:** Not covered — no test plants a host API; the package's typecheck is the check.

### Requirement: CORE-25 — The domain layer imports nothing external

The core package SHALL import, in its production files, nothing from outside itself: no
package, no `@/` alias, no `#` key but `#src/`, and no `node:` builtin.

**Evidence:** `eslint-local-rules/index.mjs:504-531`, `eslint.config.mjs:138-140`,
`packages/core/package.json:12-14`

#### Scenario: a framework import

- **GIVEN** a production file of packages/core that imports `useState` from `react`
- **WHEN** it is linted
- **THEN** lint reports `vendorInCore` for it
- **Test:** `eslint-local-rules/index.test.mjs` › "import { useState } from 'react'"

#### Scenario: a vendor SDK import

- **GIVEN** a production file of packages/core that imports `createClient` from the Supabase SDK
- **WHEN** it is linted
- **THEN** lint reports `vendorInCore` for it
- **Test:** `eslint-local-rules/index.test.mjs` › "import { createClient } from '@supabase/supabase-js'"

#### Scenario: a Node builtin

- **GIVEN** a production file of packages/core that imports `readFileSync` from `node:fs`
- **WHEN** it is linted
- **THEN** lint reports `vendorInCore` for it
- **Test:** `eslint-local-rules/index.test.mjs` › "import { readFileSync } from 'node:fs'"

#### Scenario: another hash key

- **GIVEN** a production file of packages/core that imports from `#vendor/a`
- **WHEN** it is linted
- **THEN** lint reports `vendorInCore` for it
- **Test:** `eslint-local-rules/index.test.mjs` › "import { a } from '#vendor/a'"

#### Scenario: its own module

- **GIVEN** a production file of packages/core that imports `scrubPII` through `#src/`
- **WHEN** it is linted
- **THEN** lint reports nothing
- **Test:** `eslint-local-rules/index.test.mjs` › "import { scrubPII } from '#src/utils/scrubPII.helper'"

## Open questions

- **Q1** — `packages/core/src/utils/scrubPII.helper.ts:16` says circular references become
  `[circular]` instead of throwing, but `packages/core/src/utils/scrubPII.helper.ts:62` walks
  arrays without the visited check, so an array that holds itself throws `RangeError`. See
  CORE-23.
- **Q2** — The same comment speaks of circular references only, but
  `packages/core/src/utils/scrubPII.helper.ts:67` never releases the visited set, so one object
  reached under two keys, with no cycle, becomes `[circular]` the second time and its data drops
  out of the payload. See CORE-23.
- **Q3** — `packages/core/src/observability/sanitizeQueryKey.helper.ts:13` keeps a segment only
  when it is a "short lowercase token", but the pattern at
  `packages/core/src/observability/sanitizeQueryKey.helper.ts:21` also keeps camelCase segments
  and any letters-only value up to 24 characters, such as a username. See CORE-08.
- **Q4** — `docs/code-standards.md:601` has services throw an `AppError` with a `messageKey`, a
  `code` and an optional `cause`, but `packages/core/src/errors/AppError.helper.ts:4` makes
  `messageKey` optional too. See CORE-01.
