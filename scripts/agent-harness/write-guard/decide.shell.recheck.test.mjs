#!/usr/bin/env node
// ---------------------------------------------------------------------------
// decide, Bash and PowerShell, the recheck of slice 2 — the forms of
// blockers 2, 3 and 6 the first correction missed, and the three
// regressions it caused, each run as the independent recheck gave it: the
// main session is asked and the read-only validator refused. The host is
// decide.shell.fixtures.mjs's synthetic disk (ON_DISK).
//
// Usage:
//   node --test scripts/agent-harness/write-guard/decide.shell.recheck.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { decisionOf, MAIN, ON_DISK } from './decide.shell.fixtures.mjs'

const RECHECK = {
  'B2, an empty brace alternative': [
    'cp x {AGENTS.md,}',
    'ln -sf x {AGENTS.md,}',
    'install x {AGENTS.md,}',
    'cp x {.agents/contracts/gates.json,}'
  ],
  'B3, openssl spellings': [
    'openssl rand --out AGENTS.md 4',
    'openssl rand -out=AGENTS.md 4',
    'openssl rand --out=AGENTS.md 4'
  ],
  'B3, perl that copies, moves, renames or edits in place': [
    `perl -MFile::Copy -e 'copy("x","AGENTS.md")'`,
    `perl -e 'use File::Copy; copy("x","AGENTS.md")'`,
    `perl -MFile::Copy -e 'move("x","AGENTS.md")'`,
    `perl -e 'use File::Copy; move("x","AGENTS.md")'`,
    `perl -MFile::Copy -e 'rename("x","AGENTS.md")'`,
    `perl -e 'use File::Copy; rename("x","AGENTS.md")'`,
    `perl -e '$^I=""; @ARGV=("AGENTS.md"); while(<>){print}'`
  ],
  'B3, git subcommands that write --output': [
    'git log --output=AGENTS.md',
    'git show --output=AGENTS.md',
    'git whatchanged --output=AGENTS.md',
    'git range-diff --output=AGENTS.md a b',
    'git format-patch --output=AGENTS.md -1',
    'git diff --output=AGENTS.md',
    'git log --output AGENTS.md'
  ],
  'B3, an unknown program with an attached value': [
    'someunknowntool -oAGENTS.md'
  ],
  'B3, ln clustered options': [
    'ln -sft .agents/contracts /tmp/x',
    'ln -st .agents/contracts /tmp/x',
    'ln -sft . /tmp/AGENTS.md'
  ],
  'B6a, a glob source copied into a folder': [
    'cp .vscode/sett* .claude/',
    'cp .vscode/*.json .claude/',
    'mv .vscode/s* .claude/',
    'cp /tmp/src/* .claude/'
  ],
  'B6b, no target directory': [
    'cp -rT /tmp/dir .claude',
    'cp -r --no-target-directory /tmp/dir .claude',
    'mv -T /tmp/dir .claude'
  ],
  'B6c, a source that ends in ..': ['cp -r /tmp/dir/.. .claude/'],
  'B6d, into the root by the source name': [
    'ln -sf /tmp/AGENTS.md .',
    'rsync /tmp/AGENTS.md .',
    'scp host:/tmp/AGENTS.md .'
  ],
  'B6, git writes the guard missed': [
    'git merge-file AGENTS.md a b',
    'git config --file AGENTS.md a.b c',
    'git clone https://e.test/r.git .claude/skills/x',
    'git init .claude/skills/x',
    'git worktree add .claude/skills/x'
  ]
}

for (const [blocker, commands] of Object.entries(RECHECK)) {
  for (const command of commands) {
    test(`${blocker}: ${command} asks the main session and refuses the validator`, () => {
      assert.equal(
        decisionOf({ agent: MAIN, command, host: ON_DISK }),
        'ask'
      )
      assert.equal(
        decisionOf({ agent: 'validator', command, host: ON_DISK }),
        'deny'
      )
    })
  }
}

// The fail-open cases the native review found: an unknown program hid a
// later opaque writer, and PowerShell bound a parameter the guard did not.
const REVIEW = {
  Bash: [
    'someunknowntool docs/x.md; pnpm exec prettier --write AGENTS.md',
    'someunknowntool docs/x.md && npx prettier --write AGENTS.md'
  ],
  PowerShell: [
    'Copy-Item -Dest AGENTS.md docs\\x.md',
    'Copy-Item -De AGENTS.md docs\\x.md',
    'Copy-Item -Destination:AGENTS.md -Path docs\\x.md',
    'Copy-Item -Path:docs\\x.md AGENTS.md',
    'Copy-Item -LiteralPath:docs\\x.md AGENTS.md',
    'Move-Item -Path:docs\\x.md AGENTS.md',
    'Move-Item -Dest AGENTS.md docs\\x.md'
  ]
}

for (const [tool, commands] of Object.entries(REVIEW)) {
  for (const command of commands) {
    test(`native review, ${tool}: ${command} asks the main session and refuses the validator`, () => {
      assert.equal(
        decisionOf({ agent: MAIN, command, host: ON_DISK, tool }),
        'ask'
      )
      assert.equal(
        decisionOf({ agent: 'validator', command, host: ON_DISK, tool }),
        'deny'
      )
    })
  }
}

test('B6d, PowerShell: a copy into the root asks by the source name, and refuses the validator', () => {
  const command = 'Copy-Item /tmp/AGENTS.md .'
  const tool = 'PowerShell'
  assert.equal(
    decisionOf({ agent: MAIN, command, host: ON_DISK, tool }),
    'ask'
  )
  assert.equal(
    decisionOf({ agent: 'validator', command, host: ON_DISK, tool }),
    'deny'
  )
})

// The neighbours that must keep asking nothing.
for (const [command, tool = 'Bash'] of [
  ['cp x {docs/a.md,}'],
  ['openssl rand -out /tmp/x 4'],
  [`perl -e 'print 1' docs/a.md`],
  ['git log --oneline -5'],
  ['git config --file /tmp/x a.b c'],
  ['someunknowntool -Wall docs/a.md'],
  ['ln -sf /tmp/a.md .'],
  ['cp -rT /tmp/dir docs/x'],
  ['cp -r /tmp/dir/.. docs/'],
  ['rsync -a src/ /tmp/b'],
  ['git init /tmp/x'],
  ['Copy-Item /tmp/a.md .', 'PowerShell'],
  ['someunknowntool docs/x.md; pnpm exec prettier --write docs/y.md'],
  ['someunknowntool docs/x.md; cat AGENTS.md'],
  ['Copy-Item -Dest docs\\y.md AGENTS.md', 'PowerShell'],
  ['Copy-Item -Path:AGENTS.md docs\\x.md', 'PowerShell'],
  ['Copy-Item -Recurse:$true -Path:AGENTS.md docs\\x.md', 'PowerShell']
]) {
  test(`a neighbour asks the main session nothing: ${command}`, () => {
    assert.equal(
      decisionOf({ agent: MAIN, command, host: ON_DISK, tool }),
      '—'
    )
  })
}
