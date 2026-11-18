# Proposal: a consent mode for PostHog, and a consent API the apps own

> **Status:** archived — 2026-11-18

## Why

Row F46 of `docs/INIT_AND_HARNESS_PLAN.md` records that PostHog keeps a distinct id in a cookie or
local storage, which some jurisdictions treat as needing consent. Today both clients capture from
the start with the SDK's normal persistence
(`apps/web/src/lib/posthog/posthogClient.adapter.ts:16-28`,
`apps/mobile/src/lib/posthog/posthogClient.adapter.ts:10-19`), and nothing in either app can hold
capture until a user agrees, or keep PostHog off the device.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen or section files must contain only positioning, and the components are what must hold the other styles, but everything centralized in styles and the tokens. Fix everything you mention applying what is recommended, and once everything is fixed tell the Arquitecto to integrate it and fix everything"
- 2026-11-18 (translated from Spanish), answering "should I add a consent mode for PostHog's cookie, and have `/init` ask about it, or leave it as is?": "Yes, add it if it is requested, if you want PostHog, and continue with the plan"

The parent session reads that as: the consent mode is an option a project chooses, and `/init`
asks for it when the project picks PostHog; a project that does not choose it keeps today's
behaviour. The decisions it made for this change, applied as stated:

- One setting per app, `NEXT_PUBLIC_POSTHOG_CONSENT` and `EXPO_PUBLIC_POSTHOG_CONSENT`, read through
  the app's constant file, with three values: `granted` (the default, today's behaviour),
  `opt-in` (nothing captured and nothing stored until consent is granted; a grant starts capture
  with normal persistence; a revoke stops it and clears what the SDK stored) and `memory`
  (capture runs, the SDK keeps nothing on the device, each visit or launch gets a new anonymous
  id). An unknown value is a configuration error, strict unless the SDK makes that unsafe.
- Each mode maps onto the installed SDK's own options, read from its types.
- A provider-agnostic consent API the app owns: grant, revoke and read the status. Only
  `src/lib/posthog/` imports the SDK. No banner is built.
- The privacy defaults stay under every mode: recording off, autocapture off, the URL scrub.

## What changes

- **packages/core:** the consent port, `IConsentPort`, and `ConsentStatusEnum` (`granted`,
  `denied`, `pending`, `not-required`), beside the observability port.
- **apps/web:** `src/lib/posthog/` reads the mode, refuses an unknown one, and initialises
  PostHog with the mode's options; `src/lib/observability/` gains the PostHog consent adapter and
  the composition root `consent`, exported from its barrel.
- **apps/mobile:** the same, plus a consent storage under `src/lib/posthog/` that PostHog writes
  through in `opt-in` mode: it holds every value in memory until a grant and removes what it
  wrote on a revoke.
- **Docs:** `docs/observability.md` (the three modes, what each stores, where a banner calls the
  API, and that `/init` asks for the mode when the project picks PostHog), both `.env.example`
  files, the env table of `AGENTS.md`, the architecture docs and the global map.

## Out of scope

- **A consent banner.** It is product work; the docs say where one calls the API.
- **The `/init` question itself.** The executor of Stage 6 asks it; this change gives it the
  setting to write.
- **A secret inside a URL path segment** (`/reset/<token>`), the second finding of F46: the URL
  scrub is unchanged.
- **PostHog's cookieless mode** (`cookieless_mode`): it needs a setting enabled in the PostHog
  project, without which the SDK's events are ignored, so no mode depends on it.
- **The client IP** PostHog records: a project setting, not an SDK option.

## Affected specs

- `openspec/specs/packages/core/spec.md`: CORE-27 added
- `openspec/specs/apps/web/spec.md`: WEB-51 modified; WEB-55 to WEB-57 added
- `openspec/specs/apps/mobile/spec.md`: MOBILE-50 modified; MOBILE-52 to MOBILE-55 added
