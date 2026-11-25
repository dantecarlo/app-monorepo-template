#!/usr/bin/env node
// ---------------------------------------------------------------------------
// decide, Bash — ported verbatim from Certifipago's enforce-agent-writes
// test: every write shape in both directions, refused into the repository
// for a read-only agent and left alone into a scratch root, the reads the
// validator runs every day, git, the package managers, inner shells, inline
// code, here-docs, variables, nested commands, commands it cannot read, a
// repository under a scratch root, and who is policed. "refused" is a deny
// here, and "allowed" is no verdict. One case differs by design, and says so.
// decide.bash.edges.test.mjs holds the rest of the donor's cases.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/decide.bash.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  CLONE_IN_SCRATCH,
  decisionOf,
  GIT_BASH_SCRATCH,
  MAIN,
  SCRATCH,
  shell
} from './decide.shell.fixtures.mjs'

const refuses = ({ agent, command, name }) =>
  test(name, () => {
    assert.equal(decisionOf({ agent, command }), 'deny')
  })

const allows = ({ agent, command, name }) =>
  test(name, () => {
    assert.equal(decisionOf({ agent, command }), '—')
  })

// -- write shapes: refused into the repository, allowed into scratch ---------
for (const [shape, intoRepo, intoScratch] of [
  ['>', 'echo x > notes.log', 'echo x > /tmp/notes.log'],
  ['>>', 'echo x >> notes.log', `echo x >> ${GIT_BASH_SCRATCH}/n.log`],
  [
    '2>',
    'pnpm verify:maps 2> err.log',
    'pnpm verify:maps 2> $TEMP/err.log'
  ],
  [
    '&>',
    'pnpm verify:maps &> all.log',
    'pnpm verify:maps &> $TMP/all.log'
  ],
  [
    'a quoted Windows target',
    'echo x > "C:\\work\\repo\\src\\a.ts"',
    `echo x > "${SCRATCH}\\a.log"`
  ],
  [
    'tee',
    'rg foo src | tee hits.txt',
    'rg foo src | tee -a /tmp/hits.txt'
  ],
  ['rm', 'rm -rf dist', 'rm -rf /tmp/probe'],
  ['rmdir', 'rmdir build', 'rmdir /tmp/empty'],
  ['mv', 'mv src/a.ts /tmp/a.ts', 'mv /tmp/a.ts /tmp/b.ts'],
  ['cp', 'cp /tmp/a.ts src/a.ts', 'cp src/a.ts /tmp/probe/'],
  ['mkdir', 'mkdir -p out/x', 'mkdir -p /tmp/probe/x'],
  ['touch', 'touch src/new.ts', 'touch /tmp/new.ts'],
  ['ln', 'ln -s /tmp/a src/link', 'ln -s src/a.ts /tmp/link'],
  ['chmod', 'chmod +x scripts/x.sh', 'chmod +x /tmp/x.sh'],
  ['truncate', 'truncate -s 0 app.log', 'truncate -s 0 /tmp/app.log'],
  ['install', 'install -m 644 /tmp/a lib/a', 'install /tmp/a /tmp/b'],
  ['sd', "sd 'old' 'new' src/a.ts", "sd 'old' 'new' /tmp/a.ts"],
  ['sed -i', "sed -i 's/a/b/' src/a.ts", "sed -i 's/a/b/' /tmp/a.ts"],
  [
    'perl -i',
    "perl -pi -e 's/a/b/' src/a.ts",
    "perl -pi -e 's/a/b/' /tmp/a"
  ],
  [
    'tar -x into the current directory',
    'git archive HEAD | tar -x',
    'git archive HEAD | tar -x -C /tmp/tree'
  ],
  ['unzip', 'unzip bundle.zip', 'unzip -d /tmp/b bundle.zip'],
  [
    'curl -o',
    'curl -sS -o out.json https://example.test/a',
    'curl -sS -o /tmp/out.json https://example.test/a'
  ],
  [
    'eslint -o',
    'pnpm exec eslint -o report.json src',
    'pnpm exec eslint -o /tmp/report.json src'
  ],
  [
    'git archive -o',
    'git archive -o tree.tar HEAD',
    'git archive -o /tmp/tree.tar HEAD'
  ]
]) {
  refuses({
    command: intoRepo,
    name: `${shape} into the repository is refused for a read-only agent`
  })
  allows({
    command: intoScratch,
    name: `${shape} into a scratch root is allowed for a read-only agent`
  })
}

// -- redirections that write no file -----------------------------------------
for (const command of [
  'pnpm verify:maps 2>&1 | tail -5',
  'rg foo src > /dev/null',
  'rg foo src 2>/dev/null',
  'rg foo src > NUL',
  'echo warning >&2'
]) {
  allows({
    command,
    name: `a redirection that writes no file is allowed: ${command}`
  })
}

// -- reads the validator runs every day ---------------------------------------
for (const command of [
  'cd C:/work/repo && rg -n "useAppQuery" src | head -20',
  'git diff origin/master...HEAD -- src | wc -l',
  'git log --oneline -5 && git status --short',
  'git show HEAD:package.json | head',
  'git fetch origin master',
  'git stash list',
  'git branch -a',
  'git tag --list',
  'git worktree list',
  'git config --get user.email',
  'fd -e ts . src | head',
  'bat src/a.ts',
  'pnpm verify:maps',
  'pnpm -s verify:tests',
  'pnpm --filter @app/web test',
  'pnpm -C apps/web typecheck',
  'pnpm lint',
  'pnpm knip',
  'pnpm view react version',
  'pnpm exec vitest run src/a.test.ts',
  'pnpm exec eslint src/a.ts',
  'pnpm exec prettier --check src/a.ts',
  'pnpm exec tsc --noEmit -p apps/web',
  'codegraph explore "useAppQuery"',
  'codegraph sync -q .',
  'node scripts/probe.mjs',
  'node -e "console.log(require(\'./package.json\').version)"',
  'timeout 60 pnpm verify:maps',
  'cut -d: -f1 list.txt | sort | uniq -c'
]) {
  allows({ command, name: `a read is allowed: ${command}` })
}

// -- git: what changes the tree, index, history or branches ------------------
for (const command of [
  'git add .',
  'git commit -m "x"',
  'git push',
  'git pull',
  'git checkout -- src/a.ts',
  'git switch main',
  'git reset --hard',
  'git restore src/a.ts',
  'git rm src/a.ts',
  'git mv a b',
  'git merge origin/master',
  'git rebase master',
  'git cherry-pick abc123',
  'git revert abc123',
  'git stash',
  'git stash pop',
  'git clean -fd',
  'git tag v1',
  'git branch -D old',
  'git branch topic',
  'git apply fix.patch',
  'git am mail.patch',
  'git worktree add ../wt',
  'git worktree remove ../wt',
  'git init',
  'git config user.name x',
  'git notes add -m x',
  'git update-ref refs/heads/x HEAD',
  'git gc',
  'git -C ../other add .'
]) {
  refuses({
    command,
    name: `a git write is refused for a read-only agent: ${command}`
  })
}

// -- package managers and codegraph -------------------------------------------
for (const command of [
  'npx prettier --check .',
  'npm install',
  'yarn',
  'pnpm install',
  'pnpm add left-pad',
  'pnpm dlx create-x',
  'pnpm build',
  'pnpm lint --fix',
  'pnpm exec eslint --fix src',
  'pnpm exec prettier --write src',
  'pnpm exec tsc',
  'codegraph init',
  'codegraph index'
]) {
  refuses({
    command,
    name: `a writing tool form is refused for a read-only agent: ${command}`
  })
}

// -- shells inside the shell: the inner text is not read ----------------------
for (const command of [
  "bash -c 'ls'",
  'sh -c ls',
  'eval "ls"',
  'cmd /c dir',
  'powershell -Command Get-ChildItem',
  'pwsh -c Get-ChildItem'
]) {
  test(`an inner shell is refused and told to run directly: ${command}`, () => {
    assert.match(shell({ command })?.reason ?? '', /directly/)
  })
}

// -- inline code --------------------------------------------------------------
for (const command of [
  `node -e "require('fs').writeFileSync('out.json', '1')"`,
  `node -p "require('fs').mkdirSync('src/x')"`,
  `node -e "require('child_process').execSync('git add .')"`,
  `python -c "open('out.txt', 'w').write('1')"`,
  `python3 -c "import os; os.remove('a.txt')"`,
  `node -e "const {execSync}=require('child_process'); execSync('git ' + process.argv[1])"`,
  `node -e "const p='out.json'; require('fs').writeFileSync(p, '1')"`,
  "node - <<'EOF'\nrequire('fs').writeFileSync('x.json', '1')\nEOF",
  "python3 - <<'EOF'\nopen('o.txt', 'w').write('1')\nEOF",
  "bash <<'EOF'\nls\nEOF"
]) {
  refuses({
    command,
    name: `inline code that writes outside scratch is refused: ${command}`
  })
}
for (const command of [
  `node -e "console.log(require('child_process').execSync('git diff --stat', { encoding: 'utf8' }))"`,
  `node -e "require('child_process').execFileSync('git', ['log', '-1'])"`,
  `python3 -c "import subprocess; subprocess.run(['git', 'status'])"`,
  `cd /tmp/probe && node -e "const p='out.json'; require('fs').writeFileSync(p, '1')"`,
  `node -e "require('fs').writeFileSync('/tmp/out.json', '1')"`,
  `node -e "const {tmpdir}=require('os');require('fs').writeFileSync(require('path').join(tmpdir(),'x'),'1')"`,
  `python -c "print(1)"`,
  "node - <<'EOF'\nconsole.log(JSON.parse('{}'))\nEOF",
  "node --input-type=module - <<'EOF'\nconst m = /x/.exec('x'); console.log(m)\nEOF"
]) {
  allows({
    command,
    name: `inline code that writes nothing outside scratch is allowed: ${command}`
  })
}

// -- here-doc bodies are data unless they feed an interpreter ----------------
allows({
  command:
    "cat > /tmp/probe.mjs <<'EOF'\nimport fs from 'node:fs'\nfs.writeFileSync('x', '1')\nEOF\nnode /tmp/probe.mjs",
  name: 'a probe script written into scratch is allowed, whatever it holds'
})
refuses({
  command: "cat > probe.mjs <<'EOF'\nconsole.log(1)\nEOF",
  name: 'a here-doc written into the repository is refused'
})
refuses({
  command: 'cat > /tmp/p.txt <<EOF\n$(touch src/a.ts)\nEOF',
  name: 'a substitution inside an unquoted here-doc body is judged'
})

// -- variables: Bash calls share no shell state -------------------------------
for (const command of [
  'S=/tmp/v1; mkdir -p $S && echo x > $S/log',
  'S=$(mktemp -d); pnpm verify:maps > "$S/maps.log" 2>&1',
  'S=$(mktemp -d) && cd $S && echo x > log',
  `S=${GIT_BASH_SCRATCH}/v2 && git archive HEAD | tar -x -C "$S"`,
  'echo x > ${TMPDIR}/a.log',
  'for f in a b; do echo x > /tmp/$f.log; done',
  'S=$(mktemp -d); for g in verify:a verify:b; do n=$(echo $g | tr : _); pnpm $g > "$S/$n.out" 2>&1; done',
  // Differs by design: the donor's items are a:test and b:test, and a `:`
  // past the drive names an NTFS stream, which the template refuses to read
  // (the case below); lint and test are read forms with no colon.
  'S=$(mktemp -d); for t in lint test; do ( pnpm "$t" > "$S/$t.log" 2>&1 ) & done'
]) {
  allows({
    command,
    name: `a write through a scratch variable set in the command is allowed: ${command}`
  })
}
for (const command of [
  'S=src; echo x > $S/log',
  'S=/tmp/x/../../work; echo x > $S/a',
  'cd src && echo x > log',
  'for f in a b; do touch $f; done',
  'for g in verify:maps build; do pnpm $g; done',
  'S=$(mktemp -d); echo x > $(git rev-parse --show-toplevel)/out.log'
]) {
  refuses({
    command,
    name: `a write that resolves into the repository is refused: ${command}`
  })
}
test('a scratch log named after a pnpm script with a colon is an NTFS stream, refused to a read-only agent', () => {
  const verdict = shell({
    command:
      'S=$(mktemp -d); for t in a:test; do pnpm "$t" > "$S/$t.log"; done'
  })
  assert.equal(verdict?.decision, 'deny')
  assert.match(verdict.reason, /stream/)
})
test('a write through a variable the command never sets names the shape to use', () => {
  const reason = shell({ command: 'echo x > $X/log' })?.reason ?? ''
  assert.match(reason, /\$X/)
  assert.match(reason, /mktemp -d/)
})

// -- nested commands are judged by the same rules ------------------------------
for (const command of [
  'echo $(rm -rf src)',
  'echo `touch a`',
  'rg x src | xargs rm',
  'find . -name "*.orig" -delete',
  'find . -name "*.orig" -exec rm {} \\;',
  'timeout 60 rm a',
  'env FOO=1 touch a',
  '(cd /tmp && touch x) && touch y'
]) {
  refuses({ command, name: `a nested write is refused: ${command}` })
}
for (const command of [
  'S=$(mktemp -d); find $S -name "*.log" -delete',
  'fd -e ts . src | xargs -I{} cp {} /tmp/copies/',
  'echo $(git rev-parse HEAD)'
]) {
  allows({
    command,
    name: `a nested read or scratch write is allowed: ${command}`
  })
}

// -- what cannot be read is refused for a read-only agent ---------------------
for (const command of [
  'echo "unterminated',
  'cat <<EOF\nno end',
  'echo $(ls'
]) {
  test(`an unreadable command is refused: ${JSON.stringify(command)}`, () => {
    assert.match(shell({ command })?.reason ?? '', /cannot be read/)
  })
}

// -- a repository under a scratch root is still the repository ---------------
test('a write into a repository that lives under a scratch root is refused', () => {
  assert.equal(
    decisionOf({
      command: 'echo probe > apps/web/src/probe.txt',
      cwd: CLONE_IN_SCRATCH
    }),
    'deny'
  )
})

test('scratch beside a repository under a scratch root stays writable', () => {
  assert.equal(
    decisionOf({
      command: `echo probe > ${GIT_BASH_SCRATCH}/probe.txt`,
      cwd: CLONE_IN_SCRATCH
    }),
    '—'
  )
})

// -- who is policed -------------------------------------------------------------
test('a main session without agent_type is not policed', () => {
  assert.equal(decisionOf({ agent: MAIN, command: 'rm -rf src' }), '—')
})
allows({
  agent: 'Explore',
  command: 'rm -rf src',
  name: 'an agent missing from the manifest is not policed'
})
// Differs by design: a skill is a rule file in the template, so a writer
// is asked before it writes one, where the donor said nothing.
test('a writer with no surface is not policed, and is asked before a rule file', () => {
  assert.equal(
    decisionOf({
      agent: 'skill-author',
      command: 'echo x > .claude/skills/a/SKILL.md && git add -A'
    }),
    'ask'
  )
  assert.equal(
    decisionOf({
      agent: 'skill-author',
      command: 'echo x > docs/a.md && git add -A'
    }),
    '—'
  )
})
allows({
  agent: 'codegraph-explorer',
  command: 'codegraph query useAppQuery | head',
  name: 'codegraph-explorer reads the graph'
})
refuses({
  agent: 'codegraph-explorer',
  command: 'codegraph init',
  name: 'codegraph-explorer is read-only too'
})

// -- the denial says who, what, and what to do instead ------------------------
test('a denial names the agent, the shape and the scratch alternative', () => {
  const reason = shell({ command: 'echo x > notes.log' })?.reason ?? ''
  assert.match(reason, /validator/)
  assert.match(reason, /notes\.log/)
  assert.match(reason, /mktemp -d/)
})
test('a git denial names the subcommand', () => {
  assert.match(
    shell({ command: 'git commit -m x' })?.reason ?? '',
    /commit/
  )
})

test('a payload without tool_name leaves the call alone', () => {
  assert.equal(shell({ command: 'rm a', tool: null }), undefined)
})
