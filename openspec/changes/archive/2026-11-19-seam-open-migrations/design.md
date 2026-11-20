# Design: 2026-11-19-seam-open-migrations

## Decision

The registry `.agents/contracts/dependencies.json` declares the migrations still open in an
optional top-level `openMigrations`, an array of `{ id, note }`: `id` is non-empty text no other
declaration repeats, `note` non-empty text that says what the migration moves, and no other key.
A registry without the field declares none. Each entry of `eslint-dependency-seam-allowlist.json`
becomes `{ path, package, migration, reason }`: `migration` is the `id` of one open migration,
`reason` free text. The index the rule and the gate build from the registry (`indexRegistry` of
`eslint-local-rules/dependency-seam.detect.mjs`) gains `openMigrations`, the set of open ids, and
one exported predicate there, `namesOpenMigration`, answers whether an entry names one: the rule's
exemption and the gate's shape check both call it. The gate also fails a declared migration that
no entry names (`migration-stale`), except while the allowlist cannot be read.

The template's registry holds `"openMigrations": []`, written after `packages` so that no line a
living spec cites as evidence moves. A derived project with work in flight declares one migration
per unit of that work, and its entries name them:

```json
"openMigrations": [
  { "id": "f8-unit-3", "note": "F.8 unit 3: the query client moves behind lib/query." }
]
```

```json
{
  "path": "apps/web/src/screens/Home/useHome.hook.ts",
  "package": "@tanstack/react-query",
  "migration": "f8-unit-3",
  "reason": "F.8 unit 3: lib/query takes this import."
}
```

## Options considered

| Option | For | Against |
| ------ | --- | ------- |
| `openMigrations: [{ id, note }]` in the registry, `migration` on each entry | The registry already answers which file may import which package; one list says what is open; an id is matched exactly; the field is additive | Two files to edit when a migration opens |
| `migrations: [{ id, status }]`, open and closed both kept | Keeps a history of closed migrations | A closed declaration is dead weight the gate must still read; the history is git's and the archived changes' |
| Keep the unit in the reason's prose, with the open units listed by a regular expression in the gate | No entry changes shape | The list of open units lives in code, so the template and a derived project need different code, which the owner's option rules out ("The same code serves both repos") |
| A separate `seam-migrations.json` | The registry stays about packages | A third file for one list; the rule and the gate already read the registry |

## Why this one

The owner chose that "every exception must name a migration the project declares open in the
registry", with one code for the template, which declares none, and Certifipago, which declares
its F.8 units 2 to 7. Only a declaration the registry holds lets the same code answer differently
in each repository. An exact id, rather than a prefix of the reason, cannot be satisfied by prose
that merely mentions a unit. Keeping the declaration to the open ones makes closing a migration
one deletion, which the stale-migration finding asks for as soon as no entry names it. Reading the
open ids into the index both consumers already build keeps one reader: the lint cannot exempt an
entry the gate calls malformed for its migration, nor the other way round.
