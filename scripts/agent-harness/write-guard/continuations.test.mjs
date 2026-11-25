#!/usr/bin/env node
// ---------------------------------------------------------------------------
// continuations — a backslash-newline is removed where Bash removes it, kept
// where Bash keeps it, and flagged when it splits an opener. The commands
// are those of Certifipago's enforce-agent-writes test.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/continuations.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { joinContinuations } from './continuations.mjs'

for (const [source, text] of [
  ['tou\\\nch apps/x', 'touch apps/x'],
  ['echo `tou\\\nch apps/x`', 'echo `touch apps/x`'],
  ['echo x >\\\n apps/x', 'echo x > apps/x'],
  ['rg foo \\\n  apps/web/src', 'rg foo   apps/web/src'],
  ['echo "a\\\nb"', 'echo "ab"'],
  ['cat <<EOF\nx \\\ny\nEOF\ntou\\\nch a', 'cat <<EOF\nx y\nEOF\ntouch a']
]) {
  test(`a continuation Bash removes is removed: ${JSON.stringify(source)}`, () => {
    assert.deepEqual(joinContinuations({ source }), { split: false, text })
  })
}

for (const source of [
  "rg -n 'a\\\nb' apps/web/src",
  "echo $'a\\\nb'",
  '# a note \\\ntouch apps/x',
  "cat <<'EOF'\nx \\\nEOF\ntouch apps/x",
  'rg -n "$(echo \'a\\\nb\')" apps/web/src',
  'echo \\\\'
]) {
  test(`a continuation Bash keeps is kept: ${JSON.stringify(source)}`, () => {
    assert.deepEqual(joinContinuations({ source }), {
      split: false,
      text: source
    })
  })
}

for (const source of [
  'echo $(\\\n(1 + 2))',
  "echo $\\\n'a'",
  'cat <\\\n<EOF\nx\nEOF',
  'echo $(( 1 + $\\\n(touch apps/x; printf 0) ))',
  'echo "$\\\n(touch apps/x)"',
  // Quotes start over inside a substitution, even one inside double quotes.
  'echo "$(echo "\'$\\\n(touch apps/x)")"',
  'echo "`echo "\'$\\\n(touch apps/x)"`"',
  'echo "$\\\n(echo "\'$\\\n(touch apps/x)")"'
]) {
  test(`a continuation that splits an opener is flagged: ${JSON.stringify(source)}`, () => {
    assert.equal(joinContinuations({ source }).split, true)
  })
}

test('a long run of continuations is joined in well under a second', () => {
  const source = `echo ${'a\\\n'.repeat(5000)}`
  const start = performance.now()
  assert.equal(
    joinContinuations({ source }).text.length,
    'echo '.length + 5000
  )
  assert.ok(performance.now() - start < 1000)
})
