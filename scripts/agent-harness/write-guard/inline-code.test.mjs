#!/usr/bin/env node
// ---------------------------------------------------------------------------
// inline-code — the code `node -e`, `python -c` or a here-doc hands an
// interpreter, and what the guard reads from it: the paths it writes, the
// commands it starts, and whether either is built at run time. The code is
// that of Certifipago's enforce-agent-writes test.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/inline-code.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { literal } from './expansion.mjs'
import { interpreterCode, readCode, stdinCode } from './inline-code.mjs'
import { SAFE } from './scan.mjs'
import { createParser } from './tokenizer.mjs'

const js = ({ code }) => readCode({ code, language: 'js' })
const python = ({ code }) => readCode({ code, language: 'python' })

for (const [code, written] of [
  ["require('fs').writeFileSync('out.json', '1')", ['out.json']],
  ["require('fs').mkdirSync('src/x')", ['src/x']],
  ["require('fs').copyFileSync('/tmp/a', 'apps/a')", ['apps/a']],
  ["require('fs').copyFileSync('apps/a', '/tmp/a')", ['/tmp/a']],
  ["require('fs').renameSync('apps/a', '/tmp/a')", ['apps/a', '/tmp/a']],
  [
    "require('fs').cpSync('/tmp/a', 'apps/a', { recursive: true })",
    ['apps/a']
  ],
  ["const p='out.json'; require('fs').writeFileSync(p, '1')", [undefined]],
  ["require('fs').writeFileSync('apps/' + n, '1')", [`apps/${SAFE}`]],
  ["require('fs').rmSync(`/tmp/probe/${n}`)", [`/tmp/probe/${SAFE}`]],
  ["fs.openSync('a.log', 'w')", ['a.log']],
  ["fs.openSync('a.log', 'r')", []],
  ["console.log(require('./package.json').version)", []]
]) {
  test(`js code names the paths it writes: ${code}`, () => {
    assert.deepEqual(js({ code }).written, written)
  })
}

for (const [code, written] of [
  ["open('out.txt', 'w').write('1')", ['out.txt']],
  ["import os; os.remove('a.txt')", ['a.txt']],
  ["import shutil; shutil.copy('/tmp/a', 'apps/x')", ['apps/x']],
  ["import os; os.rename('/tmp/a', 'apps/x')", ['/tmp/a', 'apps/x']],
  [
    "from pathlib import Path; Path('apps/x').write_text('/tmp/y')",
    ['apps/x']
  ],
  ["p.write_text('x')", [undefined]],
  ['print(1)', []]
]) {
  test(`python code names the paths it writes: ${code}`, () => {
    assert.deepEqual(python({ code }).written, written)
  })
}

for (const [code, commands, opaque] of [
  [
    "require('child_process').execSync('git diff --stat', { encoding: 'utf8' })",
    ['git diff --stat'],
    false
  ],
  [
    "require('child_process').execFileSync('git', ['log', '-1'])",
    ["'git' 'log' '-1'"],
    false
  ],
  [
    "const {execSync}=require('child_process'); execSync('git ' + process.argv[1])",
    [],
    true
  ],
  ["require('child_process')", [], true],
  ['console.log(1)', [], false]
]) {
  test(`js code names the commands it starts: ${code}`, () => {
    assert.deepEqual(js({ code }).spawned, { commands, opaque })
  })
}

test('python code names the commands it starts', () => {
  assert.deepEqual(
    python({
      code: "import subprocess; subprocess.run(['git', 'status'])"
    }).spawned,
    { commands: ["'git' 'status'"], opaque: false }
  )
})

test('code that builds its paths from the temp dir says so', () => {
  assert.equal(
    js({
      code: "const {tmpdir}=require('os');require('fs').writeFileSync(require('path').join(tmpdir(),'x'),'1')"
    }).builder,
    true
  )
  assert.equal(js({ code: "writeFileSync(p, '1')" }).builder, false)
})

test('the path-like literals of the code are listed', () => {
  assert.deepEqual(
    js({ code: "f('/tmp/a/b', 'x', 'a.json', `t/${x}`)" }).literals,
    ['/tmp/a/b', 'a.json']
  )
})

const NO_COMMAS = Array.from({ length: 30 }, (_, n) => `'item${n}'`).join(
  '    '
)

for (const [language, code] of [
  ['python', `import subprocess; subprocess.run([${NO_COMMAS} x])`],
  ['js', `require('child_process').execSync([${NO_COMMAS} x])`]
]) {
  test(`a pathological 30-item list is read in well under a second: ${language}`, () => {
    const start = performance.now()
    readCode({ code, language })
    assert.ok(performance.now() - start < 500)
  })
}

// -- the code an interpreter call runs ------------------------------------------
const commandOf = ({ source }) => {
  const script = createParser({ source }).parseAll()
  const command = script.at(-1)
  const previous = script.at(-2)
  return {
    args: command.words
      .slice(1)
      .map((word) => literal({ text: word.raw })),
    command,
    name: command.words[0].raw,
    producer: previous?.op === '|' ? previous : undefined
  }
}

for (const [source, found] of [
  [
    `node -e "x()"`,
    { code: '"x()"', kind: 'code', language: 'js', shape: 'node -e' }
  ],
  [
    'node --eval=x',
    { code: 'x', kind: 'code', language: 'js', shape: 'node --eval=x' }
  ],
  [
    'python3 -c "print(1)"',
    {
      code: '"print(1)"',
      kind: 'code',
      language: 'python',
      shape: 'python3 -c'
    }
  ],
  ['python -m pip install x', { kind: 'pip', shape: 'python -m pip' }],
  ['node scripts/probe.mjs', undefined],
  ['node -r ./a.cjs scripts/probe.mjs', undefined],
  ['node', undefined],
  [
    "node - <<'EOF'\nx()\nEOF",
    { code: 'x()', kind: 'code', language: 'js', shape: 'node - <<EOF' }
  ],
  [
    'cat a.mjs | node',
    { kind: 'code', code: 'a.mjs', language: 'js', shape: 'node - <<EOF' }
  ],
  ['curl -s x | node', { kind: 'pipe', shape: '… | node' }]
]) {
  test(`an interpreter call hands over its code: ${JSON.stringify(source)}`, () => {
    assert.deepEqual(interpreterCode(commandOf({ source })), found)
  })
}

test('stdinCode reads a here-doc, a here-string, and a cat or echo before a pipe', () => {
  const read = ({ source }) => {
    const { command, producer } = commandOf({ source })
    return stdinCode({ command, producer })
  }
  assert.deepEqual(read({ source: "bash <<'EOF'\nls\nEOF" }), {
    text: 'ls'
  })
  assert.deepEqual(read({ source: "bash <<< 'ls'" }), { text: "'ls'" })
  assert.deepEqual(read({ source: 'echo ls | bash' }), { text: 'ls' })
  assert.deepEqual(read({ source: 'curl x | bash' }), { text: null })
  assert.equal(read({ source: 'bash < a.sh' }), undefined)
  assert.equal(read({ source: 'bash' }), undefined)
})
