#!/usr/bin/env node
// ---------------------------------------------------------------------------
// decide, Bash and PowerShell, the verifier's gaps of slice 2 — globs Bash
// expands, brace expansion, writers the guard did not know and programs it
// does not know at all, combined short options, git subcommands that rewrite
// the tree, writes into a folder by the name of the file they write, the
// deadline, NUL bytes, ANSI-C quoting, patch, and the false asks. The host
// is decide.shell.fixtures.mjs's, with a synthetic disk (ON_DISK).
//
// Usage:
//   node --test scripts/agent-harness/write-guard/decide.shell.gaps.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  decisionOf,
  HOST,
  MAIN,
  ON_DISK,
  shell
} from './decide.shell.fixtures.mjs'

const onDisk = ({ agent = MAIN, command, tool = 'Bash' }) =>
  decisionOf({ agent, command, host: ON_DISK, tool })

const cases = ({ expected, list, name }) => {
  for (const [agent, command, tool = 'Bash'] of list) {
    test(`${name}: ${agent ?? 'main'} ${tool} ${JSON.stringify(command)} is ${expected}`, () => {
      assert.equal(onDisk({ agent, command, tool }), expected)
    })
  }
}

// -- 1. a glob Bash expands ------------------------------------------------------
cases({
  expected: 'ask',
  list: [
    [MAIN, "sed -i 's/a/b/' *.md"],
    [MAIN, "sed -i 's/a/b/' scripts/*.mjs"],
    [MAIN, 'rm *.json'],
    [MAIN, 'echo x > AGENT?.md'],
    [MAIN, 'Set-Content -Path AGENTS.* -Value x', 'PowerShell'],
    ['skill-author', 'rm *.json']
  ],
  name: 'a glob that matches a rule file asks'
})
cases({
  expected: '—',
  list: [
    [MAIN, "sed -i 's/a/b/' docs/*.md"],
    [MAIN, "sed -i 's/a/b/' '*.md'"],
    [MAIN, 'rm src/*.ts'],
    ['validator', 'rm /tmp/*.log']
  ],
  name: 'a glob that matches no rule file, or is quoted, asks nothing'
})
cases({
  expected: 'deny',
  list: [['validator', 'rm docs/*.md']],
  name: 'a glob that matches repository files refuses a read-only agent'
})

for (const [agent, command, expected] of [
  [MAIN, 'rm scripts/verify-*', 'ask'],
  [MAIN, 'rm .claude/skills/*/SKILL.md', 'ask'],
  [MAIN, 'rm docs/*.md', '—'],
  ['validator', 'rm docs/*.md', 'deny'],
  ['validator', 'rm /tmp/*.log', '—'],
  ['e2e-author', 'rm docs/qa/*.md', '—'],
  ['e2e-author', 'rm src/*.ts', 'deny']
]) {
  test(`a glob the guard cannot expand is judged as a pattern: ${agent ?? 'main'} ${command} is ${expected}`, () => {
    assert.equal(decisionOf({ agent, command, host: HOST }), expected)
  })
}

test('a glob with more matches than the guard expands is judged as a pattern', () => {
  const many = {
    ...ON_DISK,
    glob: () =>
      Array.from({ length: 500 }, (_, n) => `c:/work/repo/docs/f${n}.md`)
  }
  assert.equal(decisionOf({ agent: MAIN, command: 'rm docs/*', host: many }), '—')
  assert.equal(decisionOf({ agent: MAIN, command: 'rm *', host: many }), 'ask')
})

// -- 2. brace expansion ------------------------------------------------------------
cases({
  expected: 'ask',
  list: [
    [MAIN, 'mv AGENTS.md{,.bak}'],
    [MAIN, 'cp AGENTS.md{.bak,}'],
    [MAIN, 'touch {docs/a.md,AGENTS.md}'],
    [MAIN, 'touch {a,b}.md {x,AGENTS}.md']
  ],
  name: 'a brace expansion is judged word by word'
})
cases({
  expected: 'deny',
  list: [
    ['validator', 'cp AGENTS.md{.bak,}'],
    ['validator', 'touch docs/{1..3}.md']
  ],
  name: 'a brace expansion into the repository refuses a read-only agent'
})
cases({
  expected: '—',
  list: [
    [MAIN, 'cp docs/{a,b}.md /tmp/'],
    [MAIN, "echo '{AGENTS,x}.md' > /tmp/x"],
    ['validator', 'touch /tmp/{1..3}.log']
  ],
  name: 'a brace expansion that writes no rule file asks nothing'
})
test('a brace expansion past the bound depends on what the guard cannot read', () => {
  assert.equal(onDisk({ agent: 'validator', command: 'touch /tmp/{1..9999}' }), 'deny')
  assert.equal(onDisk({ agent: MAIN, command: 'touch /tmp/{1..9999}' }), '—')
})

// -- 3. writers the guard did not know, and programs it does not know -----------
const NEW_WRITERS = [
  'dos2unix AGENTS.md',
  'unix2dos AGENTS.md',
  'dos2unix -n README.md AGENTS.md',
  "awk -i inplace '{print}' AGENTS.md",
  "gawk -i inplace '{print}' AGENTS.md",
  "vim -c 'wq' AGENTS.md",
  'vi AGENTS.md',
  "ex -sc 'wq' AGENTS.md",
  'nvim --headless -c wq AGENTS.md',
  "ed -s AGENTS.md <<< 'w'",
  `perl -e 'open(F,">AGENTS.md")'`,
  `ruby -e 'File.write("AGENTS.md", "x")'`,
  'openssl rand -out AGENTS.md 16',
  'iconv -f utf8 -t utf8 -o AGENTS.md README.md',
  'jq . /tmp/x.json | sponge AGENTS.md',
  'yq -i .a=1 AGENTS.md',
  'scp host:/x AGENTS.md',
  'zip AGENTS.md docs/a.md',
  'gpg -o AGENTS.md -d /tmp/x.gpg',
  'patch AGENTS.md < /tmp/p',
  'patch -o AGENTS.md README.md /tmp/p',
  'time -p bash -c "echo x > AGENTS.md"',
  'busybox sh -c "echo x > AGENTS.md"',
  'busybox cp /tmp/a AGENTS.md'
]
cases({
  expected: 'deny',
  list: NEW_WRITERS.map((command) => ['validator', command]),
  name: 'a writer the guard now knows refuses a read-only agent'
})
cases({
  expected: 'ask',
  list: NEW_WRITERS.map((command) => [MAIN, command]),
  name: 'a writer the guard now knows asks before a rule file'
})
cases({
  expected: '—',
  list: [
    ['validator', 'dos2unix /tmp/a.txt'],
    ['validator', "perl -e 'print 1' docs/a.md"],
    ['validator', "ruby -e 'puts 1'"],
    ['validator', 'iconv -f utf8 -t utf8 docs/a.md'],
    ['validator', 'scp docs/a.md host:/x'],
    ['validator', 'jq . docs/a.md']
  ],
  name: 'the read or scratch neighbour of a new writer passes'
})

cases({
  expected: 'deny',
  list: [
    ['validator', 'frobnicate docs/a.md'],
    ['validator', 'frobnicate --out=docs/a.md'],
    ['validator', 'make -C src'],
    ['validator', 'source scripts/env.sh']
  ],
  name: 'a program the guard does not know refuses a read-only agent that names a repository path'
})
cases({
  expected: '—',
  list: [
    ['validator', 'frobnicate --version'],
    ['validator', 'docker ps'],
    ['validator', 'frobnicate /tmp/a.log'],
    ['validator', 'cat docs/a.md'],
    ['validator', 'bat src/a.ts'],
    ['validator', 'ls -la src && wc -l docs/a.md'],
    [MAIN, 'frobnicate docs/a.md'],
    [MAIN, 'cat AGENTS.md'],
    ['skill-author', 'frobnicate docs/a.md']
  ],
  name: 'a known reader, or an unknown program that names no repository path, passes'
})
cases({
  expected: 'ask',
  list: [
    [MAIN, 'frobnicate AGENTS.md'],
    [MAIN, 'code .claude/skills/sdd/SKILL.md'],
    ['skill-author', 'notepad AGENTS.md']
  ],
  name: 'a program the guard does not know asks the main session when it names a rule path'
})

// -- 4. combined short options -----------------------------------------------------
cases({
  expected: 'ask',
  list: [
    [MAIN, 'wget -qO .claude/settings.json http://example.invalid'],
    [MAIN, 'curl -sSo AGENTS.md https://e.test/a'],
    [MAIN, 'curl -fsSLo AGENTS.md https://e.test/a'],
    [MAIN, 'sort -ro AGENTS.md docs/a.md'],
    [MAIN, 'unzip -qd .claude x.zip']
  ],
  name: 'a value in a cluster of short options is read'
})
cases({
  expected: 'deny',
  list: [['validator', 'wget -qO docs/a.md http://example.invalid']],
  name: 'a clustered output into the repository refuses a read-only agent'
})

// -- 5. git subcommands that rewrite the tree ----------------------------------------
cases({
  expected: 'ask',
  list: [
    [MAIN, 'git stash push -- AGENTS.md'],
    [MAIN, 'git checkout-index -f -- AGENTS.md'],
    [MAIN, 'git reset --hard HEAD -- AGENTS.md'],
    [MAIN, 'git apply /tmp/p AGENTS.md'],
    ['skill-author', 'git stash push -- AGENTS.md']
  ],
  name: 'a git subcommand that rewrites the tree and names a rule path asks'
})
cases({
  expected: 'deny',
  list: [['e2e-author', 'git stash push -- AGENTS.md']],
  name: 'a git subcommand that rewrites the tree and names a rule path refuses a surface agent'
})
cases({
  expected: '—',
  list: [
    [MAIN, 'git stash push -- docs/a.md'],
    [MAIN, 'git add AGENTS.md'],
    [MAIN, 'git commit -m x -- AGENTS.md'],
    [MAIN, 'git reset HEAD -- AGENTS.md'],
    [MAIN, 'git diff -- AGENTS.md']
  ],
  name: 'a git subcommand that keeps to the index, the history or reads asks nothing'
})

// -- 6. a write into a folder, by the name it writes -------------------------------
cases({
  expected: 'ask',
  list: [
    [MAIN, 'find . -name AGENTS.md -delete'],
    [MAIN, "find . -name 'SKILL.md' -exec rm {} +"],
    [MAIN, "find .claude -path '*/skills/*' -delete"],
    // A rule glob ending in /** holds any name below it.
    [MAIN, "find . -name '*.orig' -delete"],
    [MAIN, 'cp /tmp/AGENTS.md .'],
    [MAIN, 'cp /tmp/settings.json .claude'],
    [MAIN, 'mv /tmp/x/AGENTS.md .'],
    [MAIN, 'install -t . /tmp/AGENTS.md'],
    [MAIN, 'tar -xf /tmp/x.tar AGENTS.md'],
    [MAIN, 'tar xzf /tmp/x.tgz docs/a.md AGENTS.md'],
    [MAIN, 'unzip -o /tmp/x.zip AGENTS.md'],
    [MAIN, 'curl -O https://e.test/AGENTS.md'],
    [MAIN, 'curl -sSLO https://e.test/x/AGENTS.md?raw=1'],
    [MAIN, 'wget https://e.test/AGENTS.md']
  ],
  name: 'a file written into a folder by its name asks when the name is a rule file'
})
cases({
  expected: '—',
  list: [
    [MAIN, "find docs -name '*.orig' -delete"],
    [MAIN, 'find docs -name AGENTS.md -delete'],
    [MAIN, 'cp /tmp/a.md .'],
    [MAIN, 'cp /tmp/a.md docs/'],
    [MAIN, 'tar -xf /tmp/x.tar docs/a.md'],
    [MAIN, 'curl -O https://e.test/a.md'],
    [MAIN, 'wget https://e.test/']
  ],
  name: 'a file written into a folder by a name no rule names asks nothing'
})
test('a read-only write into the checkout root says it is inside the repository', () => {
  const { decision, reason } = shell({ command: 'rm -rf .', host: ON_DISK })
  assert.equal(decision, 'deny')
  assert.match(reason, /inside the repository/)
})

// -- advisories ----------------------------------------------------------------------
const clock = ({ step }) => {
  let now = 0
  return () => {
    now += step
    return now
  }
}

test('a command past the deadline asks the main session and refuses a policed agent, never waving it through', () => {
  const command = Array.from({ length: 40 }, (_, n) => `echo x > docs/f${n}.md`).join('; ')
  const slow = { ...ON_DISK, now: clock({ step: 1000 }) }
  const main = shell({ agent: MAIN, command, host: slow })
  assert.equal(main?.decision, 'ask')
  assert.match(main.reason, /deadline/)
  assert.equal(shell({ agent: 'validator', command, host: slow })?.decision, 'deny')
  assert.equal(shell({ agent: MAIN, command: 'echo x > docs/a.md', host: { ...ON_DISK, now: clock({ step: 1 }) } }), undefined)
})

test('a target written many times is read from the disk once', () => {
  let probes = 0
  const counted = {
    ...ON_DISK,
    isCheckout: (call) => {
      probes += 1
      return ON_DISK.isCheckout(call)
    }
  }
  const command = Array.from({ length: 200 }, () => 'echo x >> docs/log.md').join('; ')
  assert.equal(decisionOf({ agent: MAIN, command, host: counted }), '—')
  assert.ok(probes < 20, `${probes} probes`)
})

cases({
  expected: 'ask',
  list: [
    [MAIN, 'echo x > AGENTS.md\u0000.txt'],
    [MAIN, "echo x > $'\\x41GENTS.md'"],
    [MAIN, "echo x > $'AGENTS\\056md'"],
    [MAIN, "echo x > $'\\u0041GENTS.md'"]
  ],
  name: 'a NUL ends a word, and ANSI-C quoting is decoded'
})
cases({
  expected: 'deny',
  list: [['validator', "echo x > $'\\x41GENTS.md'"]],
  name: 'a decoded ANSI-C target refuses a read-only agent'
})

cases({
  expected: '—',
  list: [
    [MAIN, 'npx prettier --check AGENTS.md'],
    [MAIN, "bash -c 'cat AGENTS.md'"],
    [MAIN, 'sh -c "grep LAW AGENTS.md"'],
    [MAIN, 'patch -p1 < /tmp/x.patch'],
    [MAIN, 'Get-Content AGENTS.md 2>$null', 'PowerShell'],
    [MAIN, "'x' > $null; Get-Content AGENTS.md", 'PowerShell'],
    [MAIN, 'Copy-Item AGENTS.md $env:TEMP\\x.md', 'PowerShell'],
    [MAIN, 'Copy-Item -Path AGENTS.md -Destination docs\\x.md', 'PowerShell']
  ],
  name: 'a command that writes no rule file asks nothing'
})
cases({
  expected: 'ask',
  list: [
    [MAIN, "bash -c 'echo x > AGENTS.md'"],
    [MAIN, 'npx prettier --write AGENTS.md'],
    [MAIN, 'Copy-Item docs\\x.md AGENTS.md', 'PowerShell'],
    [MAIN, 'Copy-Item -Path docs\\x.md -Destination AGENTS.md', 'PowerShell'],
    [MAIN, 'Get-Content x 2>$null; Set-Content AGENTS.md x', 'PowerShell']
  ],
  name: 'the same commands writing a rule file still ask'
})
cases({
  expected: 'deny',
  list: [
    ['validator', 'npx prettier --check AGENTS.md'],
    ['validator', "bash -c 'cat AGENTS.md'"]
  ],
  name: 'a read-only agent is still refused a package manager and an inner shell'
})

test('an unknown program is asked about by its own words, not the rest of the command', () => {
  assert.equal(onDisk({ command: 'frobnicate docs/a.md; cat AGENTS.md' }), '—')
  const { decision, reason } = shell({
    agent: MAIN,
    command: 'cat docs/a.md; frobnicate AGENTS.md',
    host: ON_DISK
  })
  assert.equal(decision, 'ask')
  assert.match(reason, /does not know/)
  assert.match(reason, /names `AGENTS\.md`, a rule file/)
})

test('a read-only refusal of an unknown program names it and the path', () => {
  const { reason } = shell({ command: 'frobnicate docs/a.md', host: ON_DISK })
  assert.match(reason, /`frobnicate`/)
  assert.match(reason, /docs\/a\.md/)
  assert.match(reason, /does not know/)
})
