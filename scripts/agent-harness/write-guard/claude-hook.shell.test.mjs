#!/usr/bin/env node
// ---------------------------------------------------------------------------
// claude-hook, Bash and PowerShell — end to end: the real hook as Claude
// Code runs it on a shell tool, with the committed policy and agent context
// of this checkout. The donor's two end-to-end cases are here too, and
// the independent verifier's probes of slice 2, each red at 37d54bf.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/claude-hook.shell.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { shellPayload, spawnHook } from './claude-hook.fixtures.mjs'

test('END TO END: Bash writing AGENTS.md asks the main session and refuses the validator', () => {
  const main = spawnHook({
    input: shellPayload({ command: 'echo x > AGENTS.md' })
  })
  assert.equal(main?.permissionDecision, 'ask')
  assert.match(main.permissionDecisionReason, /^Bash `> AGENTS.md`/)
  assert.equal(
    spawnHook({
      input: shellPayload({
        agent: 'validator',
        command: 'echo x > AGENTS.md'
      })
    })?.permissionDecision,
    'deny'
  )
})

test('END TO END: Bash writing a file no rule names prints nothing for the main session', () => {
  assert.equal(
    spawnHook({
      input: shellPayload({ command: 'echo x > docs/notes.md' })
    }),
    null
  )
})

// The donor's two end-to-end cases.
test('END TO END: a validator git write is denied', () => {
  assert.equal(
    spawnHook({
      input: shellPayload({
        agent: 'validator',
        command: 'git commit -m x'
      })
    })?.permissionDecision,
    'deny'
  )
})

test('END TO END: a validator Bash write under the OS temp dir passes', () => {
  const target = join(tmpdir(), 'agent-writes-probe.log')
  assert.equal(
    spawnHook({
      input: shellPayload({
        agent: 'validator',
        command: `echo x > "${target}"`
      })
    }),
    null
  )
})

test('END TO END: PowerShell asks the main session before a write cmdlet that names a rule file, and refuses the validator', () => {
  const command = 'Set-Content -Path AGENTS.md -Value x'
  assert.equal(
    spawnHook({ input: shellPayload({ command, tool: 'PowerShell' }) })
      ?.permissionDecision,
    'ask'
  )
  assert.equal(
    spawnHook({
      input: shellPayload({
        agent: 'validator',
        command,
        tool: 'PowerShell'
      })
    })?.permissionDecision,
    'deny'
  )
})

// -- the verifier's probes of slice 2 ------------------------------------------
const decisionOf = ({ agent, command, tool = 'Bash' }) =>
  spawnHook({ input: shellPayload({ agent, command, tool }) })
    ?.permissionDecision ?? '—'

const MAIN_ASKS = [
  // A glob Bash expands to a rule file.
  ["sed -i 's/a/b/' *.md", 'Bash'],
  ["sed -i 's/a/b/' scripts/*.mjs", 'Bash'],
  ['Set-Content -Path AGENTS.* -Value x', 'PowerShell'],
  // Brace expansion.
  ['mv AGENTS.md{,.bak}', 'Bash'],
  ['cp AGENTS.md{.bak,}', 'Bash'],
  // wget's combined short flags.
  ['wget -qO .claude/settings.json http://example.invalid', 'Bash'],
  // Writers the guard does not know.
  ['dos2unix AGENTS.md', 'Bash'],
  ["awk -i inplace '{print}' AGENTS.md", 'Bash'],
  [`perl -e 'open(F,">AGENTS.md")'`, 'Bash'],
  ['time -p bash -c "echo x > AGENTS.md"', 'Bash'],
  // A root-level rule file written through the root folder.
  ['find . -name AGENTS.md -delete', 'Bash'],
  ['cp /tmp/AGENTS.md .', 'Bash'],
  // A tree-changing git subcommand that names a rule path (harness.md 3f).
  ['git stash push -- AGENTS.md', 'Bash'],
  ['git checkout-index -f -- AGENTS.md', 'Bash']
]
for (const [command, tool] of MAIN_ASKS) {
  test(`Given ${tool} \`${command}\`, when the main session runs it, then the guard asks`, () => {
    assert.equal(decisionOf({ command, tool }), 'ask')
  })
}

const VALIDATOR_DENIES = [
  'cp AGENTS.md{.bak,}',
  'dos2unix AGENTS.md',
  "awk -i inplace '{print}' AGENTS.md",
  "vim -c 'wq' AGENTS.md",
  `perl -e 'open(F,">AGENTS.md")'`,
  'iconv -f utf8 -t utf8 -o AGENTS.md README.md',
  'jq . /tmp/x.json | sponge .claude/settings.json',
  'time -p bash -c "echo x > AGENTS.md"',
  'busybox sh -c "echo x > AGENTS.md"'
]
for (const command of VALIDATOR_DENIES) {
  test(`Given Bash \`${command}\`, when the read-only validator runs it, then the guard refuses`, () => {
    assert.equal(decisionOf({ agent: 'validator', command }), 'deny')
  })
}
