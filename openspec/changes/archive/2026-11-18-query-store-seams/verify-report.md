# Verify report: 2026-11-18-query-store-seams

> **Verified:** 2026-11-18 at `fef945a`

## Scenarios

Every test ran green in `ATL_TEMPLATE_SELF=1 pnpm validate` at `fef945a` (exit 0): the web
suite 116 files and 447 tests, the mobile suite 81 files and 234 tests. At the base, `a3e7e75`,
they were 113 files and 437 tests, and 77 files and 219 tests.

| Requirement | Scenario | Test | Result |
| ----------- | -------- | ---- | ------ |
| WEB-63 | a query's result | `apps/web/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "returns only the fields of the app's own query result" | green |
| WEB-63 | a mutation's result | `apps/web/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "returns only the fields of the app's own mutation result" | green |
| WEB-63 | the caller's callbacks | `apps/web/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "hands the caller's callbacks one object with the outcome and the variables" | green |
| WEB-64 | the provider | `apps/web/src/lib/query/__tests__/AppQueryProvider.component.test.tsx` › "gives its tree the query client it is handed" | green |
| WEB-64 | a prefix is invalidated | `apps/web/src/lib/query/__tests__/useInvalidateAppQuery.hook.test.ts` › "marks every query under a key prefix stale and no other" | green |
| WEB-64 | an observed query is invalidated | `apps/web/src/lib/query/__tests__/useInvalidateAppQuery.hook.test.ts` › "runs an observed query under the prefix again" | green |
| WEB-65 | a selector's reader | `apps/web/src/lib/store/__tests__/createAppStore.helper.test.ts` › "re-renders a selector's reader when its value changes" | green |
| WEB-65 | a shallow selection | `apps/web/src/lib/store/__tests__/createAppStore.helper.test.ts` › "keeps the same object for a shallow selection while its fields are unchanged" | green |
| WEB-65 | the state outside React | `apps/web/src/lib/store/__tests__/createAppStore.helper.test.ts` › "reads and updates the state outside React" | green |
| WEB-65 | a persisted store | `apps/web/src/lib/store/__tests__/createAppStore.helper.test.ts` › "keeps the fields partialize names in local storage, and starts from them" | green |
| WEB-66 | a file outside the seams imports either library | Not covered — `local/dependency-seam` and `pnpm verify:dependency-seams` (PASS, 42 allowlist entries, none of TanStack Query or zustand) | green gate |
| MOBILE-61 | a query's result | `apps/mobile/src/lib/query/__tests__/useAppQuery.hook.test.ts` › "returns only the fields of the app's own query result" | green |
| MOBILE-61 | a mutation's result | `apps/mobile/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "returns only the fields of the app's own mutation result" | green |
| MOBILE-61 | the caller's callbacks | `apps/mobile/src/lib/query/__tests__/useAppMutation.hook.test.ts` › "hands the caller's callbacks one object with the outcome and the variables" | green |
| MOBILE-62 | the provider | `apps/mobile/src/lib/query/__tests__/AppQueryProvider.component.test.tsx` › "gives its tree the query client it is handed" | green |
| MOBILE-62 | a prefix is invalidated | `apps/mobile/src/lib/query/__tests__/useInvalidateAppQuery.hook.test.ts` › "marks every query under a key prefix stale and no other" | green |
| MOBILE-62 | an observed query is invalidated | `apps/mobile/src/lib/query/__tests__/useInvalidateAppQuery.hook.test.ts` › "runs an observed query under the prefix again" | green |
| MOBILE-63 | a selector's reader | `apps/mobile/src/lib/store/__tests__/createAppStore.helper.test.ts` › "re-renders a selector's reader when its value changes" | green |
| MOBILE-63 | a shallow selection | `apps/mobile/src/lib/store/__tests__/createAppStore.helper.test.ts` › "keeps the same object for a shallow selection while its fields are unchanged" | green |
| MOBILE-63 | the state outside React | `apps/mobile/src/lib/store/__tests__/createAppStore.helper.test.ts` › "reads and updates the state outside React" | green |
| MOBILE-63 | a persisted store | `apps/mobile/src/lib/store/__tests__/createAppStore.helper.test.ts` › "keeps the fields partialize names in the device storage, and starts from them" | green |
| MOBILE-64 | a file outside the seams imports either library | Not covered — `local/dependency-seam` and `pnpm verify:dependency-seams` (PASS, none of TanStack Query or zustand) | green gate |
| MOBILE-03 | a stored theme wins | `apps/mobile/src/lib/theme/__tests__/theme.config.test.ts` › "starts in the theme the device storage holds" | green |
| MOBILE-03 | no stored theme and no device preference | `apps/mobile/src/lib/theme/__tests__/theme.config.test.ts` › "starts in the dark default when nothing is stored and the device has no appearance" | green |
| MOBILE-04 | switching to light | Not covered — no test calls useThemeToggle; `setTheme` is MOBILE-56's | — |
| MOBILE-06 | a regional tag maps to its language | `apps/mobile/src/lib/i18n/__tests__/i18n.config.test.ts` › "normalizes BCP-47 tag to a supported language" | green |
| MOBILE-06 | an unsupported device language | `apps/mobile/src/lib/i18n/__tests__/i18n.config.test.ts` › "falls back to default for an unsupported language tag" | green |
| MOBILE-06 | no device language at all | `apps/mobile/src/lib/i18n/__tests__/i18n.config.test.ts` › "returns the default language for null input" | green |
| MOBILE-06 | a stored language wins | `apps/mobile/src/lib/i18n/__tests__/i18n.config.test.ts` › "starts i18next in the language the device storage holds" | green |
| MOBILE-07 | pressing on the last language | Not covered — no test calls useLanguageSwitcher; `setLanguage` is MOBILE-56's | — |
| MOBILE-56 | a value on the device | `apps/mobile/src/lib/storage/__tests__/keyValueStorage.adapter.test.ts` › "writes, reads and removes a value on the device storage" | green |
| MOBILE-56 | a missing key | `apps/mobile/src/lib/storage/__tests__/keyValueStorage.adapter.test.ts` › "reads null for a key the device storage does not hold" | green |
| MOBILE-56 | the theme choice | `apps/mobile/src/lib/theme/__tests__/theme.config.test.ts` › "stores a chosen theme in the device storage and applies it" | green |
| MOBILE-56 | the language choice | `apps/mobile/src/lib/i18n/__tests__/i18n.config.test.ts` › "stores a chosen language in the device storage and switches i18next to it" | green |
| MOBILE-56 | the seam | Not covered — `pnpm verify:dependency-seams` (PASS, no AsyncStorage entry left) and `local/dependency-seam` | green gate |

## Red before green

Each rule's test was seen failing for its reason before the code it names:

- **The query results** (WEB-63, MOBILE-61): both apps' `useAppQuery` returned TanStack's 26
  fields and `useAppMutation` its 16 (`expected [ 'data', 'dataUpdatedAt', …(24) ] to deeply
  equal [ 'data', 'error', 'isError', …(3) ]`), and the caller's `onSuccess` was called with the
  library's four positional arguments, not one object.
- **The provider and the invalidation** (WEB-64, MOBILE-62): `AppQueryProvider` and
  `useInvalidateAppQuery` did not exist (`Failed to resolve import`).
- **The store factory** (WEB-65, MOBILE-63): `createAppStore` did not exist.
- **The device storage** (MOBILE-03, MOBILE-06, MOBILE-56): with `@/lib/storage` replaced by an
  in-memory storage, the theme bootstrap applied the device's dark appearance over a stored light
  (`expected "set" to be called with arguments: [ 'light' ]`), `setTheme` left the storage empty
  (`expected null to be 'light'`), i18next started in the device's English over a stored Spanish,
  and `setLanguage` left the storage empty: both configs wrote AsyncStorage directly.
- The dark default with nothing stored (MOBILE-03) passed at the base too: it pins the fallback
  the move to the port touches.

The tests that existed before the change, every query, mutation, store and screen test, kept
their assertions; only the wrapper they render through changed, from TanStack's provider to
`createQueryWrapper` and `AppQueryProvider`.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-18, at `fef945a`.
- `pnpm --filter @app/web build`: exit 0 at `fef945a`.
- `pnpm --filter @app/mobile export:web`: exit 0 at `fef945a`; `apps/mobile/dist-web` removed.
- `pnpm verify:dependency-seams`: allowlist 61 entries at the base, 42 after (19 removed: 8
  `@tanstack/react-query`, 8 `zustand`, 3 `@react-native-async-storage/async-storage`).

## Not verified

- WEB-66, MOBILE-64 and the seam of MOBILE-56 have no test of their own: the lint rule and the
  gate hold them, whose own scenarios are harness/dependency-seams SEAM-03 and SEAM-07.
- MOBILE-04 and MOBILE-07 stay uncovered: no test presses the theme switch or the language
  switcher, which live in `components/ui/`.
- `AppQueryClientType` is TanStack's `QueryClient` under a project name; no gate checks that code
  outside `lib/query` and the tests never calls it.
- No device run: the mobile bundle was exported for the web, not started on iOS or Android, so the
  persisted store over AsyncStorage ran only against its in-memory mock.
