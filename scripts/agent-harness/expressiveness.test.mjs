#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Every adapter accounts for every field of the closed schema: a field it
// claims to carry reaches its output, a field it declares unexpressible is
// absent and says why, and the model reaches a non-Claude target only through
// MODEL_MAP, which ships empty.
//
// Ported from Certifipago's scripts/agent-harness/expressiveness.test.mjs.
//
// Usage:
//   node --test scripts/agent-harness/expressiveness.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  EXPRESSIVENESS,
  MODEL_MAP,
  renderCodexAgent,
  renderCopilotAgent,
  renderOpenCodeAgent
} from './adapters.mjs'
import { renderClaudeAgent } from './claude-projection.mjs'

const FIELDS = {
  description: 'A read-only reviewer that never edits files.',
  model: 'fable',
  name: 'probe',
  tools: 'Read, Grep, Glob, Bash'
}

// Claude passes the neutral frontmatter through verbatim, so its input is the
// text rather than the parsed fields.
const FRONTMATTER = `${Object.entries(FIELDS)
  .map(([field, value]) => `${field}: ${value}`)
  .join('\n')}\n`

const RENDERED = {
  claude: renderClaudeAgent({
    body: 'body',
    frontmatterText: FRONTMATTER
  }),
  codex: renderCodexAgent({ body: 'body', fields: FIELDS, name: 'probe' }),
  copilot: renderCopilotAgent({
    body: 'body',
    fields: FIELDS,
    name: 'probe'
  }),
  opencode: renderOpenCodeAgent({ body: 'body', fields: FIELDS })
}

const carries = ({ field, text }) =>
  new RegExp(`^\\s*${field}\\s*[:=]`, 'm').test(text)

test('every adapter declares what it carries and what it cannot', () => {
  const declared = Object.keys(EXPRESSIVENESS).sort()

  assert.deepEqual(declared, ['claude', 'codex', 'copilot', 'opencode'])
  declared.forEach((adapter) => {
    const spec = EXPRESSIVENESS[adapter]
    assert.ok(Array.isArray(spec.supported), `${adapter}: supported`)
    Object.entries(spec.unexpressible ?? {}).forEach(([field, reason]) => {
      assert.ok(
        typeof reason === 'string' && reason.length > 0,
        `${adapter}: unexpressible ${field} declares no reason`
      )
    })
  })
})

test('a field an adapter claims to support REACHES its output', () => {
  Object.entries(EXPRESSIVENESS).forEach(([adapter, spec]) => {
    spec.supported.forEach((field) => {
      assert.ok(
        carries({ field, text: RENDERED[adapter] }),
        `${adapter} claims to support \`${field}\` and does not render it`
      )
    })
  })
})

// A Claude model alias means nothing to Codex, which refuses an unknown model
// instead of falling back. Outside Claude the alias renders only through a
// mapping, and an unmapped one is left out so the agent runs on the model of
// the session that spawned it.
const FOREIGN_RENDERERS = {
  codex: ({ models }) =>
    renderCodexAgent({
      body: 'body',
      fields: FIELDS,
      models,
      name: 'probe'
    }),
  copilot: ({ models }) =>
    renderCopilotAgent({
      body: 'body',
      fields: FIELDS,
      models,
      name: 'probe'
    }),
  opencode: ({ models }) =>
    renderOpenCodeAgent({ body: 'body', fields: FIELDS, models })
}

test('every foreign adapter declares the model as mapped, with its reason', () => {
  Object.keys(FOREIGN_RENDERERS).forEach((adapter) => {
    const reason = EXPRESSIVENESS[adapter].mapped?.model
    assert.ok(
      typeof reason === 'string' && reason.length > 0,
      `${adapter}: the model must be declared mapped, with a reason`
    )
    assert.equal(
      EXPRESSIVENESS[adapter].supported.includes('model'),
      false,
      `${adapter}: a mapped model is not passed through as supported`
    )
  })
})

test('an unmapped Claude alias never reaches a foreign target', () => {
  Object.entries(FOREIGN_RENDERERS).forEach(([adapter, render]) => {
    assert.equal(
      carries({ field: 'model', text: render({ models: {} }) }),
      false,
      `${adapter} rendered the unmapped alias \`${FIELDS.model}\``
    )
  })
})

test('the shipped map carries no alias, so every foreign agent inherits its session model', () => {
  Object.entries(FOREIGN_RENDERERS).forEach(([adapter, render]) => {
    assert.deepEqual(MODEL_MAP[adapter], {}, `${adapter}: MODEL_MAP`)
    assert.equal(
      carries({
        field: 'model',
        text: render({ models: MODEL_MAP[adapter] })
      }),
      false,
      `${adapter} rendered a model from the shipped map`
    )
  })
})

test('a mapped alias renders as the target’s own model id', () => {
  Object.entries(FOREIGN_RENDERERS).forEach(([adapter, render]) => {
    assert.match(
      render({ models: { [FIELDS.model]: 'target-model-id' } }),
      /^\s*model\s*[:=]\s*"?target-model-id"?\s*$/m,
      `${adapter} did not render the mapped id`
    )
  })
})

test('a field declared unexpressible is absent from the output', () => {
  Object.entries(EXPRESSIVENESS).forEach(([adapter, spec]) => {
    Object.keys(spec.unexpressible ?? {}).forEach((field) => {
      assert.equal(
        carries({ field, text: RENDERED[adapter] }),
        false,
        `${adapter} declares \`${field}\` unexpressible yet renders it`
      )
    })
  })
})

test('every canonical field is either carried or declared missing', () => {
  Object.entries(EXPRESSIVENESS).forEach(([adapter, spec]) => {
    const accounted = [
      ...spec.supported,
      ...Object.keys(spec.mapped ?? {}),
      ...Object.keys(spec.unexpressible ?? {})
    ].sort()

    assert.deepEqual(
      accounted,
      Object.keys(FIELDS).sort(),
      `${adapter} leaves a canonical field unaccounted for`
    )
  })
})

// Codex's per-agent TOML has no slot for a tool list.
test('codex declares that it cannot restrict tools', () => {
  const reason = EXPRESSIVENESS.codex.unexpressible?.tools

  assert.ok(reason, 'codex must declare `tools` as unexpressible')
  assert.match(reason, /tool/i)
})

test('opencode declares that the filename carries the name', () => {
  assert.ok(EXPRESSIVENESS.opencode.unexpressible?.name)
})
