# Verify report: 2026-11-12-english-only

> **Verified:** 2026-11-13 at `5208df0`, after the correction batch below

## Scenarios

This change adds no delta: the harness stays unspecified, as decided in `2026-11-11-adopt-sdd`
(`openspec/README.md` § 2.1). Its proof is the tests and gates each task ran.

| Task | Commit    | Checks run                                                                                                                                                                                                 | Result                                                                                                                                                 |
| ---- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T1   | `1643cd4` | `verify:english:test` against a stub detector, then the real one; `verify:english` on the tree; manifest gates; `verify:specs`; `verify:maps`; Prettier, ESLint and the 500-line check on the four scripts | red, 11 of 19; then 19 of 19; the tree gave exit 1 with 75 lines, all in the three files T2 to T4 translate; green; the largest script holds 275 lines |
| T2   | `284786f` | `verify:english`; a loose scan of the plan for any single Spanish word; Prettier on the plan; `verify:specs`                                                                                               | no line left in the plan; the loose scan found only English tokens such as `vX.Y.Z`; green                                                             |
| T3   | `a75133f` | `verify:english`; the Prettier drift of the file before and after                                                                                                                                          | no line left; the same 97 lines of drift before and after, from the file's embedded Markdown blocks, so Prettier was not run                           |
| T4   | `ceebeb0` | `vitest run` on `Items.adapter.test.ts`; Prettier and ESLint on it; `verify:english`                                                                                                                       | 11 of 11; green; the whole tree passes with an empty allowlist                                                                                         |
| T5   | `d4c3179` | a Spanish sentence planted in a tracked doc; a stale allowlist entry; an entry quoting a planted accented line with a JSON escape; `verify:maps`; manifest gates; `verify:specs`                           | exit 1 naming the line; exit 1 naming the entry; exit 0; green, 243 map references resolve, 923 files owned once                                       |

## Independent verifier

An independent verifier read the change as it was first archived (`e792d91`). It found no
blocker. It judged the 23 translated owner quotes of `docs/INIT_AND_HARNESS_PLAN.md` faithful to
their originals. Its probes left advisories only, and one correction batch closed every one of
them, one commit per theme:

| Commit    | Closes                                                                                                                                                                                       | Checks run                                                                                                                                                                                                          | Result                                                                                                                                                         |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `3957a8f` | Spanish the two-word rule could not see: the segment labels and ids of the SegmentedControl test, the SearchBar and Toggle labels, and the bilingual owner heading of the general-plan skill | `vitest run` on the three test files; the general-plan validator on its own template before and after                                                                                                               | 11 of 11; the same 16 checks with the same results (the 12 section checks pass; the 4 frontmatter checks fail on the template's empty placeholders, as before) |
| `2d8727c` | Qik file names and paths in this repository: the 55 Qik rows of the harness audit and their 48 remediation items, and the local machine paths in the two plans                               | the audit JSON parsed from a script; `git grep` for the old names under `docs/audits`; `verify:english`                                                                                                             | valid JSON with the same row count; no match; green                                                                                                            |
| `5ccebe6` | a decomposed accent passed; 12 of the 16 characters, the threshold of 2 from above, and the distinct count were pinned by no case                                                            | the new cases against the old detector; the old and the new cases against 19 mutants of the old detector (each character removed, the threshold at 1 or 3, repeats counted); the new cases against the new detector | red, 38 of 39 (the decomposed case); the old cases let 14 mutants pass, the new cases fail every one; 39 of 39                                                 |
| `a8eadbb` | the gate owned by `core`, so `/init` could not drop it for a project that picks another artifact language (plan decision 48)                                                                 | `verify:manifest`; `verify:manifest:coverage`; `verify:manifest:test`; `verify:specs`                                                                                                                               | 11 capabilities and 3 presets well formed; 923 files owned once; 24 of 24; green                                                                               |
| `5208df0` | `docs/code-standards.md` § 20 said "No allowlist files" and § 21 marked § 15 "warn only"; `docs/harness.md` named only Spanish as a reason for an entry                                      | `verify:english`; `verify:maps`                                                                                                                                                                                     | green; OK                                                                                                                                                      |

The capability move also rewrote the manifest bullet of `proposal.md`, which named `core`.

## False positives

Measured on 2026-11-13 over the 913 tracked text files at `5208df0`: no line is flagged, so the
allowlist ships empty. Before the word list was fixed, a scratch scan of single
words found `todo` in two TODO comments, `del` in one line of vendored archify code, `con` in one
line of audit data and `solo` in one English sentence; those words are left out of the list.
Single Spanish-looking words inside base64 runs of `pnpm-lock.yaml` are discarded by the word
shape: a run that mixes case or holds digits is not a word. The Chinese strings of the vendored
archify viewer pass.

The rule cannot tell Spanish from another language that writes the same letters or words.
Probes against the detector at `5208df0`:

- a line with a loanword or a name that keeps an e with an acute accent fails on U+00E9;
- a line naming Los Angeles alone passes;
- a line naming Las Vegas alone passes too;
- a line naming both cities fails: it holds two distinct listed words.

Such a line takes an allowlist entry with its reason (`docs/harness.md`, code-standards § 20).

A scan looser than the gate (any Latin-1 accented letter, any single listed word or common
Spanish word) over the tracked files outside the catalogs, the vendored archify skill and
`pnpm-lock.yaml` finds no accented letter. Its single-word hits are English: `todo` in two TODO
comments and a status legend, `solo` in a preset name, and two words cut short at the end of
truncated audit text. The other hits are the gate's word list, one word per line.

## Gate

- `ATL_TEMPLATE_SELF=1 pnpm validate`: exit 0, 2026-11-13, at `d4c3179` (turbo 21 of 21 tasks).
- `ATL_TEMPLATE_SELF=1 pnpm validate` at `5208df0`: the first run exited 1 on `@app/web#build`, where Turbopack could not fetch a Google font; the web build alone then passed, and a second full run exited 0 (turbo 21 of 21 tasks).

## Not verified

- Files not encoded in UTF-8: the gate reads every file as UTF-8, so an accented letter written in
  Latin-1 becomes U+FFFD and passes (probed).
- Short Spanish with no accent and fewer than two listed words, such as a two-word label: the rule
  passes it by design. The looser scan above finds none in the tree today.
- Languages other than Spanish, untracked files, and whether an allowlist reason is a good one,
  which only the pull request review judges.
