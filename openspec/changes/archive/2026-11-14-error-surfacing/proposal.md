# Proposal: show the error toasts and catch render crashes in both apps

> **Status:** archived — 2026-11-14

## Why

`docs/code-standards.md` § 19 sends a mutation error to a global toast and a render crash to a
global `ErrorBoundary` with an `ErrorState`, but neither app delivers either. Writing the living
specs found it (F9 of `docs/INIT_AND_HARNESS_PLAN.md`, the web open question Q4 and the mobile
open questions Q2 and Q3):

- no `Toast` viewport is mounted, in `apps/web/src/app/providers.tsx` or in
  `apps/mobile/src/app/_layout.tsx`, so every toast reaches the store and nothing shows it;
- no `error.tsx` or `global-error.tsx` ships on web and no route exports an `ErrorBoundary` on
  mobile, so a render crash is left to the framework's default handling, with no `ErrorState`
  and no retry;
- `useAppQuery` resolves the message and schedules a toast in its render body while the query is
  in error (`apps/mobile/src/lib/query/useAppQuery.hook.ts:27-36`), so every render of a failed
  query queues another toast. F9 names mobile; the web hook has the same lines
  (`apps/web/src/lib/query/useAppQuery.hook.ts:33-42`), and mounting the web viewport would show
  each copy.

The owner's words:

- 2026-11-14 (translated from Spanish): "Do this task here: “Show error toasts and add an error boundary (F9)”"

## What changes

- **One toast per failure.** `useAppQuery`, in both apps, queues the error toast from an effect,
  once for each failure of the query (its `errorUpdateCount`), however often the component
  re-renders; a later failure queues a new one.
- **The toast viewport.** The web root providers and the mobile root layout mount the existing
  `Toast` component, so every toast in the store is shown with its dismiss control. The mobile
  toast pill gains the glass background and a coloured dismiss glyph it lacked, so it reads on
  any screen.
- **Render crashes.** Web ships `apps/web/src/app/error.tsx`, the root segment's boundary, and
  `apps/web/src/app/global-error.tsx`, which replaces the root layout when it crashes and renders
  its own document; both show the `ErrorState` with its generic copy and a retry. Mobile ships a
  `RootErrorBoundary` component that renders the `ErrorState` on the theme background, and the
  root layout exports it as its `ErrorBoundary`, which Expo Router wraps around every route.
- **Mobile render tests.** The shared `react-native` test double renders `View`, `Text` and
  `Pressable` as DOM elements that carry their accessibility role, label and press handler, so a
  mobile component can be rendered and pressed in a test; no existing test renders one.
- **The docs.** `docs/architecture/web.md`, `docs/architecture/mobile.md` and
  `docs/maps/global-map.md` say what now ships.

## Out of scope

- Where a query error shows (web Q3, mobile Q1): the standards put it in a per-screen
  `ErrorState`, the code toasts it. This change keeps the toast and only stops the duplicates;
  moving it is the owner's call.
- The English copy written in components (F14), the toast dismiss label among it: the label
  stays as it is, for F14 to move into the catalogs with the rest.
- Reporting a crash a boundary catches to the observability port: § 19 single-sources capture in
  the query and mutation caches and says nothing of render crashes.
- One toast for several components that observe the same failing query: each `useAppQuery` call
  still queues its own.
- A `loading.tsx` or `not-found.tsx` route file.

## Affected specs

- `openspec/specs/apps/web/spec.md`: modifies WEB-26; adds WEB-37 and WEB-38; open question Q4
  closes at archive.
- `openspec/specs/apps/mobile/spec.md`: modifies MOBILE-20; adds MOBILE-36 and MOBILE-37; open
  questions Q2 and Q3 close at archive.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
