# Proposal: An approval the architect relays word for word counts

> **Status:** archived — 2026-11-26

## Why

The ticket flow lets an approval count only in the session that asked for it (`ticket-flow` rule 6),
so an owner who has already said yes in the architect's session must repeat it in the CI/CD
session, even for a release the architect has all the evidence for. The owner asked to route it
through the architect instead, and approved porting that rule to the template.

The owner's words, verbatim:

- 2026-11-25 13:40 (translated from Spanish), in the downstream project's ticket flow: "I already
  told him everything is approved, but don't go through me; you're passing my authorization
  through you, so I only manage everything through you"
- 2026-11-25 (translated from Spanish), approving the port to the template: "Yes, port it"
- 2026-11-26, approving this proposal and answering Q1: replace the `refine-ticket` § Merge queue
  step 3 sentence "a relay from another session does not count" with "a relay from any other
  session does not count", the same wording as rule 6.

The skills name no product; the downstream quote and its incident stay in the downstream
project's own docs.

## What changes

- `ticket-flow` rule 6 becomes "Approval, in place or relayed by the architect": an approval the
  owner gives in the architect's session counts in another session when the architect relays it
  word for word, with its time and the question it answered. A relay never widens it, covers only
  what that question named, and every irreversible production step still gets its own yes. A
  relay from any other session does not count. The spec gains TICKET-36 for it.
- `release-ticket` Step 2 waits for "the owner's word here, or for the architect's relay of it
  (`ticket-flow` rule 6), which covers this one release". TICKET-16 is modified.
- `refine-ticket` § Merge queue step 3 says "a relay from any other session does not count", the
  wording of rule 6 (the owner's answer to Q1). TICKET-25 is modified.
- `scripts/verify-skills.mjs` holds the three texts, so a later edit cannot drop the relay clause
  (task T3 and T5; the three tests it names are new).
- `.claude/skills/process-intake/ticket-flow.template.md` needs no change, confirmed: its
  Approvals section says the owner approves each merge "in the architect's session" and names
  no relay rule, and its Merge policy section covers the merge policy only.
- Citation audit of `openspec/specs/harness/ticket-flow/spec.md` (task T4). Corrected in this
  change's delta: TICKET-16, which it modifies. Wrong in the living spec and corrected by T4, each
  `path:line` pointing at a blank or punctuation-only line, or at a line that no longer holds
  what the requirement cites:
  - TICKET-01: `.claude/skills/ticket-flow/SKILL.md:369`, `scripts/verify-skills.mjs:332`
  - TICKET-03: `scripts/verify-skills.mjs:841`
  - TICKET-04: `scripts/verify-skills.mjs:332`
  - TICKET-09: `package.json:47` is `test:e2e` and `package.json:79` is `verify:specs`; the
    lines that hold the claim are `package.json:55` (`validate`), `package.json:87`
    (`verify:ticket-branch:test`), `.agents/contracts/gates.json:479` and
    `.agents/contracts/gates.json:526`; `.agents/contracts/gates.json:400` is the
    `verify:structure` step
  - TICKET-11: `scripts/verify-skills.mjs:219`
  - TICKET-15: `.claude/skills/ticket-flow/SKILL.md:377`
  - TICKET-18: `.claude/skills/ticket-flow/SKILL.md:294`
  - TICKET-23: `scripts/verify-skills.mjs:213`
  - TICKET-24: `.claude/skills/refine-ticket/SKILL.md:295`, `scripts/verify-skills.mjs:225`
  - TICKET-26: `.claude/skills/ticket-flow/SKILL.md:294`, `.claude/skills/ticket-flow/SKILL.md:296`,
    `.claude/skills/ticket-flow/SKILL.md:298`, `scripts/verify-skills.mjs:297`
  - TICKET-28: `scripts/verify-skills.mjs:235`
  - TICKET-29: `.claude/skills/refine-ticket/SKILL.md:270`, `.claude/skills/refine-ticket/SKILL.md:274`,
    `.claude/skills/refine-ticket/SKILL.md:278`, `.claude/skills/refine-ticket/SKILL.md:281`,
    `scripts/verify-skills.mjs:243`
  - TICKET-32: `scripts/verify-skills.mjs:438`
  - TICKET-33: `.claude/skills/refine-ticket/SKILL.md:225`, `.claude/skills/refine-ticket/SKILL.md:233`

  The audit checked every cited line of TICKET-01 to TICKET-35 against its file (none is past the
  end of its file) and judged by content only the lines above, which are blank or hold a bare
  bracket, plus TICKET-09, whose cited lines hold other scripts. A citation that points at a
  heading or a nearby line of the right section is loose and not listed. T4 re-reads each
  requirement and cites the line that holds its claim.

## Out of scope

- The edit the owner worded for `qa-ticket` step 6 is dropped: it does not apply. `qa-ticket`
  step 6 holds no ask and no "a relay from another session does not count" sentence: it says
  "QA stops at Ready to merge: it asks the owner nothing and merges nothing"
  (`.claude/skills/qa-ticket/SKILL.md:91`), and TICKET-11 requires that. The sentence the edit
  meant sits in `refine-ticket` § Merge queue step 3, which Q1 below settles.
- A relay for the merge ask: the architect asks the owner for each merge in its own session
  (TICKET-25), the session where the approval is given, so nothing needs relaying.
- Any other step's approval: each irreversible production step still gets its own yes (TICKET-16).
- The downstream project's own docs and incident record.

### Q1 (answered 2026-11-26)

Where does the relay clause for the merge ask belong? The owner chose to replace the sentence at
`.claude/skills/refine-ticket/SKILL.md:202` with "a relay from any other session does not count",
the wording rule 6 has. Task T5.

## Affected specs

- `openspec/specs/harness/ticket-flow/spec.md`: adds TICKET-36; modifies TICKET-16 and TICKET-25; T4 corrects
  citations of TICKET-01, 03, 04, 09, 11, 15, 18, 23, 24, 26, 28, 29, 32 and 33 without changing
  what they state.
