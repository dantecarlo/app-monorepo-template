# Delta: apps/web

> **Change:** `2026-11-15-app-behaviour`

## ADDED Requirements

### Requirement: WEB-45 — A query key keeps its dynamic values in a trailing params object

The web app SHALL build every key of `QueryKeys` from `QueryKeySegmentEnum` values followed, when
the key carries a dynamic value, by one trailing params object that holds every such value, so
that no string segment of a key is a value the user typed or the data supplied, and a feature's
`all` key is a prefix of each of its keys.

**Evidence:** written at apply time, when the code exists.

#### Scenario: every factory is walked

- **GIVEN** every entry of `QueryKeys`, each factory called with a probe value
- **WHEN** the string segments of the keys they return are read
- **THEN** each one is a value of `QueryKeySegmentEnum`
- **Test:** `apps/web/src/lib/query/__tests__/queryKeys.constant.test.ts` › "builds every string segment of every key factory from QueryKeySegmentEnum"

#### Scenario: the list filter and the detail id

- **GIVEN** a list filter and an item id
- **WHEN** the list and detail keys are built
- **THEN** they are `['items', 'list', { filter }]` and `['items', 'detail', { id }]`, and the list key with no filter stays `['items', 'list']`
- **Test:** `apps/web/src/lib/query/__tests__/queryKeys.constant.test.ts` › "puts the list filter and the detail id in a trailing params object"
- **Test:** `apps/web/src/lib/query/__tests__/queryKeys.constant.test.ts` › "keeps the bare list key when no filter is given"

#### Scenario: the items prefix is invalidated

- **GIVEN** a cached list query and a cached detail query of the items
- **WHEN** the query client invalidates `QueryKeys.items.all`
- **THEN** both queries are invalidated
- **Test:** `apps/web/src/lib/query/__tests__/queryKeys.constant.test.ts` › "invalidates every items query through the items all key"

## MODIFIED Requirements

### Requirement: WEB-07 — A failed items load shows the error state

The web app SHALL, when the items query fails, render the error state with its generic copy in
the items list, in place of the items and the empty state, with a Try again button that runs the
items query again, and queue no toast.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the items service rejects

- **GIVEN** the items service rejects
- **WHEN** the dashboard settles
- **THEN** the list shows the error state alert with its generic title, no empty-list message, and the toast store holds no toast
- **Test:** `apps/web/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "shows the error state and queues no toast when the items query fails"

#### Scenario: Try again after a failure

- **GIVEN** the dashboard showing the error state, and an items service that now resolves
- **WHEN** Try again is pressed
- **THEN** the items service is called again and the items are listed
- **Test:** `apps/web/src/screens/ItemsDashboard/__tests__/ItemsDashboard.screen.test.tsx` › "loads the items again when Try again is pressed after a failure"

#### Scenario: the hook reports the failure

- **GIVEN** the items service rejects
- **WHEN** the dashboard hook settles
- **THEN** it reports the failure and an empty item list, and its retry calls the items service again
- **Test:** `apps/web/src/screens/ItemsDashboard/hooks/__tests__/useItems.hook.test.ts` › "reports the failure and runs the query again on retry"

### Requirement: WEB-13 — A valid login submit signs in through the auth gateway

The web app SHALL, on a login submit that passes validation, clear the field errors and send the
email and password to the auth gateway's `signIn`, through the auth service, showing the
submitting state while the request runs; when it resolves it SHALL replace the route with `/`,
and when it rejects it SHALL queue an error toast with the message resolved from the error's
`messageKey`, set no field error and leave the route unchanged. The sign-in result the screen
keeps holds the user id and not the access token.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the gateway accepts the credentials

- **GIVEN** the login screen and a gateway that resolves a session
- **WHEN** a valid email and password are submitted
- **THEN** the gateway's `signIn` receives them once and the route is replaced with `/`
- **Test:** `apps/web/src/screens/Login/__tests__/Login.screen.test.tsx` › "signs in through the auth gateway and replaces the route with the home page"

#### Scenario: the sign-in is running

- **GIVEN** the login screen and a gateway that has not answered
- **WHEN** a valid email and password are submitted
- **THEN** the submit button is disabled and shows the submitting label
- **Test:** `apps/web/src/screens/Login/__tests__/Login.screen.test.tsx` › "disables the submit button while the sign-in runs"

#### Scenario: the gateway rejects the credentials

- **GIVEN** the login screen and a gateway that rejects
- **WHEN** a valid email and password are submitted
- **THEN** an error toast with the generic message is queued, no field error is shown, and the route is not replaced
- **Test:** `apps/web/src/screens/Login/__tests__/Login.screen.test.tsx` › "queues the error toast and sets no field error when the sign-in fails"

#### Scenario: the form hook hands the values to the sign-in

- **GIVEN** the form hook holding a valid email and an 8-character password
- **WHEN** the form is submitted
- **THEN** the errors are empty and the gateway receives the values
- **Test:** `apps/web/src/screens/Login/hooks/__tests__/useLoginForm.hook.test.ts` › "sends the values to the sign-in on a valid submit and clears errors"

#### Scenario: the service maps a rejection

- **GIVEN** a gateway whose `signIn` rejects with a plain error, or resolves a session
- **WHEN** the auth service signs in
- **THEN** it rejects with an `AppError` carrying a message key, or resolves that session
- **Test:** `apps/web/src/services/Auth/__tests__/auth.service.test.ts` › "rejects with an AppError carrying a message key when the gateway rejects"
- **Test:** `apps/web/src/services/Auth/__tests__/auth.service.test.ts` › "resolves the session the gateway returns"

#### Scenario: the adapter drops the token

- **GIVEN** a session holding an access token
- **WHEN** it is adapted for the screen
- **THEN** the result holds the user id and no access token
- **Test:** `apps/web/src/services/Auth/__tests__/Auth.adapter.test.ts` › "keeps the user id and drops the access token"

### Requirement: WEB-20 — The auth gateway is a no-op without Supabase settings

The web app SHALL give the auth provider and the auth service one gateway: a no-op gateway during
server rendering and in a browser where `NEXT_PUBLIC_SUPABASE_URL` or
`NEXT_PUBLIC_SUPABASE_ANON_KEY` is unset, so the session resolves to none and a sign-in rejects;
otherwise one Supabase auth gateway per browser.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the Supabase settings are missing

- **GIVEN** a browser with no Supabase URL or anon key
- **WHEN** the gateway is requested
- **THEN** its session resolves to none, its sign-in rejects, and no Supabase gateway is created
- **Test:** `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "returns a no-op gateway without the Supabase settings"

#### Scenario: the Supabase settings are present

- **GIVEN** a browser with both public Supabase settings
- **WHEN** the gateway is requested twice
- **THEN** one Supabase auth gateway is created and returned both times
- **Test:** `apps/web/src/lib/supabase/__tests__/authGateway.adapter.test.ts` › "creates one Supabase auth gateway per browser with the settings"

#### Scenario: the page is rendered on the server

- **GIVEN** server rendering
- **WHEN** the providers mount
- **THEN** the auth provider receives the no-op gateway
- **Test:** Not covered — happy-dom always defines `window`, so no test renders the server branch.

### Requirement: WEB-24 — Every failed query and mutation is reported once with a scrubbed key

The web app SHALL report every failed query and mutation once, from the query cache and mutation
cache error handlers, to the observability port, passing the query key through
`sanitizeQueryKey` from packages/core with the values of `QueryKeySegmentEnum` as its structural
segments, so the trailing params object of a key (WEB-45) is always redacted, whatever it holds.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a query fails

- **GIVEN** a query whose key holds an identifier
- **WHEN** it fails
- **THEN** the capture sink is called once, from the query cache, with the identifier redacted
- **Test:** `apps/web/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "calls onCaptureError with sanitized queryKey on query failure"

#### Scenario: a query keyed by a search text

- **GIVEN** a query keyed by `QueryKeys.items.list('alice')`
- **WHEN** it fails
- **THEN** the capture sink receives the key `['items', 'list', '[redacted]']`
- **Test:** `apps/web/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "redacts the search text of an items list key on query failure"

#### Scenario: a typed value equal to a registered word

- **GIVEN** a query keyed by `QueryKeys.items.list('list')`
- **WHEN** it fails
- **THEN** the capture sink receives the key `['items', 'list', '[redacted]']`
- **Test:** `apps/web/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "redacts a list filter that equals a registered segment on query failure"

#### Scenario: a mutation fails

- **GIVEN** a mutation
- **WHEN** it fails
- **THEN** the capture sink is called from the mutation cache
- **Test:** `apps/web/src/lib/query/__tests__/createQueryClient.helper.test.ts` › "calls onCaptureError with mutationCache source on mutation failure"

#### Scenario: the sink reaches the observability port

- **GIVEN** the capture sink built over an observability port
- **WHEN** it is called with an error and its context
- **THEN** the port's error capture receives both, once
- **Test:** `apps/web/src/lib/observability/__tests__/toCaptureError.helper.test.ts` › "forwards error and context to captureError"

### Requirement: WEB-26 — Mutation outcomes are queued as toasts, query failures are not

The web app SHALL queue each failed mutation as an error toast with the resolved message, and a
mutation's success message as a success toast, in the toast store, which drops each toast after 4
seconds; a failed query SHALL queue no toast, however many components observe it.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a query fails

- **GIVEN** two components observing one query
- **WHEN** the query fails
- **THEN** no toast is queued
- **Test:** `apps/web/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "queues no toast when the query fails, however many components observe it"

#### Scenario: a mutation fails or succeeds

- **GIVEN** a mutation with an override message or a success message
- **WHEN** it fails or succeeds
- **THEN** an error toast or a success toast with that message is queued
- **Test:** `apps/web/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "shows an error toast with the override message on failure"
- **Test:** `apps/web/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "shows a success toast when successMessage is provided"

#### Scenario: a toast expires

- **GIVEN** a queued toast
- **WHEN** 4 seconds pass
- **THEN** the toast store no longer holds it
- **Test:** `apps/web/src/stores/__tests__/toast.store.test.ts` › "toast auto-dismisses after 4 seconds"

### Requirement: WEB-31 — The middleware rejects requests from an untrusted origin

The web app SHALL answer 403 with an empty body to every request outside `_next/static`,
`_next/image`, the favicon, `images` and `fonts` when the origin guard reports it untrusted, and
let it through otherwise.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the origin secret is right

- **GIVEN** a configured origin secret and a request whose origin header matches it
- **WHEN** the middleware runs
- **THEN** the request continues to the route
- **Test:** `apps/web/src/__tests__/middleware.test.ts` › "lets a request with the configured origin secret through"

#### Scenario: the origin secret is missing or wrong

- **GIVEN** a configured origin secret and a request with no origin header, or one that does not match it
- **WHEN** the middleware runs
- **THEN** the response is 403 with an empty body
- **Test:** `apps/web/src/__tests__/middleware.test.ts` › "answers 403 with an empty body when the origin secret header is missing"
- **Test:** `apps/web/src/__tests__/middleware.test.ts` › "answers 403 with an empty body when the origin secret header is wrong"

#### Scenario: no origin secret is configured

- **GIVEN** no `CF_ORIGIN_SECRET`
- **WHEN** the origin guard checks a request with no origin header
- **THEN** it reports the request trusted
- **Test:** `apps/web/src/lib/origin-guard/__tests__/originGuard.adapter.test.ts` › "assertTrustedOrigin passes through when no secret is configured"

#### Scenario: an exempt path is requested

- **GIVEN** the middleware matcher
- **WHEN** a built static asset, an optimised image, the favicon, an image or a font is requested, and then a page
- **THEN** the middleware does not run for the first five, and runs for the page
- **Test:** `apps/web/src/__tests__/middleware.test.ts` › "does not run for the paths the guard exempts"
- **Test:** `apps/web/src/__tests__/middleware.test.ts` › "runs for a page route"

### Requirement: WEB-38 — A render crash shows the error state and is reported once

The web app SHALL catch a render crash below the root layout with the root `error.tsx` boundary,
and a crash of the root layout itself with `global-error.tsx`, which renders its own document;
each SHALL show the error state with its generic copy and a Try again button that retries the
segment, and report the error it caught to the observability port once, through
`reportBoundaryError` under `src/lib/observability/`, however often the boundary renders.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a route crashes while rendering

- **GIVEN** a route below the root layout throws while rendering
- **WHEN** the root error boundary renders and Try again is pressed
- **THEN** the generic error title and message are shown in an alert, and the segment is retried once
- **Test:** `apps/web/src/app/__tests__/error.test.tsx` › "renders the generic error state for a render crash"
- **Test:** `apps/web/src/app/__tests__/error.test.tsx` › "retries the segment when Try again is pressed"

#### Scenario: the root layout crashes

- **GIVEN** the root layout throws while rendering
- **WHEN** the global error boundary renders
- **THEN** it renders its own html and body, holding the generic error state
- **Test:** `apps/web/src/app/__tests__/global-error.test.tsx` › "renders the generic error state in its own document"

#### Scenario: the crash is reported

- **GIVEN** a boundary holding a caught error
- **WHEN** it renders, and renders again with the same error
- **THEN** the observability port captures that error once, with the boundary source
- **Test:** `apps/web/src/app/__tests__/error.test.tsx` › "reports the crash to observability once"
- **Test:** `apps/web/src/app/__tests__/global-error.test.tsx` › "reports the root layout crash to observability once"

#### Scenario: the report helper

- **GIVEN** the boundary report helper over an observability port
- **WHEN** one error is reported twice and another once
- **THEN** the port captures each error once
- **Test:** `apps/web/src/lib/observability/__tests__/reportBoundaryError.helper.test.ts` › "captures an error once however often it is reported"
- **Test:** `apps/web/src/lib/observability/__tests__/reportBoundaryError.helper.test.ts` › "captures each distinct error"
