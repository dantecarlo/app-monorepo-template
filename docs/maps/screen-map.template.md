# Screen map — `<ScreenName>`

> Per-screen internal map. **Copy this file** to document one screen's own
> members. Suggested location: alongside the screen
> (`src/screens/<ScreenName>/screen-map.md`) or under `docs/maps/screens/`.
>
> Scope: this maps a SINGLE screen's **local** members only. Anything shared by
> more than this screen does NOT belong here — it lives in the
> [global map](global-map.md). The litmus test for every row below:
>
> > **"Used by more than this screen?"** → yes = global (move it out),
> > no = screen-local (keep it here).
>
> Replace every `<placeholder>` and delete rows that do not apply.

## Identity

| Field        | Value                                                |
| ------------ | ---------------------------------------------------- |
| Screen       | `<ScreenName>`                                       |
| App(s)       | `web` / `mobile` / both                              |
| Root folder  | `apps/<app>/src/screens/<ScreenName>/`               |
| Route        | `<route path or file-based route entry>`             |
| Roles/access | `<who can see it>`                                   |
| Purpose      | `<one sentence: what this screen does for the user>` |

## Screen entry

| Member             | File                      | Responsibility                                                                                                                  |
| ------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Screen (container) | `<ScreenName>.screen.tsx` | Owns data fetching wiring + layout; composes components; handles loading / empty / error states. No business logic, no `fetch`. |
| Barrel             | `index.ts`                | Public export of the screen (and anything it re-exports).                                                                       |

## Local components (`components/`)

Presentational pieces used ONLY by this screen. Each is its own folder with a
component + styles (+ optional local hook) + barrel.

| Component | Folder / files                                                                                               | Renders           |
| --------- | ------------------------------------------------------------------------------------------------------------ | ----------------- |
| `<Comp>`  | `components/<Comp>/<Comp>.component.tsx`, `components/<Comp>/<Comp>.styles.ts`, `components/<Comp>/index.ts` | `<what it shows>` |
| `<Comp2>` | `components/<Comp2>/...`                                                                                     | `<...>`           |

## Local hooks (`hooks/`)

All view logic lives here — derived state, side effects, query wiring. Screens
and components stay render-only.

| Hook         | File                       | Returns / does                                       |
| ------------ | -------------------------- | ---------------------------------------------------- |
| `use<Thing>` | `hooks/use<Thing>.hook.ts` | `<data + state the screen needs; calls the service>` |

## Local models (`models/`)

Types/contracts scoped to this screen's view (ViewModels, prop shapes).

| Model                      | File                     | Describes                  |
| -------------------------- | ------------------------ | -------------------------- |
| `I<Thing>` / `<Thing>Type` | `models/<Thing>.type.ts` | `<the view-model / shape>` |

## Local constants & styles

| Kind      | File                                 | Holds                                             |
| --------- | ------------------------------------ | ------------------------------------------------- |
| Constants | `<name>.constant.ts`                 | Screen-local enums / magic values (never inline)  |
| Styles    | `components/<Comp>/<Comp>.styles.ts` | Class-string / style constants for that component |

## Dependencies out (what this screen uses from elsewhere)

List the GLOBAL things this screen consumes — verify each is in the
[global map](global-map.md).

| Dependency  | Source (global)                                         | Used for                |
| ----------- | ------------------------------------------------------- | ----------------------- |
| `<service>` | `apps/<app>/src/services/<Name>.service.ts` (+ adapter) | `<data access>`         |
| `<store>`   | `apps/<app>/src/stores/<name>.store.ts`                 | `<shared state>`        |
| `<ui kit>`  | `apps/web/src/components/ui/<Comp>`                     | `<reused primitive>`    |
| `<tokens>`  | `packages/tokens/src/tokens.constant.ts`                | `<design values>`       |
| `<i18n>`    | `packages/i18n/src/locales/es.json`                     | `<user-facing strings>` |

## Data flow

```
<ScreenName>.screen.tsx
   └─ use<Thing>.hook.ts        # view logic + query
        └─ <Name>.service.ts    # data access (transversal)
             └─ <Name>.adapter.ts  # DTO → ViewModel
```

> Invariant: **screen → hook → service → adapter**. Never `fetch` in the screen
> or a component; never put business logic in a view.

## Checklist (definition of done for this screen)

- [ ] Every local unit (`.component.tsx` / `.hook.ts` / `.service.ts` /
      `.adapter.ts` / `.helper.ts`) has a sibling `*.test.*`.
- [ ] No inline magic numbers/strings — all in `*.constant.ts` / `*.styles.ts`.
- [ ] Loading / empty / error states handled; user-facing strings via i18n.
- [ ] Imports use `@/*` / `@app/*` aliases — no `../`.
- [ ] `node scripts/verify-maps.mjs` and `pnpm validate` are green.
