// ---------------------------------------------------------------------------
// adapters — the projections whose format differs from Claude Code's:
// OpenCode (`.opencode/agents/<name>.md` and `opencode.json`), Codex
// (`.codex/agents/<name>.toml` and `.codex/config.toml`) and Copilot
// (`.github/agents/<name>.agent.md`).
//
// Ported from Certifipago's scripts/agent-harness/adapters.mjs, with four
// changes: the prelude points at AGENTS.md, which every runtime reads;
// opencode.json names no instruction file, since OpenCode discovers AGENTS.md
// itself; a YAML description is written as a double-quoted string; and the
// Codex prompt escapes what a TOML multi-line string would otherwise end on.
// ---------------------------------------------------------------------------

import { readNeutralAgents } from './neutral-source.mjs'

const NEUTRAL_AGENTS_DIRECTORY = '.agents/agents'
const SHARED_CONTEXT = 'AGENTS.md'
const JSON_INDENT = 2

// Every adapter maps the SAME closed schema. A field is either CARRIED into
// the output or DECLARED unexpressible with its reason; one that is neither
// fails naming `adapter + field`. A silently dropped field leaves output that
// still parses.
//
// Field VALUES pass through unmapped, with one exception: tool names (`Read`,
// `Grep`) stay Claude vocabulary in every target, and a tool that cannot
// resolve one falls back to its own defaults. This asserts a field has a slot
// in the target, never that its value means anything there.
//
// The exception is the MODEL. A neutral `model` is a Claude Code alias
// (`sonnet`, `fable`), and Codex does not fall back on one it does not know.
// Outside Claude the alias renders only through `MODEL_MAP`, and an alias with
// no entry is LEFT OUT, so the agent runs on the model of the session that
// spawned it.

const MAPPED_MODEL =
  'A Claude Code model alias means nothing here and is not passed through: ' +
  'it renders only through MODEL_MAP, and an unmapped alias is left out so ' +
  'the agent runs on the model of the session that spawned it.'

// The target's own model id for each Claude alias. Empty on purpose: an
// entry is added only for an id that target accepts, verified against it.
export const MODEL_MAP = {
  codex: {},
  copilot: {},
  opencode: {}
}

const mappedModel = ({ model, models }) =>
  typeof model === 'string' && Object.hasOwn(models, model)
    ? models[model]
    : null

/**
 * What each target CARRIES, and what it cannot.
 *
 * `supported` is the field reaching the rendered output. `unexpressible` is a
 * field the neutral source may declare and this target has no slot for; each
 * carries the reason.
 */
export const EXPRESSIVENESS = {
  claude: {
    supported: ['description', 'model', 'name', 'tools'],
    unexpressible: {}
  },
  codex: {
    mapped: { model: MAPPED_MODEL },
    supported: ['description', 'name'],
    unexpressible: {
      tools:
        'Codex has no per-agent tool allowlist; its TOML carries name, ' +
        'description and developer_instructions only. An agent declared ' +
        'read-only is unrestricted here, held by its prompt alone.'
    }
  },
  copilot: {
    mapped: { model: MAPPED_MODEL },
    supported: ['description', 'name', 'tools'],
    unexpressible: {}
  },
  opencode: {
    mapped: { model: MAPPED_MODEL },
    supported: ['description', 'tools'],
    unexpressible: {
      name: 'the agent file name is the identity; a name key would be a second spelling'
    }
  }
}

const assertMappable = ({ adapter, fields, supported }) => {
  const declared = [
    ...supported,
    ...Object.keys(EXPRESSIVENESS[adapter]?.mapped ?? {}),
    ...Object.keys(EXPRESSIVENESS[adapter]?.unexpressible ?? {})
  ]
  const unmapped = Object.keys(fields)
    .filter((field) => !declared.includes(field))
    .sort()

  if (unmapped.length > 0) {
    throw new Error(
      `adapter=${adapter} field=${unmapped.join(',')} has no mapping in ` +
        'this target. Map it, or declare the target cannot express it — ' +
        'never render without it.'
    )
  }
}

const toolList = ({ tools }) =>
  tools
    .split(',')
    .map((tool) => tool.trim())
    .filter(Boolean)

// A plain YAML scalar cannot hold ": " or open with a quote, so a description
// such as "Read-only: never edits files." would make the whole frontmatter
// fail to parse. A JSON string is a valid YAML double-quoted scalar.
const yamlString = ({ value }) => JSON.stringify(value)

// Every prelude names the shared context by its exact path, so a target that
// loads an agent without it still sends the model to the project's rules.
const preludeFor = ({ body }) =>
  `Read \`${SHARED_CONTEXT}\` before anything else.\n\n${body}`

// The model line, or nothing when the alias has no mapping in this target.
const modelLines = ({ format, model, models }) => {
  const id = mappedModel({ model, models })
  return id === null ? [] : [format({ id })]
}

// OpenCode keys its agents by FILENAME, so the name is not a frontmatter
// field here the way it is for Codex and Copilot.
export const renderOpenCodeAgent = ({
  body,
  fields,
  models = MODEL_MAP.opencode
}) => {
  assertMappable({
    adapter: 'opencode',
    fields,
    supported: EXPRESSIVENESS.opencode.supported
  })
  return [
    '---',
    `description: ${yamlString({ value: fields.description })}`,
    'mode: subagent',
    ...modelLines({
      format: ({ id }) => `model: ${id}`,
      model: fields.model,
      models
    }),
    'tools:',
    ...toolList({ tools: fields.tools }).map((tool) => `  ${tool}: true`),
    '---',
    '',
    preludeFor({ body: body.trim() }),
    ''
  ].join('\n')
}

// No `instructions` entry: OpenCode loads the AGENTS.md it discovers, and the
// configured instructions load alongside it, so naming AGENTS.md there would
// add it a second time.
export const renderOpenCodeConfig = ({
  agents,
  models = MODEL_MAP.opencode
}) =>
  `${JSON.stringify(
    {
      $schema: 'https://opencode.ai/config.json',
      agent: Object.fromEntries(
        agents.map(({ fields, name }) => {
          const id = mappedModel({ model: fields.model, models })
          return [
            name,
            id === null
              ? { mode: 'subagent' }
              : { mode: 'subagent', model: id }
          ]
        })
      )
    },
    null,
    JSON_INDENT
  )}\n`

// TOML, hand-rendered: the only values that reach it are a name, a model and a
// prompt, and adding a serializer dependency to write three keys would put a
// package inside the trust boundary this harness is trying to shrink.
const tomlString = ({ value }) =>
  `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`

// Inside a multi-line basic string a backslash starts an escape and `"""`
// ends the string, so both are escaped; every other character stays as it is.
const tomlMultilineText = ({ value }) =>
  value.replaceAll('\\', '\\\\').replaceAll('"""', '""\\"')

// Codex resolves `config_file` against CODEX_HOME, which is this directory. A
// repo-relative value lands one level too deep, and the role is then dropped
// with a warning on a ZERO exit. The registered value and the projection
// destination both come from `codexAgentFile`, so the two cannot disagree:
// the destination carries the prefix, the registration does not.
const CODEX_HOME = '.codex'

const codexAgentFile = ({ name }) => `agents/${name}.toml`

export const renderCodexAgent = ({
  body,
  fields,
  models = MODEL_MAP.codex,
  name
}) => {
  assertMappable({
    adapter: 'codex',
    fields,
    supported: EXPRESSIVENESS.codex.supported
  })
  return [
    `name = ${tomlString({ value: name })}`,
    ...modelLines({
      format: ({ id }) => `model = ${tomlString({ value: id })}`,
      model: fields.model,
      models
    }),
    `description = ${tomlString({ value: fields.description })}`,
    'developer_instructions = """',
    tomlMultilineText({ value: preludeFor({ body: body.trim() }) }),
    '"""',
    ''
  ].join('\n')
}

// The bytes of project AGENTS.md files Codex loads (`project_doc_max_bytes`).
// Past them it truncates; its default is 32 KiB.
export const CODEX_PROJECT_DOC_MAX_BYTES = 65_536

// Repository-local only. A generated file under the developer's home
// directory would configure the machine rather than this checkout, and
// nothing in the repository could then show what an agent actually ran with.
//
// `[agents]` carries `max_depth` and `max_threads` plus one SUB-TABLE per
// agent, keyed by the agent's name and holding `description` and
// `config_file`. Codex reads every other key under `[agents]` as an agent of
// that name, so an array-of-tables named `role` deserializes as an agent
// called `role` holding a list, and the CLI refuses the whole file.
export const renderCodexConfig = ({ agents }) =>
  [
    '# Generated by pnpm agent-harness:generate from .agents/agents/*.agent.md;',
    '# pnpm agent-harness:projection-check fails when it is edited by hand.',
    "# Repository-local only: a file under the developer's home directory would",
    '# configure the machine, not this checkout.',
    '',
    "# Codex loads at most this many bytes of the project's AGENTS.md files and",
    '# drops the rest without a word (its default is 32 KiB). Keep this key above',
    '# every table header: a key written after one belongs to that table.',
    '# `pnpm codex-budget:test` fails when AGENTS.md, counted with CRLF line',
    '# endings, outgrows it.',
    `project_doc_max_bytes = ${CODEX_PROJECT_DOC_MAX_BYTES}`,
    '',
    '[agents]',
    'max_depth = 2',
    'max_threads = 4',
    '',
    ...agents.flatMap(({ fields, name }) => [
      `[agents.${name}]`,
      `description = ${tomlString({ value: fields.description })}`,
      `config_file = ${tomlString({ value: codexAgentFile({ name }) })}`,
      ''
    ])
  ].join('\n')

export const renderCopilotAgent = ({
  body,
  fields,
  models = MODEL_MAP.copilot,
  name
}) => {
  assertMappable({
    adapter: 'copilot',
    fields,
    supported: EXPRESSIVENESS.copilot.supported
  })
  return [
    '---',
    `name: ${name}`,
    `description: ${yamlString({ value: fields.description })}`,
    ...modelLines({
      format: ({ id }) => `model: ${id}`,
      model: fields.model,
      models
    }),
    `tools: [${toolList({ tools: fields.tools }).join(', ')}]`,
    '---',
    '',
    preludeFor({ body: body.trim() }),
    ''
  ].join('\n')
}

export const renderAdapterProjection = ({ root }) => {
  const agents = readNeutralAgents({
    directory: `${root}/${NEUTRAL_AGENTS_DIRECTORY}`
  })

  return new Map([
    ...agents.map((agent) => [
      `.opencode/agents/${agent.name}.md`,
      renderOpenCodeAgent(agent)
    ]),
    ['opencode.json', renderOpenCodeConfig({ agents })],
    ...agents.map((agent) => [
      `${CODEX_HOME}/${codexAgentFile({ name: agent.name })}`,
      renderCodexAgent(agent)
    ]),
    [`${CODEX_HOME}/config.toml`, renderCodexConfig({ agents })],
    ...agents.map((agent) => [
      `.github/agents/${agent.name}.agent.md`,
      renderCopilotAgent(agent)
    ])
  ])
}
