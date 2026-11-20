# Delta: apps/web

> **Change:** `2026-11-20-posthog-privacy-follow-ups`

## ADDED Requirements

### Requirement: WEB-85 — An opt-in start with no recorded grant removes what PostHog stored

The web app SHALL, when its client module loads in the browser with a key in `opt-in` mode and no
grant recorded by the consent API, remove every value `posthog-js` keeps for that key: each local
and session storage key that starts with `ph_<key>_`, the consent key `__ph_opt_in_out_<key>`, and
the cookies of those names on the host and on every parent domain of it, so what a project stored
under `granted` before it switched to `opt-in` does not outlive the switch. It SHALL keep them when
a grant is recorded, keep every value of another key or of the app, keep them in every other mode,
and throw nothing when the browser blocks site data.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a switch from `granted`

- **GIVEN** a key, the consent mode `opt-in`, no recorded grant, the values `posthog-js` keeps for
  that key in a cookie and in local and session storage, and values of another key and of the app
- **WHEN** the client module loads in the browser
- **THEN** the values of that key are gone and the others stay
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "removes what PostHog stored before at an opt-in start with no grant"

#### Scenario: a recorded grant

- **GIVEN** a key, the consent mode `opt-in`, a recorded grant and the values `posthog-js` keeps
- **WHEN** the client module loads in the browser
- **THEN** they stay
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "keeps what PostHog stored at an opt-in start after a grant"

#### Scenario: a mode that asks no consent

- **GIVEN** a key, the consent mode `granted` and the values `posthog-js` keeps
- **WHEN** the client module loads in the browser
- **THEN** they stay
- **Test:** `apps/web/src/lib/posthog/__tests__/posthogClient.adapter.test.ts` › "keeps what PostHog stored outside opt-in mode"

#### Scenario: a cookie on a parent domain

- **GIVEN** a page on a subdomain and the `posthog-js` cookie set on its parent domain
- **WHEN** the values of the key are removed
- **THEN** the cookie is gone
- **Test:** `apps/web/src/lib/posthog/__tests__/sdkStorage.adapter.test.ts` › "expires the cookie PostHog set on a parent domain"

#### Scenario: blocked site data

- **GIVEN** a browser that throws on reading its local and session storage
- **WHEN** the values of the key are removed
- **THEN** nothing throws
- **Test:** `apps/web/src/lib/posthog/__tests__/sdkStorage.adapter.test.ts` › "throws nothing when the browser blocks site data"

## MODIFIED Requirements

### Requirement: WEB-52 — Every URL leaves without its query, its fragment and a secret path segment

The web app SHALL drop, before PostHog sends an event, the query string and the fragment of every
URL, path and referrer property of the event and of the person, and of every page URL that keys
heatmap data, merging the points of two URLs that scrub to the same key. It SHALL also replace with
`:redacted` every segment of the path that reads as a secret: one that holds an `@` or `%40`, or
one whose percent-decoded text has 16 or more characters, holds a digit and is not a slug, either
a word slug, lowercase words and numbers of at most four digits joined by hyphens, or a slug of
short parts, two or more parts of letters and digits joined by hyphens or underscores, each of at
most 11 characters and one at least holding a letter. It SHALL keep the scheme and the host of a
URL, and every other segment in its encoded form, so a route keeps its shape.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a page URL with a token

- **GIVEN** a URL with a query and a fragment that carry a token
- **WHEN** it is scrubbed
- **THEN** both are gone and the rest of the URL is kept
- **Test:** `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "drops the query and the fragment of a page URL"

#### Scenario: a secret in a path segment

- **GIVEN** URLs and paths whose segments hold a reset token, an invite id, a hex token, a card
  number and an email, plain and percent-encoded
- **WHEN** they are scrubbed
- **THEN** each of those segments reads `:redacted`, and the host and the other segments are kept
- **Test:** `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "replaces a path segment that reads as a secret"

#### Scenario: route names, slugs and short ids

- **GIVEN** paths of route names, a long word slug with a year, a numeric id and a short id, and a
  host that holds digits
- **WHEN** they are scrubbed
- **THEN** they are kept as they are
- **Test:** `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "keeps route names, word slugs and short ids in the path"

#### Scenario: an encoded segment

- **GIVEN** segments that hold accented or other non-ASCII words, percent-encoded, and an encoded token
- **WHEN** they are scrubbed
- **THEN** the words are kept in their encoded form, and the token reads `:redacted`
- **Test:** `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "reads a percent-encoded segment by its decoded text"

#### Scenario: a slug of short parts

- **GIVEN** slugs whose short parts mix letters and digits, joined by hyphens or underscores, a UUID and a card number joined by hyphens
- **WHEN** they are scrubbed
- **THEN** the slugs are kept, and the UUID and the card number read `:redacted`
- **Test:** `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "keeps a slug of short parts that mix letters and digits"

#### Scenario: an event and its person

- **GIVEN** an event whose properties, `$set` and `$set_once` hold URLs, paths and referrers
- **WHEN** the event is scrubbed
- **THEN** each of them leaves without its query and its fragment
- **Test:** `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "scrubs every URL property of an event and of its person"

#### Scenario: heatmap data

- **GIVEN** heatmap points keyed by two URLs that differ only in their query
- **WHEN** the event is scrubbed
- **THEN** the points sit under one scrubbed URL
- **Test:** `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "keys heatmap points by the scrubbed URL"

#### Scenario: other properties

- **GIVEN** properties that are not URL properties, one holding a URL string
- **WHEN** the event is scrubbed
- **THEN** they are untouched
- **Test:** `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "leaves every other property untouched"

#### Scenario: a dropped event

- **GIVEN** an event an earlier hook dropped
- **WHEN** it is scrubbed
- **THEN** it stays dropped
- **Test:** `apps/web/src/lib/posthog/__tests__/scrubCaptureUrls.helper.test.ts` › "passes a dropped event through as dropped"

### Requirement: WEB-57 — The consent API grants, revokes and reads the status

The web app SHALL export a consent API, the `IConsentPort` of packages/core, from its
observability barrel, bound to PostHog in the composition root `consent.adapter.ts`. In `opt-in`
mode with a key in the browser, `grant` SHALL load the SDK (WEB-50), opt it in without an
`$opt_in` event and then record the grant in the browser's local storage; `revoke` SHALL remove
that record and stop the client at once, so every call made from then on is dropped (WEB-62), a
call held by a load in flight included, and then opt out the SDK it loaded, or the one that load
brings, pause its flags and reset it with a new device id, which clears every value it stored and
its stored choice and, with the flags paused, requests no flags; a later grant SHALL opt the same
SDK in again and, after a revoke paused them, resume the flags and reload them once; when a revoke
and a grant overlap a load, the later one SHALL decide; and `getStatus` SHALL read `denied` after a
revoke on the same page, `granted` while the record holds a grant or after a grant on the same
page, the browser blocking the record included, and `pending` otherwise. In `granted` and `memory`
mode, without a key and on the server, `getStatus` SHALL read `not-required`, and `grant` and
`revoke` SHALL load nothing and call nothing on PostHog.

**Evidence:** written at apply time, when the code exists.

#### Scenario: before a choice

- **GIVEN** a key and the consent mode `opt-in`
- **WHEN** the status is read before any grant or revoke
- **THEN** it is `pending` and the SDK module was not loaded
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "reads pending and loads nothing before a choice in opt-in mode"

#### Scenario: a grant

- **GIVEN** a key and the consent mode `opt-in`
- **WHEN** consent is granted twice
- **THEN** the SDK module is loaded and initialised once, PostHog is opted in with no opt-in
  event, its flags are left as the SDK loads them, the grant is recorded and the status reads
  `granted`
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "grant loads PostHog once, opts it in without an opt-in event and reads granted"

#### Scenario: a grant from an earlier visit

- **GIVEN** a key, the consent mode `opt-in` and a grant recorded by an earlier visit
- **WHEN** the status is read
- **THEN** it is `granted`
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "reads granted after a grant from an earlier visit"

#### Scenario: a revoke

- **GIVEN** a key, the consent mode `opt-in` and a grant
- **WHEN** consent is revoked, and an error is captured after it
- **THEN** PostHog is opted out, then reset with a new device id, the record is gone, the error
  never reaches PostHog and the status reads `denied`
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "revoke opts PostHog out, resets it with a new device id, stops it and reads denied"

#### Scenario: no flags after a revoke

- **GIVEN** a key, the consent mode `opt-in` and a grant
- **WHEN** consent is revoked
- **THEN** the flags are paused before the reset and are not reloaded
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a revoke pauses the flags before the reset, so it requests none"

#### Scenario: a call during a revoke's load

- **GIVEN** a key, the consent mode `opt-in` and a grant recorded by an earlier visit, so the SDK
  loads at start
- **WHEN** consent is revoked while the SDK loads, and an error is captured after it
- **THEN** the error never reaches PostHog, the SDK is opted out once it loads, the record is gone
  and the status reads `denied`
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "drops every call made after a revoke while the SDK loads"

#### Scenario: a grant while the browser blocks site data

- **GIVEN** a key, the consent mode `opt-in` and a browser that blocks site data
- **WHEN** consent is granted
- **THEN** PostHog is opted in and the status reads `granted`
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "reads granted after a grant while the browser blocks site data"

#### Scenario: a grant after a revoke

- **GIVEN** a key, the consent mode `opt-in`, a grant and a revoke
- **WHEN** consent is granted again
- **THEN** PostHog is opted in again, the SDK module was loaded and initialised once, and the
  status reads `granted`
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "grants again after a revoke with the SDK it already loaded"

#### Scenario: the flags after a grant that follows a revoke

- **GIVEN** a key, the consent mode `opt-in`, a grant and a revoke
- **WHEN** consent is granted again
- **THEN** the flags are resumed after PostHog is opted in and reloaded once
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "a grant after a revoke resumes the flags and reloads them once"

#### Scenario: a revoke and a grant during a load

- **GIVEN** a key, the consent mode `opt-in` and a grant recorded by an earlier visit, so the SDK
  loads at start
- **WHEN** consent is revoked and then granted before the load ends
- **THEN** PostHog is not opted out, the grant stays recorded and the status reads `granted`
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "keeps a grant made while a revoke waits for the load"

#### Scenario: a mode that asks no consent

- **GIVEN** a key and the consent mode `granted`, then `memory`
- **WHEN** consent is granted, revoked and read
- **THEN** PostHog receives no consent call and the status reads `not-required`
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required outside opt-in mode"

#### Scenario: no client

- **GIVEN** the consent mode `opt-in` and no key, then a key and no `window`
- **WHEN** consent is granted, revoked and read
- **THEN** nothing throws, the SDK module is never loaded and the status reads `not-required`
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required without a key"
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogConsent.adapter.test.ts` › "changes nothing and reads not-required on the server"

#### Scenario: the composition root

- **GIVEN** a key, the consent mode `opt-in` and the SDK replaced at its module
- **WHEN** consent is granted through the barrel's `consent`
- **THEN** PostHog is opted in
- **Test:** `apps/web/src/lib/observability/__tests__/consent.adapter.test.ts` › "binds the PostHog consent by default"

### Requirement: WEB-62 — PostHog calls wait for the SDK in a bounded queue, or are dropped

The web app's PostHog observability adapter SHALL scrub every payload with `scrubPII` when it is
called, and then: hand the call to the SDK at once while the SDK is loaded; while the SDK is
loading, hold it in a queue of at most `POSTHOG_PENDING_CALLS_LIMIT` calls, dropping the oldest
when the queue is full, and hand every held call to the SDK in order once it loads, each on its
own, so a held call that throws drops only itself and the start still resolves to the client, or
drop them all if it fails to load; and drop it while no load has started: without a key, on the
server, in `opt-in` mode before a grant and after a revoke.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the SDK loading

- **GIVEN** a key, the consent mode `granted` and an SDK that has not loaded yet
- **WHEN** an error, a message, a breadcrumb and a user are captured with an email, and the SDK
  then loads
- **THEN** the SDK receives each of them in the order they were made, with the email redacted
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "hands the calls made while PostHog loads to it in order, scrubbed"

#### Scenario: a held call that throws

- **GIVEN** a load in flight and three held calls, the second of which throws
- **WHEN** the load ends
- **THEN** the first and the third reach the client in order, and the start resolves to it
- **Test:** `apps/web/src/lib/posthog/__tests__/deferredClient.helper.test.ts` › "runs each held call on its own when one throws"

#### Scenario: a full queue

- **GIVEN** a key, the consent mode `granted` and an SDK that has not loaded yet
- **WHEN** one error more than `POSTHOG_PENDING_CALLS_LIMIT` is captured, and the SDK then loads
- **THEN** the SDK receives the last `POSTHOG_PENDING_CALLS_LIMIT` errors in order, and not the
  first
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "drops the oldest call when the queue is full"

#### Scenario: a failed load

- **GIVEN** a key, the consent mode `granted` and an SDK whose module fails to load
- **WHEN** an error is captured before the failure and another after it
- **THEN** nothing throws and nothing is delivered
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "drops the held calls when PostHog fails to load"

#### Scenario: before a grant

- **GIVEN** a key and the consent mode `opt-in`
- **WHEN** an error is captured, and consent is then granted
- **THEN** the SDK loads and receives no exception
- **Test:** `apps/web/src/lib/observability/__tests__/createPostHogObservability.adapter.test.ts` › "drops every call in opt-in mode before a grant"
