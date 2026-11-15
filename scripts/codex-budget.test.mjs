#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Codex loads at most `project_doc_max_bytes` of the project's AGENTS.md
// files and drops the rest without a word; its default is 32 KiB.
// .codex/config.toml, which `pnpm agent-harness:generate` writes from
// scripts/agent-harness/adapters.mjs, raises that budget, and these tests
// hold both ends of it: the key sits at the top level of the file, before
// any table header, since a key written after one belongs to that table;
// and AGENTS.md, counted with CRLF line endings as a Windows checkout holds
// it, fits.
//
// Usage:
//   node --test scripts/codex-budget.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CONFIG_PATH = join(REPO_ROOT, '.codex', 'config.toml')
const ROUTER_PATH = join(REPO_ROOT, 'AGENTS.md')

const BUDGET_KEY = /^project_doc_max_bytes\s*=\s*(?<bytes>\d+)\s*$/u
const TABLE_HEADER = /^\s*\[/u
const LINE_END = /\r?\n/gu
const CRLF = '\r\n'
const NOT_FOUND = -1

const SAMPLE_BUDGET = 100
const SAMPLE_LINE = 'x\n'

const readBudget = ({ text }) => {
  const lines = text.split(LINE_END)
  const keyLine = lines.findIndex((line) => BUDGET_KEY.test(line))
  const tableLine = lines.findIndex((line) => TABLE_HEADER.test(line))
  return {
    bytes:
      keyLine === NOT_FOUND
        ? null
        : Number(lines[keyLine].match(BUDGET_KEY).groups.bytes),
    keyLine,
    tableLine
  }
}

const crlfBytes = ({ text }) =>
  Buffer.byteLength(text.replace(LINE_END, CRLF))

test('the Codex config sets the project-doc budget before any table header', () => {
  const { bytes, keyLine, tableLine } = readBudget({
    text: readFileSync(CONFIG_PATH, 'utf8')
  })

  assert.ok(
    bytes !== null,
    '.codex/config.toml sets no project_doc_max_bytes, so Codex loads ' +
      'only its 32 KiB default of AGENTS.md'
  )
  assert.ok(
    tableLine === NOT_FOUND || keyLine < tableLine,
    'a key written after a table header belongs to that table, not the ' +
      'top level'
  )
})

test('AGENTS.md fits the Codex project-doc budget, with CRLF line endings', () => {
  const { bytes: budget } = readBudget({
    text: readFileSync(CONFIG_PATH, 'utf8')
  })
  const bytes = crlfBytes({ text: readFileSync(ROUTER_PATH, 'utf8') })

  assert.ok(
    bytes <= budget,
    `AGENTS.md is ${bytes} bytes with CRLF endings; Codex loads only the ` +
      `first ${budget} and drops the rest`
  )
})

test('every line ending counts as CRLF, once', () => {
  const text = SAMPLE_LINE.repeat(SAMPLE_BUDGET / SAMPLE_LINE.length)

  assert.equal(Buffer.byteLength(text), SAMPLE_BUDGET)
  assert.ok(
    crlfBytes({ text }) > SAMPLE_BUDGET,
    'a file that fits with LF endings and not with CRLF passed'
  )
  assert.equal(
    crlfBytes({ text: text.replace(LINE_END, CRLF) }),
    crlfBytes({ text })
  )
})
