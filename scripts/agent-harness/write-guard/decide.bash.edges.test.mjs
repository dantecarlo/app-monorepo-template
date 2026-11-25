#!/usr/bin/env node
// ---------------------------------------------------------------------------
// decide, Bash, the edges — the rest of Certifipago's enforce-agent-writes
// test, ported verbatim: a surface agent held to its surface, fd's appended
// path, snapshot updates, perl's switches, the path an inline write names,
// the timing of a pathological list, internal errors, the nesting cap, case
// statements, substitutions in patterns and arithmetic, line
// continuations, the PowerShell refusal, and one case per safety rule a
// single-line mutation left unpinned. "refused" is a deny here, and
// "allowed" is no verdict.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/decide.bash.edges.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { decisionOf, shell } from './decide.shell.fixtures.mjs'

const refuses = ({ agent, command, name }) =>
  test(name, () => {
    assert.equal(decisionOf({ agent, command }), 'deny')
  })

const allows = ({ agent, command, name }) =>
  test(name, () => {
    assert.equal(decisionOf({ agent, command }), '—')
  })

// -- e2e-author is held to its surface ------------------------------------------
for (const command of [
  'echo x > apps/mobile/.maestro/a.yaml',
  'cp /tmp/a.yaml docs/qa/',
  'mkdir -p apps/mobile/.maestro/flows/x',
  'git add apps/mobile/.maestro/a.yaml docs/qa/b.md',
  'git add -A apps/mobile/.maestro docs/qa',
  'git commit -m "test(e2e): add login flow"',
  'bash apps/mobile/scripts/e2e-mobile.sh',
  'node scripts/user-flows/report.mjs',
  'curl -s http://localhost:8081/status',
  'maestro test apps/mobile/.maestro/a.yaml > /tmp/run.log 2>&1',
  'npx expo start'
]) {
  allows({
    agent: 'e2e-author',
    command,
    name: `e2e-author keeps its workflow: ${command}`
  })
}
allows({
  agent: 'e2e-author',
  command:
    'cd /c/work/sibling && cp /tmp/a.yaml apps/mobile/.maestro/a.yaml',
  name: 'e2e-author keeps its surface in a sibling worktree of the repository'
})
refuses({
  agent: 'e2e-author',
  command:
    'cd /c/work/elsewhere && cp /tmp/a.yaml apps/mobile/.maestro/a.yaml',
  name: 'a surface-shaped path outside any checkout is not the surface'
})
for (const command of [
  'echo x > apps/web/a.ts',
  'tee apps/web/a.ts < /tmp/a',
  'cp /tmp/a.ts apps/web/a.ts',
  'mv apps/web/a.ts /tmp/',
  'mkdir apps/web/x',
  'touch src/a.ts',
  'rm apps/web/a.ts',
  'git add apps/web/a.ts',
  'git add -A',
  'git add -u',
  'git add -A apps/mobile/.maestro apps/web',
  'git add .',
  'git commit -am "x"'
]) {
  refuses({
    agent: 'e2e-author',
    command,
    name: `e2e-author may not write outside its surface: ${command}`
  })
}
test('a surface denial names the agent and its surface', () => {
  const reason =
    shell({ agent: 'e2e-author', command: 'touch src/a.ts' })?.reason ?? ''
  assert.match(reason, /e2e-author/)
  assert.match(reason, /apps\/mobile\/\.maestro\//)
})

// -- fd -x / -X append the path when the command names no {} ----------------
for (const [agent, command] of [
  ['validator', "fd -e ts -X sd 'old' 'new'"],
  ['validator', 'fd -e orig -x rm'],
  ['validator', "fd -t f -X perl -pi -e 's/a/b/'"],
  ['e2e-author', 'fd -e orig -x rm'],
  ['e2e-author', "fd -e ts . apps/web -X sd 'old' 'new'"]
]) {
  refuses({
    agent,
    command,
    name: `fd appends the found path to a command with no {}: ${agent}: ${command}`
  })
}
allows({
  command: 'fd -e log . /tmp/probe -x rm',
  name: 'fd -x with no {} under a scratch root is allowed'
})
allows({
  agent: 'e2e-author',
  command: 'fd -e orig . apps/mobile/.maestro -x rm',
  name: 'fd -x with no {} inside the surface is allowed for e2e-author'
})

// -- pnpm scripts that update snapshots --------------------------------------
for (const command of [
  'pnpm --filter web test -u',
  'pnpm test -- -u',
  'pnpm verify:maps --update',
  'pnpm web:test --update-snapshots',
  'pnpm exec vitest run -u'
]) {
  refuses({ command, name: `a snapshot update is refused: ${command}` })
}
allows({
  command: 'pnpm test -- src/a.test.ts',
  name: 'pnpm test with a file filter is allowed'
})

// -- perl's bundled and numeric switches -------------------------------------
for (const command of [
  "perl -0777 -pi -e 's/a/b/' apps/x.ts",
  "perl -0pi -e 's/a/b/' apps/x.ts",
  "perl -pi.bak -e 's/a/b/' apps/x.ts",
  "perl -i -pe 's/a/b/' apps/x.ts",
  "perl -lpi -e 's/a/b/' apps/x.ts"
]) {
  refuses({
    command,
    name: `perl in place into the repository: ${command}`
  })
}
for (const command of [
  "perl -0777 -ne 'print' apps/x.ts",
  "perl -0777 -pi -e 's/a/b/' /tmp/x.ts",
  "perl -MJSON -e 'print 1' apps/x.json"
]) {
  allows({ command, name: `perl that reads or edits scratch: ${command}` })
}

// -- inline code: the path a write call writes, not its first argument --------
for (const command of [
  `node -e "require('fs').copyFileSync('/tmp/a', 'apps/a')"`,
  `node -e "require('fs').renameSync('/tmp/a', 'apps/a')"`,
  `node -e "require('fs').renameSync('apps/a', '/tmp/a')"`,
  `node -e "require('fs').cpSync('/tmp/a', 'apps/a', { recursive: true })"`,
  `python3 -c "import shutil; shutil.copy('/tmp/a', 'apps/x')"`,
  `python3 -c "import os; os.rename('/tmp/a', 'apps/x')"`,
  `python3 -c "from pathlib import Path; Path('apps/x').write_text('/tmp/y')"`,
  `node -e "const n = process.argv[1]; require('fs').writeFileSync('apps/' + n, '1')"`
]) {
  refuses({
    command,
    name: `inline code writing a repository path: ${command}`
  })
}
for (const command of [
  `node -e "require('fs').copyFileSync('apps/a', '/tmp/a')"`,
  `python3 -c "import shutil; shutil.copy('apps/x', '/tmp/x')"`,
  `python3 -c "from pathlib import Path; Path('/tmp/x').write_text('apps/y')"`,
  `node -e "for (const n of ['a', 'b']) require('fs').rmSync('/tmp/probe/' + n, { force: true })"`
]) {
  allows({ command, name: `inline code copying into scratch: ${command}` })
}

// -- the hook answers, and fast, whatever it is given -------------------------
const LIST_DEADLINE_MS = 500
const NAME_LENGTH = 40
// Deep enough to overflow the stack of a parser with no nesting cap.
const FAR_PAST_THE_CAP = 3000
// Items with no commas, wide gaps and a trailing name: the shape that made a
// backtracking list pattern take seconds per extra item.
const NO_COMMAS = Array.from({ length: 30 }, (_, n) => `'item${n}'`).join(
  '    '
)
for (const command of [
  `python3 -c "import subprocess; subprocess.run([${NO_COMMAS} x])"`,
  `node -e "require('child_process').execSync([${NO_COMMAS} x])"`
]) {
  test(`a pathological 30-item list decides in well under a second: ${command.slice(0, NAME_LENGTH)}`, () => {
    const start = performance.now()
    shell({ command })
    assert.ok(performance.now() - start < LIST_DEADLINE_MS)
  })
}
for (const agent of ['validator', 'e2e-author']) {
  test(`an internal error denies for ${agent} instead of throwing`, () => {
    const verdict = shell({ agent, command: 'ls', cwd: 5 })
    assert.equal(verdict?.decision, 'deny')
    assert.match(verdict?.reason ?? '', /could not judge/)
  })
  test(`substitutions nested past the cap are refused for ${agent}`, () => {
    const command = `echo ${'$('.repeat(FAR_PAST_THE_CAP)}x${')'.repeat(FAR_PAST_THE_CAP)}`
    const verdict = shell({ agent, command })
    assert.equal(verdict?.decision, 'deny')
    assert.match(verdict?.reason ?? '', /nested/)
  })
}
allows({
  command: 'echo $(echo $(echo $(echo x)))',
  name: 'substitutions nested a few deep are read'
})

// -- case statements ------------------------------------------------------------
for (const command of [
  'case "$1" in a) echo a ;; b|c) echo b ;; *) echo z ;; esac',
  'for f in a b; do case $f in (a) echo 1;; esac; done',
  'case x in\n  a)\n    rg a src\n    ;;\nesac'
]) {
  allows({
    command,
    name: `a case statement is read: ${JSON.stringify(command)}`
  })
}
for (const command of [
  'case x in a) touch src/a ;; esac',
  'case $(rm -rf src) in a) echo ;; esac'
]) {
  refuses({
    command,
    name: `a write inside a case statement is judged: ${command}`
  })
}

// -- substitutions inside case patterns and arithmetic run too ---------------
for (const [agent, command] of [
  ['validator', 'case x in $(touch apps/x)) ;; esac'],
  ['validator', 'case x in a|`touch apps/x`) echo a ;; esac'],
  ['e2e-author', 'case x in $(touch apps/web/x)) ;; esac'],
  ['validator', 'echo $(( 1 + $(touch apps/x) ))'],
  ['validator', 'echo "$(( `touch apps/x` ))"'],
  ['validator', 'echo $(( 1 + $(( 2 * $(rm -rf src) )) ))'],
  ['validator', 'echo $(( 1 + $(touch apps/x ))']
]) {
  refuses({
    agent,
    command,
    name: `a substitution in a pattern or arithmetic is judged: ${agent}: ${command}`
  })
}
for (const command of [
  'case x in $(echo a)) echo a ;; esac',
  'echo $(( 1 + $(wc -l < src/a.ts) ))',
  'echo $(( $(date +%s) - 5 ))'
]) {
  allows({
    command,
    name: `a read in a pattern or arithmetic is allowed: ${command}`
  })
}

// -- a line continuation is removed before the command is judged ------------
// Bash drops a backslash-newline outside single quotes, comments and quoted
// here-doc bodies before it reads the command, so `tou\<newline>ch` runs
// touch and `$\<newline>(` opens a substitution.
for (const command of [
  'echo $(( 1 + $\\\n(touch apps/x; printf 0) ))',
  'echo "$\\\n(touch apps/x)"',
  'tou\\\nch apps/x',
  'echo `tou\\\nch apps/x`',
  'echo x >\\\n apps/x',
  '# a note \\\ntouch apps/x',
  "cat <<'EOF'\nx \\\nEOF\ntouch apps/x",
  // Quotes start over inside a substitution, even one inside double quotes.
  'echo "$(echo "\'$\\\n(touch apps/x)")"',
  'echo "`echo "\'$\\\n(touch apps/x)"`"'
]) {
  refuses({
    command,
    name: `a write behind a line continuation is judged: ${JSON.stringify(command)}`
  })
}
for (const command of [
  'rg foo \\\n  apps/web/src',
  "rg -n 'a\\\nb' apps/web/src",
  '# a note \\\nrg foo apps/web/src',
  "cat <<'EOF'\nx \\\nEOF\nrg foo apps/web/src",
  'rg -n "$(echo \'a\\\nb\')" apps/web/src'
]) {
  allows({
    command,
    name: `a read behind a line continuation is allowed: ${JSON.stringify(command)}`
  })
}

for (const command of [
  'echo "$\\\n(echo "\'$\\\n(touch apps/x)")"',
  'echo $(\\\n(1 + 2))',
  "echo $\\\n'a'",
  'cat <\\\n<EOF\nx\nEOF'
]) {
  test(`a continuation that splits an opener is refused: ${JSON.stringify(command)}`, () => {
    assert.match(
      shell({ command })?.reason ?? '',
      /line continuation splits/
    )
  })
}

// -- the PowerShell tool is not parsed ----------------------------------------
for (const agent of ['validator', 'codegraph-explorer', 'e2e-author']) {
  test(`the PowerShell tool is refused for ${agent}`, () => {
    const verdict = shell({
      agent,
      command: 'Get-ChildItem',
      tool: 'PowerShell'
    })
    assert.equal(verdict?.decision, 'deny')
    assert.match(verdict?.reason ?? '', /PowerShell/)
  })
}
test('the PowerShell tool is not policed for a writer with no surface', () => {
  assert.equal(
    shell({
      agent: 'skill-author',
      command: 'Get-ChildItem',
      tool: 'PowerShell'
    }),
    undefined
  )
})

// -- one case per safety rule a single-line mutation left unpinned -------------
test('an unknown command name used as a writer is refused and named', () => {
  assert.match(shell({ command: '$X apps/x' })?.reason ?? '', /\$X/)
})
for (const [agent, command] of [
  ['validator', 'dd if=/tmp/a of=apps/x'],
  ['validator', 'sort -o apps/x /tmp/a'],
  ['validator', 'rg -l x src | xargs -I % cp /tmp/a %'],
  ['validator', 'find src -fprint out.txt'],
  ['validator', 'tar -xzf /tmp/a.tgz -C apps'],
  ['validator', 'tar czf out.tgz src'],
  ['validator', 'echo x >| notes.log'],
  ['validator', 'bunx prettier --check .'],
  ['validator', 'mktemp -d -p .'],
  ['validator', 'sudo rm -rf src'],
  ['validator', 'gh pr checkout 12'],
  ['validator', 'git config --unset user.name'],
  ['validator', 'git tag -d v1'],
  ['validator', 'git reflog expire --all'],
  ['validator', 'git symbolic-ref HEAD refs/heads/x'],
  ['validator', 'curl -sSLO https://example.test/a'],
  ['e2e-author', 'git commit -a'],
  [
    'e2e-author',
    'git add --pathspec-from-file=/tmp/list apps/mobile/.maestro/a.yaml'
  ],
  ['e2e-author', 'git -C apps/web add a.ts']
]) {
  refuses({
    agent,
    command,
    name: `a pinned write shape is refused: ${agent}: ${command}`
  })
}
for (const [agent, command] of [
  ['validator', 'git -C /tmp/tree archive -o out.tar HEAD'],
  ['validator', 'dd if=apps/x of=/tmp/a'],
  ['validator', 'sort -o /tmp/a apps/x'],
  ['validator', 'rg -l x src | xargs -I % cp % /tmp/copies/'],
  ['validator', 'find src -fprint /tmp/out.txt'],
  ['validator', 'tar -xzf /tmp/a.tgz -C /tmp/x'],
  ['validator', 'tar czf /tmp/o.tgz src'],
  ['validator', 'echo x >| /tmp/n.log'],
  ['validator', 'mktemp -d -p /tmp'],
  ['validator', 'sudo -u me rg foo src'],
  ['validator', 'gh pr view 12'],
  ['validator', 'git config user.name'],
  ['validator', 'git tag --contains HEAD'],
  ['validator', 'git reflog -5'],
  ['validator', 'git symbolic-ref HEAD'],
  ['validator', 'cd /tmp/dl && curl -sSLO https://example.test/a'],
  ['e2e-author', 'git -C apps/mobile add .maestro/a.yaml']
]) {
  allows({
    agent,
    command,
    name: `its read or scratch neighbour is allowed: ${agent}: ${command}`
  })
}
