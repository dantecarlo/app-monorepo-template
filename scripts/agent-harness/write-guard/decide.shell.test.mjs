#!/usr/bin/env node
// ---------------------------------------------------------------------------
// decide, Bash and PowerShell — the rows of the decision table in
// docs/harness.md § 3f the donor never had: the ask before a rule file, for
// the main session, a writer and an unlisted agent as much as a surface
// agent; the command the guard cannot read, which asks only when it names a
// rule path; the PowerShell write cmdlets; and the main session, which is
// never refused. The host and the agents are decide.shell.fixtures.mjs's.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/decide.shell.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  decisionOf,
  MAIN,
  SCRATCH,
  shell
} from './decide.shell.fixtures.mjs'

// -- the table, cell by cell -----------------------------------------------------
const COMMANDS = {
  otherRepository: 'echo x > src/a.ts',
  outside: 'echo x > C:/Users/me/notes.txt',
  ruleFile: 'echo x > AGENTS.md',
  scratch: `echo x > "${SCRATCH}\\probe\\a.log"`,
  sink: 'echo x > /dev/null',
  surface: 'echo x > docs/qa/a.md',
  unreadableNamingARule: 'echo "x > AGENTS.md',
  unreadableNamingNone: 'echo "x > src/a.ts'
}

const TABLE = [
  {
    actor: 'a read-only agent',
    agent: 'validator',
    row: {
      otherRepository: 'deny',
      outside: 'deny',
      ruleFile: 'deny',
      scratch: '—',
      sink: '—',
      unreadableNamingARule: 'deny',
      unreadableNamingNone: 'deny'
    }
  },
  {
    actor: 'a surface agent',
    agent: 'e2e-author',
    row: {
      otherRepository: 'deny',
      outside: 'deny',
      ruleFile: 'ask',
      scratch: '—',
      sink: '—',
      surface: '—',
      unreadableNamingARule: 'deny',
      unreadableNamingNone: 'deny'
    }
  },
  ...[
    ['a writer', 'skill-author'],
    ['the main session', MAIN],
    ['an unlisted agent', 'general-purpose']
  ].map(([actor, agent]) => ({
    actor,
    agent,
    row: {
      otherRepository: '—',
      outside: '—',
      ruleFile: 'ask',
      scratch: '—',
      sink: '—',
      surface: '—',
      unreadableNamingARule: 'ask',
      unreadableNamingNone: '—'
    }
  }))
]

for (const { actor, agent, row } of TABLE) {
  for (const [column, expected] of Object.entries(row)) {
    test(`Bash by ${actor} to ${column}: ${expected}`, () => {
      assert.equal(
        decisionOf({ agent, command: COMMANDS[column] }),
        expected
      )
    })
  }
}

// -- every write shape of a rule file asks the main session --------------------
for (const command of [
  'echo x >> AGENTS.md',
  'rg foo src | tee AGENTS.md',
  'cp /tmp/a AGENTS.md',
  'mv AGENTS.md docs/a.md',
  "sed -i 's/a/b/' AGENTS.md",
  'rm .claude/skills/sdd/SKILL.md',
  'touch scripts/verify-x.mjs',
  'curl -o template.manifest.json https://example.test/a',
  'git checkout -- AGENTS.md',
  'git restore --source=HEAD .agents/contracts/write-guard.json',
  'git rm AGENTS.md',
  `node -e "require('fs').writeFileSync('AGENTS.md', '1')"`,
  "python3 -c \"open('AGENTS.md', 'w').write('1')\"",
  'cd .claude && echo x > settings.json',
  'for f in AGENTS.md README.md; do echo x > $f; done',
  'echo x > $(echo AGENTS.md)',
  'S=.claude/skills; echo x > $S/new/SKILL.md',
  // An inner shell's text is judged as Bash.
  "bash -c 'echo x > AGENTS.md'",
  'eval "echo x > .claude/skills/a/SKILL.md"',
  // A function body and a coprocess are commands like any other.
  'function f { rm .claude/skills/sdd/SKILL.md; }',
  'function f() { touch AGENTS.md; }',
  'coproc rm AGENTS.md'
]) {
  test(`the main session is asked before a rule file: ${command}`, () => {
    assert.equal(decisionOf({ agent: MAIN, command }), 'ask')
  })
}

// -- a folder that holds rule files ------------------------------------------------
for (const command of [
  'rm -rf .claude',
  'rm -rf scripts',
  'mv .agents /tmp/agents',
  'git checkout -- .claude'
]) {
  test(`a write to a folder that holds rule files asks the main session: ${command}`, () => {
    const verdict = shell({ agent: MAIN, command })
    assert.equal(verdict?.decision, 'ask')
    assert.match(verdict.reason, /holds rule files/)
  })
}

for (const command of [
  'rm -rf dist',
  'rm -rf apps/web/.next',
  'unzip bundle.zip',
  'curl -sSLO https://example.test/a',
  'git format-patch -1'
]) {
  test(`a folder that holds no rule file, the root included, asks nothing: ${command}`, () => {
    assert.equal(decisionOf({ agent: MAIN, command }), '—')
  })
}

// -- what is not a write of a rule file ------------------------------------------
for (const command of [
  'cat AGENTS.md',
  'rg -n LAW AGENTS.md',
  'git add AGENTS.md',
  'git commit -m "docs: AGENTS.md"',
  'git diff -- AGENTS.md > /tmp/a.diff',
  'echo x > docs/notes.md',
  'pnpm install',
  "bash -c 'ls src'",
  'echo x > $OUT',
  'pnpm exec prettier --check AGENTS.md'
]) {
  test(`a command that writes no rule file asks nothing of the main session: ${command}`, () => {
    assert.equal(decisionOf({ agent: MAIN, command }), '—')
  })
}

// -- what the guard cannot read asks when it names a rule path ------------------
for (const command of [
  'cp AGENTS.md $BACKUP',
  '$EDITOR AGENTS.md',
  'pnpm exec prettier --write AGENTS.md',
  'echo x > $(cat name) && cat template.manifest.json',
  `node -e "require('fs').writeFileSync(process.argv[1], '1')" AGENTS.md`,
  'echo "x > AGENTS.md',
  'echo $(cat <<EOF\nAGENTS.md'
]) {
  test(`a command the guard cannot read asks when it names a rule path: ${JSON.stringify(command)}`, () => {
    const verdict = shell({ agent: MAIN, command })
    assert.equal(verdict?.decision, 'ask')
    assert.match(verdict.reason, /names `[^`]+`, a rule file/)
  })
}

test('a command too long to check for rule paths asks', () => {
  const words = Array.from({ length: 300 }, (_, n) => `w${n}`).join(' ')
  const verdict = shell({ agent: MAIN, command: `bash -c '${words}'` })
  assert.equal(verdict?.decision, 'ask')
  assert.match(verdict.reason, /too long/)
})

// -- the paths go through the same reading as the file tools -------------------
for (const command of [
  'echo x > C:\\\\work\\\\repo\\\\AGENTS.md',
  'echo x > /c/work/repo/AGENTS.md',
  'echo x > c:/WORK/Repo/agents.md',
  'echo x > "AGENTS.md."',
  'echo x > docs/../AGENTS.md',
  'echo x > ~/.claude/settings.json',
  'echo x > $HOME/.claude/settings.json'
]) {
  test(`a Bash target is read as Windows reads it: ${command}`, () => {
    assert.equal(decisionOf({ agent: MAIN, command }), 'ask')
    assert.equal(decisionOf({ agent: 'validator', command }), 'deny')
  })
}

test('a Bash target the guard cannot read asks the main session and refuses a read-only agent', () => {
  const command = "echo x > 'AGENTS.md::$DATA'"
  assert.equal(decisionOf({ agent: MAIN, command }), 'ask')
  assert.match(shell({ agent: MAIN, command }).reason, /stream/)
  assert.equal(decisionOf({ agent: 'validator', command }), 'deny')
})

// -- the reasons -------------------------------------------------------------------
test('a Bash ask names the shape, the rule, the LAW and how to proceed', () => {
  const { reason } = shell({ agent: MAIN, command: 'echo x > AGENTS.md' })
  assert.match(reason, /^Bash `> AGENTS\.md`/)
  assert.match(reason, /`AGENTS\.md` \(the LAWs and the router\)/)
  assert.match(reason, /"A rule is not edited to fit the work"/)
  assert.match(reason, /Approve only if the owner asked/)
})

test('a Bash ask by a subagent names it', () => {
  assert.match(
    shell({ agent: 'skill-author', command: 'echo x > AGENTS.md' }).reason,
    /by skill-author/
  )
})

test('a read-only deny of a rule file through Bash cites the LAW', () => {
  const { reason } = shell({ command: 'echo x > AGENTS.md' })
  assert.match(reason, /validator is read-only/)
  assert.match(reason, /"A rule is not edited to fit the work"/)
})

// -- the main session is never refused -----------------------------------------
const EVERY_KIND = [
  'echo x > AGENTS.md',
  'echo x > src/a.ts',
  'git push --force',
  'pnpm install',
  "bash -c 'rm -rf AGENTS.md'",
  'echo "unterminated AGENTS.md',
  `echo ${'$('.repeat(3000)}x${')'.repeat(3000)}`,
  'echo $(\\\n(1 + 2)) > AGENTS.md',
  '$X AGENTS.md',
  `node -e "require('child_process').execSync(x)" AGENTS.md`,
  "echo x > 'AGENTS.md::$DATA'"
]

test('the main session is never refused, whatever the command', () => {
  for (const command of EVERY_KIND) {
    for (const tool of ['Bash', 'PowerShell']) {
      assert.ok(
        ['ask', '—'].includes(decisionOf({ agent: MAIN, command, tool })),
        `${tool}: ${command}`
      )
    }
  }
})

test('no shell verdict ever allows', () => {
  for (const agent of [MAIN, 'validator', 'e2e-author', 'skill-author']) {
    for (const command of EVERY_KIND) {
      assert.ok(
        ['ask', 'deny', '—'].includes(decisionOf({ agent, command }))
      )
    }
  }
})

const NO_COMMAS = Array.from({ length: 30 }, (_, n) => `'item${n}'`).join(
  '    '
)

test('a pathological list the main session cannot read decides in well under a second', () => {
  const start = performance.now()
  shell({
    agent: MAIN,
    command: `python3 -c "import subprocess; subprocess.run([${NO_COMMAS} x])"`
  })
  assert.ok(performance.now() - start < 500)
})

// -- PowerShell -------------------------------------------------------------------
for (const command of [
  'Set-Content AGENTS.md x',
  'Set-Content -Path .\\AGENTS.md -Value x',
  'Add-Content AGENTS.md x',
  'Clear-Content AGENTS.md',
  "'x' | Out-File -FilePath C:\\work\\repo\\AGENTS.md",
  'New-Item .claude\\skills\\a\\SKILL.md',
  'Copy-Item C:\\tmp\\a AGENTS.md',
  'Move-Item AGENTS.md docs\\a.md',
  'Remove-Item -Recurse .claude',
  'Rename-Item AGENTS.md x.md',
  "'x' | Tee-Object AGENTS.md",
  "'x' > AGENTS.md",
  "'x' >> .\\AGENTS.md",
  'sc AGENTS.md x',
  'ac AGENTS.md x',
  'clc AGENTS.md',
  'ni AGENTS.md',
  'cp x AGENTS.md',
  'copy x AGENTS.md',
  'cpi x AGENTS.md',
  'mv AGENTS.md x',
  'move AGENTS.md x',
  'mi AGENTS.md x',
  'rm AGENTS.md',
  'del AGENTS.md',
  'erase AGENTS.md',
  'ri AGENTS.md',
  'rd .claude',
  'rmdir .claude',
  'ren AGENTS.md x',
  'rni AGENTS.md x',
  'md .claude\\skills\\new',
  'mkdir .claude\\skills\\new',
  'Set-Content $HOME\\.claude\\settings.json x',
  'Set-Content $env:USERPROFILE\\.claude\\settings.json x',
  'Set-Content ~\\.claude\\settings.json x'
]) {
  test(`PowerShell asks the main session before a write cmdlet that names a rule path: ${command}`, () => {
    const verdict = shell({ agent: MAIN, command, tool: 'PowerShell' })
    assert.equal(verdict?.decision, 'ask')
    assert.match(verdict.reason, /^PowerShell `/)
    assert.match(verdict.reason, /"A rule is not edited to fit the work"/)
  })
}

for (const command of [
  'Get-Content AGENTS.md',
  'Select-String LAW AGENTS.md',
  'Set-Content docs\\notes.md x',
  "'x' > docs\\notes.md",
  'Get-ChildItem 2>&1 | Out-Null',
  'if (1 -gt 0) { Get-Content AGENTS.md }',
  'Write-Output "a > b" AGENTS.md',
  'Get-ChildItem .claude'
]) {
  test(`PowerShell asks nothing without both a write and a rule path: ${command}`, () => {
    assert.equal(
      decisionOf({ agent: MAIN, command, tool: 'PowerShell' }),
      '—'
    )
  })
}

for (const agent of ['skill-author', 'general-purpose']) {
  test(`PowerShell asks ${agent} as it asks the main session`, () => {
    assert.equal(
      decisionOf({
        agent,
        command: 'Set-Content AGENTS.md x',
        tool: 'PowerShell'
      }),
      'ask'
    )
    assert.equal(
      decisionOf({ agent, command: 'Get-ChildItem', tool: 'PowerShell' }),
      '—'
    )
  })
}

test('a shell call that names no command is an error: asked of the main session, refused to a policed agent', () => {
  for (const tool of ['Bash', 'PowerShell']) {
    assert.equal(decisionOf({ agent: MAIN, command: 5, tool }), 'ask')
    assert.equal(
      decisionOf({ agent: 'validator', command: 5, tool }),
      'deny'
    )
  }
})
