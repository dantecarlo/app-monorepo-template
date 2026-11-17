# <id> — <title>

> **Type:** feature | fix | tech | chore · **Area:** <App | Web | Backend | …>

The body of a ticket of the ticket flow (`.claude/skills/ticket-flow/SKILL.md`). The PO writes the
requirement and the acceptance criteria (`po-ticket`); the architect, the dev and the QA session
fill their sections as the ticket moves. Every question and answer is a comment on the ticket,
never an edit of this body, and no credential ever goes in it.

## Requirement

The client's words, verbatim and dated; a request written in another language is translated
faithfully and marked with the language it came from:

- <YYYY-MM-DD> (translated from <language>): "<the client's words>"

## Acceptance criteria

- [ ] <one observable outcome per line>

## Target version

- **Version:** <V>, proposed by the PO and confirmed by the architect; it moves only through the
  PO (`ticket-flow` § Target version)

## Spec

<the link to its spec, such as the SDD change folder or the living spec it changes; never a copy>

## Areas and subtasks

| Area | Subtask | Reserves | Depends on |
| --- | --- | --- | --- |
| <Web> | <what is built> | <path>, <path> | <id>, or none |

## Test plan

- **Unit:** <the units and the tests that prove them>
- **End to end:** <the flows, by id>

## Branch and pull request

- **Branch:** `<type>/<id>-<slug>`, or the shape the project layer's ticket identity sets
- **Pull request:** <url>, its body naming the id

## QA evidence

- <area>: <the link to the pull request comment that holds the evidence>

## Risk

Risk: <item N (reason) | none>
