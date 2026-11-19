# Design: one spec per unit holds a capability's part, with no exception

The spec format gains one rule and loses one exception: a header may state its governed paths
in several lines, so the lines an optional capability adds can sit in a region the capability
owns, and its requirements beside them. The owner approved this design on 2026-11-19.

## Decision

1. **Several `Governs` lines.** A spec header may hold several `> **Governs:**` lines.
   `parseSpec` of `scripts/specs.detect.mjs` reads their union, in the order they appear, and
   every consumer reads that union: `verify-specs`, which still needs at least one line naming a
   backticked path, and `report-spec-drift`, through `readSpecAnchor`. A line that names no
   backticked path adds nothing to the union.
2. **The capability's part stays in the unit's spec, inside a region the capability owns.** The
   region grammar is the one of `docs/manifest.md` § Regions: a Markdown region runs from the
   marker `<!-- region <capability> -->` to `<!-- endregion <capability> -->`, each alone on its
   line. In `openspec/specs/apps/web/spec.md` and `openspec/specs/apps/mobile/spec.md`, a `sentry`
   region of the header holds the Sentry `Governs` line, a `sentry` region of the Purpose holds the
   paragraph on the Sentry part, and a `sentry` region at the end of the requirements holds the
   Sentry requirements. A `sentry` prune drops the regions; an app prune removes the whole spec.
   The region markers are lines the spec parser reads as nothing: between header lines they match
   no header pattern, and between requirements they fall into the last scenario of the region,
   where only step and test lines are read.
3. **Retired IDs, new IDs.** The specs `openspec/specs/apps/web/sentry/spec.md` and
   `openspec/specs/apps/mobile/sentry/spec.md` are removed. WEBSENTRY-01 to WEBSENTRY-04 become
   WEB-81 to WEB-84, and MOBILESENTRY-01 to MOBILESENTRY-03 become MOBILE-80 to MOBILE-82, the next
   free IDs: the web spec ends at WEB-80 and the mobile spec at MOBILE-79, and no living spec,
   change or archive names a higher one. The `WEBSENTRY` and `MOBILESENTRY` prefixes are gone, and
   a removed ID is never reused.
4. **One source for the governed paths.** The table of `openspec/README.md` § 2.1 keeps the spec
   link and the ID prefix; each spec's header is the one place that states what it governs. The
   exception sentence goes, and § 2.2 states the format of decisions 1 and 2.
5. **The manifest.** The `sentry` capability no longer claims the two removed specs; `web-next`
   no longer removes `openspec/specs/apps/web/sentry/spec.md`, and `mobile-expo` loses the
   `remove` that named only `openspec/specs/apps/mobile/sentry/spec.md`. The regions name `sentry`,
   which the coverage gate checks as it checks every region.
6. **The deltas carry the regions.** A delta that adds a requirement of a capability's part holds
   it inside that capability's region, as the living spec will, so the archive copies the region
   with it. A header line cannot be written as a delta, so the archive adds the two `Governs`
   regions and the two Purpose regions, as the tasks say.

## Options considered

| Question               | Option                                                                  | For                                                                                                                                  | Against                                                                                                              |
| ---------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Where the part lives   | **A region of the unit's spec**                                         | One spec per unit, with no exception; the `sentry` prune drops the lines and the app prune removes the spec, with no claim left over | The parser must read several `Governs` lines; a reader meets markers in the spec                                     |
| Where the part lives   | A spec per app the capability claims (today)                            | No parser change                                                                                                                     | An exception to § 2.1; the app prune leaves the capability's claim stale; two prefixes for one capability            |
| How the paths are read | **The union of every `Governs` line**                                   | One rule for every consumer; a region drops a whole line; the existing single-line specs read the same                               | A spec with a line that names no path still passes when another line names one                                       |
| How the paths are read | One `Governs` line whose paths a region splits                          | One line per spec                                                                                                                    | A region owns whole lines, never part of one, so it cannot drop a few paths of a line                                |
| Where they are listed  | **The spec header only**                                                | One source of truth; the region that drops a header line drops the paths with it                                                     | A reader of the README no longer sees what each spec governs at a glance                                             |
| Where they are listed  | The header and the § 2.1 table (today)                                  | Visible in one table                                                                                                                 | Two sources that drift; a table row cannot sit in a region, so a pruned capability's paths would stay in the table |

## Why this one

- **The owner asked for no exception** (2026-11-19, translated from Spanish): "rather than opening
  exceptions, we have to see how we can adapt it." A region of the unit's spec keeps § 2.1 whole:
  the Sentry part of apps/web is a part of the apps/web spec, and the prune of either capability
  takes exactly its lines.
- **The union is the smallest parser change.** `parseSpec` already reads every line; it keeps
  every `Governs` value instead of the last one, joined in order, so `readSpecAnchor` of
  `scripts/spec-drift.detect.mjs` reads the union without a change of its own, and a spec with
  one line reads as before.
- **The stale claim goes.** The `sentry` capability claims no spec any more, so neither app prune
  can delete a spec it claims; the stale-claim count of a `mobile-expo` prune falls from 1 to 0,
  and that of a `web-next` prune from 7 to 6, the six root files F64 leaves to the executor.
