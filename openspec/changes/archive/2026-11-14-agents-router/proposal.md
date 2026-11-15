# Proposal: make `AGENTS.md` the router, with the LAWs, the Codex budget and `verify:instruction-entry`

> **Status:** archived — 2026-11-14

## Why

`AGENTS.md` is the single instruction file every runtime reads (`docs/INIT_AND_HARNESS_PLAN.md`,
decision 12), yet at `53bcd3c` it routes a task to a skill through an "Agent skills" table that
names a few of the skills `.claude/skills/` ships, and it carries none of the LAWs Certifipago
moved into its own AGENTS.md (its #756) so that Codex and OpenCode receive them too. Three
failures nothing reports today:

- A CLAUDE.md, .claude/CLAUDE.md or CLAUDE.local.md makes Claude Code read that file instead of
  `AGENTS.md` (the plan's "Verified platform facts"), and no gate fails when one appears.
  Certifipago refuses one inside its verify:doc-links (its #791).
- Codex loads at most `project_doc_max_bytes` of project `AGENTS.md` files, 32 KiB by default,
  and drops the rest silently (decision 39). This repository sets no budget, and nothing
  measures `AGENTS.md` against one.
- A skill with no router row is found only by an agent that already knows its name.

Roadmap step 3.1 of the plan schedules the fix: "`AGENTS.md` as the router: the LAWs, the Router
tables (knowledge rows included), the Codex project-doc budget and its test;
`verify:instruction-entry`, which also refuses a `CLAUDE.md` (Certifipago #791)". Done when:
"gates green; `AGENTS.md` under the Codex budget".

The owner's words:

- 2026-11-13 (translated from Spanish): "we are now at a maturity level where any project can
  start from here. So now you are the reference, and what we bring from other projects will be
  adapted to you, and you will ask the others to adapt to the new standards"
- 2026-11-14 (translated from Spanish): "yes, merge the three in that order when they are green,
  and continue"

## What changes

- **`verify:instruction-entry`**, a new gate inside `validate`, in `scripts/verify-instruction-entry.mjs`.
  It fails when `AGENTS.md` or `README.md` is missing, and when any path git lists for the
  repository (tracked, or not added yet and not ignored, from
  `git ls-files --cached --others --exclude-standard -z`) is named CLAUDE.md or CLAUDE.local.md,
  in any case and in any folder, .claude/CLAUDE.md included. A name that only contains it, such
  as CLAUDE.md.bak, stays silent. It is built on `scripts/gate/gate.mjs` and
  `scripts/gate/cases.mjs`, runs git under `scripts/git-free-env.mjs` the way
  `scripts/verify-english.mjs` does, and takes `--root` to judge another checkout.
- **Its test**, `scripts/verify-instruction-entry.test.mjs` (`verify:instruction-entry:test`):
  every case of Certifipago's verify-doc-links test that applies to the refusal (a healthy tree;
  each root file missing; a CLAUDE.md at the root, one importing `AGENTS.md`, one in
  .claude/, one in a subfolder, a lower-case one, a CLAUDE.local.md, two at once; names that
  only contain it), the cases re-run against a blinded gate, real-git runs in a scratch
  repository in the OS temp directory (a CLAUDE.md not yet added is refused, a staged one is
  refused, an ignored CLAUDE.local.md is not seen), and the gate run as a process over a planted
  violation (exit 1, the path named) and over a healthy repository (exit 0). The scratch trees
  come from `scripts/gate/scratch.mjs`, the donor's `withScratchTree`.
- **The Codex budget.** `.codex/config.toml`, hand-written, sets `project_doc_max_bytes = 65536`
  (the donor's value) at the top level, with a header saying step 3.2's projector will generate
  the file. `scripts/codex-budget.test.mjs` (`codex-budget:test`, inside `validate`) fails when
  the key is missing or sits after a table header, and when `AGENTS.md`, counted with CRLF line
  endings, outgrows the budget.
- **The router.** `AGENTS.md` gains a Router: one table per phase of a change, in the donor's
  three columns (`If the task means… | Load skill | Validated by`), routing every skill
  `.claude/skills/` ships, `validate-all`, `new-skill`, `product-discovery`,
  `propagate-from-template` and `registry` included. It replaces the "Agent skills" table.
- **The LAWs.** `AGENTS.md` gains the donor's LAWs, de-branded (see Decisions).
- **The wiring**, as `docs/harness.md` ("How to add a gate") asks: the `package.json` scripts
  and `validate`; `docs/harness.md` § 3c; `docs/code-standards.md` § 21; `docs/maps/global-map.md`;
  the "Validation gate" prose of `AGENTS.md`; and `template.manifest.json`, where `core` owns
  every new file.

## Decisions

Made before this proposal, by the session that scheduled the step:

1. The Router lists only skills this template ships, each in the phase that fits, under the
   donor's table shape. It has no knowledge table: none of the donor's knowledge skills exists
   here, and a row that names a missing skill misleads. The knowledge rows arrive with step 5.1,
   which vendors their skills.
2. A "Validated by" cell names a gate that exists here (a `pnpm` script in `package.json`), or
   says `review`; never a gate that is not here yet.
3. The LAWs are ported de-branded: no Certifipago product names or examples, no counts or dated
   numbers in prose (decision 21), no link to a file this repository does not have, and every
   owner quote in English, marked "(translated from Spanish)". A LAW whose enforcing rule does
   not exist here says it is enforced by review until its rule lands (Stage 4), and no LAW
   contradicts `docs/code-standards.md`. The reply-shape LAW keeps its three sections with
   English labels, which follow the language of the reply.
4. The donor's lifecycle block is out of scope (below).
5. `.codex/config.toml` is hand-written with the donor's budget until step 3.2 generates it.
6. `verify:instruction-entry` is a gate of its own, as the plan names it, where Certifipago keeps
   its refusal inside verify:doc-links. It checks no `@`-import and no link.
7. Every new file is wired the way `docs/harness.md` asks, and owned in the manifest.

## Out of scope

- **The styling LAW** ("Styling lives in components/ui"). It says a block under an app's
  `components/ui/` (`apps/web/src/components/ui/`, `apps/mobile/src/components/ui/`) owns its
  look and every other file only positions. The template does not
  work that way: screen-local blocks keep their look in their own `*.style.ts`, such as
  `apps/web/src/screens/ItemsDashboard/components/ItemCard/ItemCard.style.ts` (colour, type and
  radius classes), and nothing like the donor's style-positions-only rule exists. An adapted
  "the look comes from the tokens" is not true either: arbitrary values and raw hex colours sit in
  `*.style.ts` files of both apps. Porting it would put a LAW in `AGENTS.md` that the code breaks
  on arrival; making it true is a refactor of the screens' styles and a lint rule, the owner's
  decision.
- **The donor's lifecycle block** (the phase-by-phase "lifecycle of a change" at the top of its
  AGENTS.md): it cites hooks and settings that arrive with step 3.3 and Stage 5. The Router names
  the phases in order without it.
- **The knowledge rows**: with step 5.1 (Decision 1).
- **The `@`-import and link checks** of the donor's verify:doc-links.
- **Generating** `.codex/config.toml` (step 3.2) and the router from flow specs (decision 27,
  Stage 5).
- **A gate that every shipped skill has a router row**: no such gate exists yet; review holds it.
- **A CLAUDE.md the repository does not list**: one in a parent folder or the home directory,
  and a CLAUDE.local.md a `.gitignore` ignores. Git lists neither, so the gate cannot see them;
  its `notCovered` says so.
- **Certifipago**: it already has the LAWs, the Router, the budget and the refusal.

## Affected specs

- None. No living spec governs `AGENTS.md`, `scripts/` or `.codex/`: the eight specs under
  `openspec/specs/` govern the packages and apps (`openspec/README.md` § 2.1), and the agent
  harness and the validation gates stay unspecified, as decided in `2026-11-11-adopt-sdd`
  (§ 2.1: "Not specified: the agent harness and the validation gates"). A gate is tooling, which
  § 1 sizes as needing no spec, so neither the gate nor the budget test gains a requirement; its
  proof is the tests and gates each task runs, recorded in the verify report.

<!--
Status is one of: open; archived — <date>; discarded — <date>, <reason>.
A discarded change moves to openspec/changes/archive/ with no delta merged.
A quote is in English. A request written in another language is translated faithfully and
completely, and the date is marked with the language it came from:
- 2026-01-01 (translated from Spanish): "<the whole request, in English>"
-->
