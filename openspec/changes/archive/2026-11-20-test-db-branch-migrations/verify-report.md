# Verify report: 2026-11-20-test-db-branch-migrations

> **Verified:** 2026-11-20 at `92d1c08`

## Scenarios

| Requirement | Scenario                                   | Test                                                                                                                                         | Result      |
| ----------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| SUPABASE-31 | the checkout's migrations, in order        | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "lists the migrations in name order, with the version and the name the Supabase CLI records" | green       |
| SUPABASE-31 | a migration wrapped in its own transaction | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "drops the begin and commit that wrap a whole migration, and keeps a commit inside it"        | green       |
| SUPABASE-31 | a migration that only begins or only commits | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "keeps the text of a migration that only begins or only commits"                         | green       |
| SUPABASE-31 | a file the CLI does not read as a migration | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "leaves out a file the Supabase CLI does not read as a migration"                          | green       |
| SUPABASE-31 | two files share a version | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses two migrations with the same version, naming both" | green |
| SUPABASE-31 | the migrations travel quoted               | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "lists every migration of the checkout, each text dollar-quoted with a tag none of them can end" | green       |
| SUPABASE-31 | a version the database holds under another name | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "stops on a version the database holds under another name before it applies any migration" | green       |
| SUPABASE-31 | a ledger row with no name | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "treats a ledger row with no name as a conflict" | green |
| SUPABASE-31 | a migration the ledger lacks               | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "applies a migration only when the database's ledger lacks its version"                    | green       |
| SUPABASE-31 | a migration that fails                     | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "runs each migration through a PL/pgSQL execute and names the one that fails"               | green       |
| SUPABASE-31 | a database with no ledger                  | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "applies every migration when the database has no migration ledger"                         | green       |
| SUPABASE-31 | the pgTAP file's transaction               | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "puts the migrations inside each pgTAP file's transaction, right after its begin"           | green       |
| SUPABASE-31 | a pgTAP file outside a transaction         | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses a pgTAP file that does not open with begin, naming it"                             | green       |
| SUPABASE-31 | a pgTAP file outside a transaction         | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses a pgTAP file that does not end with rollback, naming it"                            | green       |
| SUPABASE-31 | a rollback only in a comment | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses a pgTAP file whose rollback is only in a trailing comment, naming it" | green |
| SUPABASE-31 | a transaction controlled in between | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses a pgTAP file that ends its transaction before its last rollback, naming it: %s" | green |
| SUPABASE-31 | a transaction controlled in between | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses $statement between the first begin and the last rollback, naming the file" | green |
| SUPABASE-31 | a savepoint and transaction words outside the code | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "keeps savepoints, and transaction words inside comments, strings and bodies" | green |
| SUPABASE-31 | a psql meta-command | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses a pgTAP file with a psql meta-command, naming it: %s" | green |
| SUPABASE-31 | an opening other than a plain begin | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses any opening other than a plain begin, naming the file: %s" | green |
| SUPABASE-31 | a commit after a form a simpler reader misreads | `packages/supabase/src/__tests__/pgTapCode.helper.test.ts` › "refuses a commit hidden from a masker that misreads Postgres, naming the file: %s" | green |
| SUPABASE-31 | a string continued past a newline | `packages/supabase/src/__tests__/pgTapCode.helper.test.ts` › "refuses a commit after an escape string continued past a newline, naming the file: %s" | green |
| SUPABASE-31 | a string continued past a newline | `packages/supabase/src/__tests__/pgTapCode.helper.test.ts` › "continues a string only past whitespace that holds a newline, as Postgres does: %s" | green |
| SUPABASE-31 | a file the reader cannot pair | `packages/supabase/src/__tests__/pgTapCode.helper.test.ts` › "refuses a quote, a dollar sign or a comment it cannot pair, naming the file: %s" | green |
| SUPABASE-31 | what Postgres reads as one token | `packages/supabase/src/__tests__/pgTapCode.helper.test.ts` › "reads what Postgres reads as one token, nested comments included: %s" | green |
| SUPABASE-31 | the order check's reader stays as it was | `packages/supabase/src/__tests__/sqlCode.helper.test.ts` › "reads the forms the pgTAP check reads on its own exactly as before" | green |
| SUPABASE-31 | standard strings forced on | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "forces standard_conforming_strings on right after the begin, before the migrations" | green |
| SUPABASE-31 | a file that could turn standard strings off | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "refuses a pgTAP file that could turn standard_conforming_strings off, naming it: %s" | green |
| SUPABASE-31 | a mention in a comment or a string | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "keeps a pgTAP file that mentions the setting only in a comment or a string: %s" | green |
| SUPABASE-31 | a Unicode-escape identifier | `packages/supabase/src/__tests__/pgTapCode.helper.test.ts` › "refuses any U&"..." identifier, whose escapes could spell a refused name, naming the file: %s" | green |
| SUPABASE-31 | a Unicode-escape identifier | `packages/supabase/src/__tests__/pgTapCode.helper.test.ts` › "keeps U& in a string, a comment, a U& string or inside a quoted identifier: %s" | green |
| SUPABASE-31 | the reader's two views | `packages/supabase/src/__tests__/pgTapCode.helper.test.ts` › "blanks every comment, string, quoted identifier and dollar body, keeping each offset" | green |
| SUPABASE-31 | the reader's two views | `packages/supabase/src/__tests__/pgTapCode.helper.test.ts` › "keeps the quoted identifiers and dollar bodies in the view a mention is searched in" | green |
| SUPABASE-31 | the reader's two views | `packages/supabase/src/__tests__/pgTapCode.helper.test.ts` › "reads nothing when a token never closes or a $ pairs with nothing" | green |
| SUPABASE-31 | a change built at run time | Not covered | not run |
| SUPABASE-31 | the package's pgTAP files                  | `packages/supabase/src/__tests__/pgTapBundle.helper.test.ts` › "bundles every pgTAP file of the package"                                                    | green       |
| SUPABASE-31 | a branch's new migration on a linked project | Not covered                                                                                                                                                 | not run     |
| SUPABASE-32 | no target set                              | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs supabase test db --linked over the bundle when the config names no target"              | green       |
| SUPABASE-32 | the linked target                          | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs supabase test db --linked over the bundle for the linked target"                         | green       |
| SUPABASE-32 | the local target                           | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs supabase test db --local over the bundle for the local target"                           | green       |
| SUPABASE-32 | the off target                             | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs no database test for the off target"                                                    | green       |
| SUPABASE-32 | a target it does not know                  | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "refuses a target it does not know, naming the ones it takes"                                  | green       |
| SUPABASE-32 | a null target | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "refuses a null target, naming the setting" | green |
| SUPABASE-32 | a dry run                                  | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "writes the bundle and names the command without running it on a dry run"                     | green       |
| SUPABASE-32 | a suite fails                              | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "fails with the exit status of the CLI when a suite fails"                                     | green       |
| SUPABASE-32 | the CLI cannot start                       | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "fails when the Supabase CLI cannot start"                                                    | green       |
| SUPABASE-32 | a pgTAP file it cannot bundle              | `packages/supabase/src/__tests__/testDbRun.helper.test.ts` › "runs nothing when a pgTAP file cannot be bundled"                                            | green       |
| SUPABASE-32 | the local target on a real stack           | Not covered                                                                                                                                                 | not run     |

Each test was seen red before its code: the 13 bundle tests and the 9 runner tests against stubs
that returned nothing, and the quoting rule twice more, once with a tag check that ignored where
a text's end meets the closing tag and once with the block's tag left unchecked.

The wiring of `scripts/supabase-test-db.mjs` was run offline, with no `supabase` on `PATH`:
`--dry-run` wrote a 69 147-byte bundle of `rls_profile.test.sql` whose `do` block sits right
after its `begin;` and lists the 13 migrations; `pnpm --filter @app/supabase test:db --dry-run`
passed the flag through; a run without the CLI exited 1 with "the Supabase CLI could not start:
spawnSync supabase ENOENT" and removed its bundle; an unknown flag exited 1.

## Correction after the independent verifier, 2026-11-20

The verifier found two blockers: a `rollback;` inside a trailing comment passed the check, with
LF and CRLF, and a `commit;` or `end;` between the first `begin;` and the last `rollback;`
passed it; in both, the migrations would be committed. The fix, at `27f01c9`, reads each pgTAP
file with `SQL_NON_CODE_TOKEN_PATTERN` of `src/sqlCode.constant.ts` blanking its comments,
strings and dollar-quoted bodies to spaces, offsets kept, then requires a plain `begin;` first,
`rollback;` last and no transaction-control statement in between, and refuses any psql
meta-command. With it: two migrations sharing a version are refused, both named; a ledger row
with no name is a conflict; a `null` target is refused, naming the key.

Seen red before the fix: 19 tests, each for its stated reason (the two probes and their CRLF
case, nine transaction-control statements, three meta-commands, the shared version, the
`is distinct from` and `%L` conflict text, and the null target). Three tests passed before and
after, pinning behaviour the stricter check keeps: a savepoint with transaction words in
comments, strings and a `do` body, and the refusal of `begin isolation level serializable;`
and `start transaction;` openings, which stay refused as a conservative choice.

Whether the CLI sees a bundle outside `supabase/tests/` was read offline from the installed
CLI 2.109.1 (`~/scoop/apps/supabase/current/supabase.exe`, its bundled `legacy.test.db`): every
path argument is bind-mounted read-only into the `pg_prove` container at its own path without
the drive letter, and `pg_prove -r` runs over it, so the bundle under the system's temporary
directory is visible. `supabase test db --help`, run with every HTTP request sent to a dead
local proxy, says only "Paths to test files or directories". No live run has confirmed it.

## Second correction, 2026-11-20

The recheck closed B1 and found B2 still open: in six forms the shared masker
(`SQL_NON_CODE_TOKEN_PATTERN`) read a real `commit;` as part of a string, comment or body. The
forms were an escape string with `\'`, `--` inside a quoted identifier, `'` inside one (and
a `"a/*b"` ... `"c*/d"` pair), `$` inside identifiers (`a$b$` ... `c$b$`), a `--` comment
ended by a lone CR, and a non-ASCII dollar tag. The fix, at `fb4785c`, gives the pgTAP check a
reader of its own in `src/pgTapBundle.helper.ts` that splits SQL as `scan.l` does, and fails
closed on a quote, a quoted identifier, a dollar-quoted body or a nested comment that never
closes, and on a `$` that pairs with nothing.

Seen red before the fix: 14 tests. The seven hidden commits were accepted; five of the six
unpaired files were accepted, and the stray `$` too; and a `commit;` inside a nested comment
was refused. The order check's reader is unchanged: `git diff 80795f1 -- src/sqlCode.constant.ts
src/sqlCode.helper.ts src/findMigrationOrderViolations.helper.ts` is empty, and `packages/supabase/src/__tests__/sqlCode.helper.test.ts` pins its
pattern and its output on the six forms, green before and after. The verifier's whole case list
(`b2-check.mjs`, copied to this writer's scratchpad and pointed at this branch) refuses every
B1, B2 and masker case and accepts both allowed files.

## Third change, on the owner's word, 2026-11-20

The final recheck closed the six earlier forms and found one more: Postgres joins a string,
whitespace that holds a newline and the next `'` into one string, in the same mode
(`quotecontinue` in `scan.l`), so a continued escape string keeps its backslash escapes; the
reader ended the string there, closed the next part at `\'` and paired its last quote with a
later one, hiding a real `commit;`. The owner's words, 2026-11-20 (translated from Spanish):
"Imitate Postgres". The fix, at `ec25a89`, continues the string as `scan.l` does.

Seen red before the fix: 4 tests, the verifier's three probes (a continued escape string, the
same inside a pgTAP call, and with a `--` comment line after the newline) and one with a `--`
comment before the newline. The brief said a comment before the newline ends the string; `scan.l`
reads otherwise (`whitespace_with_newline` is `{horiz_whitespace}*{newline}{special_whitespace}*`
and `horiz_whitespace` is `({horiz_space}|{comment})`), the verifier's own probe C2 reads it so,
and reading it as a continuation fails closed: a wrong reading refuses a file, never hides a
commit. Three pins passed before and after: an escape string followed by whitespace with no
newline ends there, and a plain string continued past a newline, with or without a comment,
still bundles. The verifier's `b3-check.mjs`, copied and pointed at this branch, refuses every
B1, B2, masker and continuation case and accepts every allowed file.

Two forms are still read differently from Postgres and need no fix: `select 1$a$ ' $a$; commit;
-- '` and `select $$x$$E'\' '; commit; -- '`. Postgres rejects both as syntax errors, which
abort the transaction, so neither can commit.

## Fourth change, on the owner's word, 2026-11-20

The owner chose, for `standard_conforming_strings` off, 2026-11-20 (translated from Spanish):
"Force it and refuse mentions". The fix, at `4f29212`, inserts `set local
standard_conforming_strings = on;` right after each file's first `begin;`, before the
migrations block, and refuses a file whose code, quoted identifiers and dollar bodies included,
names the setting in any case or calls `set_config`, or runs `reset all`, which would undo a
`set local`. A mention inside a comment or a string stays allowed. The reader moved to
`src/pgTapCode.helper.ts` with a test of its own, and the reader-focused cases of the bundle's
test moved there with it, so every file stays under 500 lines.

Seen red before the fix: 8 tests (the forced line, in the new test and in the exact bundle the
splice test compares, and six refusals: `set`, mixed-case `SET`, `set_config` of the setting,
a quoted `pg_catalog."set_config"`, `set_config` inside a `do` body, and `reset all`), and the
reader's new test, red until the module existed. Three tests passed before and after, pinning
that a mention inside a comment or a string is kept.

The one remaining gap, not covered on the owner's word: a change of the setting the file does
not name, as `execute` of a name built at run time or a function the migrations or the database
hold.

## After the native reviews, 2026-11-25

Five native reviews approved the change; two findings touched its safety premise.

- **Interior transaction control** (`R1-rollback-guard-end-only`, `R3-interior-commit-unchecked`,
  at `pgTapBundle.helper.ts:192-196`): those lines are the end-only `TRAILING_ROLLBACK_PATTERN`
  check of the first work-unit commit, `51c1ad2`. Since `27f01c9` the check reads the code view
  and refuses `commit`, `end`, `abort`, a `rollback` before the last, `begin`,
  `start transaction`, `prepare transaction`, `commit prepared`, `rollback prepared` and
  `set transaction` between the first `begin;` and the last `rollback;`; the scenario "a
  transaction controlled in between" names its tests. A probe at `29862ad` refused every listed
  form and `commit and chain`, `end work`, `abort transaction`, `rollback work` and
  `begin isolation level serializable` mid-file, so no test could be seen red and no code
  changed. `release savepoint` stays allowed: it names a savepoint only, the file's `begin;` is
  none, and a name no savepoint holds is an error that aborts the transaction, so it cannot
  commit what the bundle applied.
- **Unicode-escape identifiers** (`R1-unicode-identifier-bypass`, `R3-uescape-identifier-bypass`,
  at `pgTapBundle.constant.ts:34-35`): `U&"s\0065t_config"`, or a name with a `UESCAPE`
  clause, spelled a refused name the search could not see. The fix, at `6cdbbaa`, refuses every
  `U&"..."` identifier rather than decoding it, since a decoder that misread an escape would
  fail open. Seen red before it: 3 tests (the escaped `set_config`, the `UESCAPE` form and a
  plain `u&"plain"`), each "expected [Function] to throw an error". Four pins passed before and
  after: a `U&'...'` string, and `U&` in a string, a comment and a plain quoted identifier.

## Gate

- `pnpm validate`: not run by this change's writer: its brief keeps the shared machine to single test files
  and the package's suite, and the session that integrates it runs it.
- `pnpm --filter @app/supabase test`: exit 0, 2026-11-20, 11 files and 61 tests; after the
  correction, 11 files and 82 tests; after the second, 11 files and 98 tests;
  after the third, 11 files and 105 tests;
  after the fourth, 12 files and 118 tests;
  after the fifth, 12 files and 125 tests.
- `eslint` on every changed source and `tsc --noEmit` of `@app/supabase`: exit 0, 2026-11-20.
- `verify:specs`, `verify:english`, `verify:tests`, `verify:manifest`, `verify:manifest:coverage`,
  `verify:maps`, `verify:dependency-seams`: exit 0, 2026-11-20.
- The prune boundary of `supabase` (`findPruneLeaks` of `packages/tooling/src/prune-boundary.mjs`
  over this branch): 26 findings, none on a file of this change; all are the apps' own Supabase
  wiring, their `.env.example` keys and the app specs that cite it.

## Not verified

- A change of `standard_conforming_strings` the file does not name (`execute` of a name built
  at run time, or a function of the migrations or the database): the one remaining gap.
- The bundle's SQL running on Postgres, and both live scenarios: no gate reaches a database, the
  template links no project, and an agent may not start Docker here (`AGENTS.md`).
- The `local` target on a running stack, which is for a downstream project.
- `pnpm validate` and `knip`, which the integrating session runs.
