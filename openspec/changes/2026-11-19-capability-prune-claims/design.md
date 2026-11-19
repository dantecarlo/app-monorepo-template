# Design: a capability prune leaves nothing stale

The manifest gains a contract: who owns a registry entry, and who owns lines of a file another
owner keeps. Both answer the manifest's one question, "who deletes this by default", for things
smaller than a file.

## Decision

1. **Registry ownership is a field of each entry.** Every entry of
   `.agents/contracts/dependencies.json` carries `owner`: a capability id of
   `template.manifest.json`, or `core`. `verify:manifest:coverage` fails an entry with no owner or
   with an owner the manifest does not declare; an absent capability's prune removes every entry
   it owns, with its seam globs.
2. **Which owner an entry names, and what a `remove-dep` takes.** Ownership follows the claims,
   as it does for files: an entry belongs to the capability that claims every `package.json`
   declaring its package, or, for a workspace package (`@app/*`), its folder. When no capability's
   claims alone remove the package, it belongs to the one whose claims and `remove-dep` actions
   together remove it (`supabase` for `@supabase/supabase-js`, `e2e-playwright` for
   `@playwright/test`). Otherwise it is `core`, as is `node:*`. The cross-cutting case is a verb,
   as `remove` is for files: a `remove-dep` that takes a package from the last `package.json`
   declaring it also takes the package's entries, unless their owner is `core`, which is never
   pruned. So `@sentry/nextjs` belongs to `web-next`, whose `package.json` declares it, and the
   `sentry` capability's `remove-dep` takes it; a web-only project that keeps Sentry loses the
   `@sentry/react-native` entry with `mobile-expo`. Found at apply: with `sentry` as their owner,
   the `mobile-expo` prune of this repository left the `@sentry/react-native` entry stale.
3. **The Sentry requirements move into a spec the capability claims.** A new living spec,
   `openspec/specs/capabilities/sentry/spec.md` (prefix `SENTRY`), holds the requirements whose
   tests the `sentry` prune deletes and governs the Sentry files; the capability claims the
   file. The web and mobile specs keep their other requirements and stop citing or governing a
   Sentry file.
4. **Q2: a capability owns regions, and no verb is added.** A region is the lines from a
   `region <capability>` comment to the matching `endregion <capability>` comment, the comment
   written in the file's own syntax: `# region sentry` in YAML and dotenv, `// region sentry` in
   JavaScript and TypeScript, `<!-- region sentry -->` in Markdown, each alone on its line. The
   prune of that capability drops both markers and every line between; regions of other
   capabilities stay. Regions do not nest. `verify:manifest:coverage` fails a region that names a
   capability the manifest does not declare (`core` included: core is never pruned), and one that
   is opened and never closed, closed and never opened, closed under another name, or opened
   inside another.
5. **Supabase.** The `supabase` capability removes `@app/supabase` and `@supabase/supabase-js`
   from both apps' `package.json` and `@supabase/ssr` from the web app's, with `remove-dep`; it
   owns the three registry entries, by decision 2.
6. **`prune-boundary` judges what the prune leaves, regions dropped first.** Beside imports and
   Expo plugins it lists a kept spec that cites a file the prune deletes, a kept source file that
   names one by a relative path string, a key of a kept `.env.example` that only pruned files
   read, and the three registry findings `verify:dependency-seams` would report after the prune.
   The caller hands it the region reader of the manifest engine, as it hands it the glob matcher.

## Options considered

| Question              | Option                                                                  | For                                                                                                                                                                            | Against                                                                                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registry ownership    | **An `owner` field on each entry**                                      | One place to edit when a package is registered, so its owner is decided then; one field cannot hold two owners, so a conflict cannot be written; no second list to drift from | The registry learns the manifest's capability ids, which the coverage gate must cross-check                                                                                                        |
| Registry owner rule   | **The claims decide; a `remove-dep` takes the entries of the package it removes last** | One owner per entry, as for files; the `sentry` entries go with either the Sentry prune or the app's prune | An entry owned by `web-next` goes with the `sentry` prune, which reads as indirect until `docs/manifest.md` says why |
| Registry owner rule   | The capability that adds the package owns it (`sentry` owns `@sentry/*`) | Reads naturally in the registry                                                                                                                                                | A prune of the app alone (a web-only project with Sentry) leaves `@sentry/react-native` stale: two capabilities remove it, and one field holds one |
| Registry ownership    | A manifest claim per entry (`"registry": ["@sentry/nextjs"]`)           | The manifest stays the only file that names an owner                                                                                                                           | Every package is named twice, in two files; the gate needs the unclaimed, conflict and stale-claim classes again for entries; a package registered without a claim drifts until the gate runs |
| Spec claim            | **Move the requirements into a spec the capability claims**             | The existing file claim prunes them; the web spec's `Governs` line, one field that `scripts/specs.detect.mjs` reads whole, stops naming Sentry files; `verify:specs` unchanged | IDs WEB-29, WEB-30, MOBILE-26 and MOBILE-27 retire; the new spec's row in `openspec/README.md` § 2.1 stays after a prune, like every capability spec's row                                     |
| Spec claim            | The capability claims the requirements' lines with regions              | The requirements stay in the spec of the unit that enforces them                                                                                                               | The `Governs` line names the five Sentry root files and cannot be split by a region, so `report:spec-drift` lists the web spec as governing missing files after every Sentry prune             |
| Q2: the YAML key      | A new verb (`remove-yaml-key`, with `file` and `path`)                  | Declared in the manifest, checked by `verify:manifest` like every verb                                                                                                         | Solves one file kind; the keys of both `.env.example`, the Vitest alias and the global map's rows each need another verb or a rewrite; an executor must edit YAML and keep its comments          |
| Q2: the YAML key      | **A capability-owned region**                                           | One mechanism for every text file that has comments: YAML, dotenv, TypeScript and Markdown; the text stays where it is read; the vocabulary of six verbs stays closed           | A grammar to hold (markers, balance, known owners), which the coverage gate checks; a Markdown table row cannot sit in a region, so a table is split or kept whole                              |
| Supabase              | **`remove-dep` per app dependency**                                     | The verb exists; `prune-boundary` and `verify:dependency-seams` read the result                                                                                                | Three more actions in the manifest                                                                                                                                                                 |

## Why this one

- **The owner field** keeps ownership single by construction, which is the rule the manifest
  exists for (`docs/manifest.md`, "Exactly one owner"), and it puts the decision where a package
  is added. The coverage gate already reads the manifest; reading the registry beside it closes
  the same two doors the file claims close: an entry nobody owns fails, and an owner nobody
  declares fails. The owner decided per entry on 2026-11-19 ("Ownership per entry").
- **The capability spec** is the only option that leaves the web and mobile specs with no Sentry
  file in their `Governs` lines, their evidence or their tests, and it needs no change to how
  `verify:specs` or `report:spec-drift` read a spec. The unit is the optional Sentry provider,
  whose files the `sentry` capability claims or removes in both apps; like the harness specs,
  whose units span folders, its spec is named after the unit (`capabilities/sentry`) and its
  `Governs` line lists the files.
- **Regions** are the smallest mechanism that keeps the verbs closed: one grammar, no verb, and
  it closes every text place F49 lists that a file claim cannot (the `.env.example` keys, the
  alias, `allowBuilds`, the global map's rows), where a verb would close only YAML. It is the
  region-marker mechanism blocker B4 names, applied first to the `sentry` capability. The
  coverage gate holds the grammar, and `prune-boundary` drops the regions before it judges a kept
  file, so a region that leaves something dangling is still found.
- **The rewrites.** Where a document names Sentry as the provider (`README.md`,
  `docs/infrastructure.md`, ADR 0001, ADR 0002), the text names the default provider or no
  provider, so it stays true whether the capability is kept or pruned; a region there would drop
  a sentence from the middle of a list or a blockquote.
