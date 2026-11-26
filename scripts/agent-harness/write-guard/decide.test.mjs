#!/usr/bin/env node
// ---------------------------------------------------------------------------
// decide — the write guard's decision for the file tools, cell by cell of
// the decision table in docs/harness.md § 3f, plus the errors, the tools
// it leaves alone, and the verifier's
// probes of the per-tool path key and of a planted .git. The policy, the
// agent context and the host are synthetic (decide.fixtures.mjs), so no
// case reads the disk. decide.paths.test.mjs holds the path cases.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/decide.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  AGENT_CONTEXT,
  decisionOf,
  HOST,
  POLICY,
  REPO,
  SCRATCH,
  verdict
} from './decide.fixtures.mjs'
import { decide, FILE_TOOLS, SHELL_TOOLS } from './decide.mjs'

// The target of each column of the table.
const TARGETS = {
  otherRepository: 'src\\a.ts',
  outside: 'C:\\Users\\me\\notes.txt',
  ruleFile: 'AGENTS.md',
  ruleFileInSurface: '.claude/skills/e2e/SKILL.md',
  scratch: `${SCRATCH}\\probe\\a.log`,
  sink: '/dev/null',
  surface: 'docs/qa/traceability.md'
}

// Each actor's row: the decision for each target, "—" for nothing printed.
const TABLE = [
  {
    actor: 'a read-only agent',
    agent: 'validator',
    row: {
      otherRepository: 'deny',
      outside: 'deny',
      ruleFile: 'deny',
      scratch: '—',
      sink: '—'
    }
  },
  {
    actor: 'a surface agent',
    agent: 'e2e-author',
    row: {
      otherRepository: 'deny',
      outside: 'deny',
      ruleFile: 'ask',
      ruleFileInSurface: 'ask',
      scratch: '—',
      sink: '—',
      surface: '—'
    }
  },
  {
    actor: 'a writer',
    agent: 'sdd-steward',
    row: {
      otherRepository: '—',
      outside: '—',
      ruleFile: 'ask',
      scratch: '—',
      sink: '—'
    }
  },
  {
    actor: 'the main session',
    agent: undefined,
    row: {
      otherRepository: '—',
      outside: '—',
      ruleFile: 'ask',
      scratch: '—',
      sink: '—'
    }
  },
  {
    actor: 'an unlisted agent',
    agent: 'general-purpose',
    row: {
      otherRepository: '—',
      outside: '—',
      ruleFile: 'ask',
      scratch: '—',
      sink: '—'
    }
  }
]

for (const { actor, agent, row } of TABLE) {
  for (const [column, expected] of Object.entries(row)) {
    for (const tool of FILE_TOOLS) {
      test(`${tool} by ${actor} to ${column}: ${expected}`, () => {
        assert.equal(
          decisionOf({ agent, filePath: TARGETS[column], tool }),
          expected
        )
      })
    }
  }
}

test('the file tools are Edit, Write and NotebookEdit', () => {
  assert.deepEqual([...FILE_TOOLS].sort(), [
    'Edit',
    'NotebookEdit',
    'Write'
  ])
})

// -- the reasons ---------------------------------------------------------------
test('an ask names the rule, the file, the LAW and how to proceed', () => {
  const { reason } = verdict({ filePath: 'AGENTS.md' })
  assert.match(reason, /`AGENTS\.md`/)
  assert.match(reason, /the LAWs and the router/)
  assert.match(reason, /\.agents\/contracts\/write-guard\.json/)
  assert.match(reason, /"A rule is not edited to fit the work"/)
  assert.match(reason, /Approve only if the owner asked/)
})

test('a read-only deny of a rule file cites the LAW and says to report the change', () => {
  const { reason } = verdict({ agent: 'validator', filePath: 'AGENTS.md' })
  assert.match(reason, /validator is read-only/)
  assert.match(reason, /"A rule is not edited to fit the work"/)
  assert.match(reason, /report the change for the caller to make/i)
})

test('a read-only deny names the agent, the file and the scratch alternative', () => {
  const { reason } = verdict({ agent: 'validator', filePath: 'src\\a.ts' })
  assert.match(reason, /validator is read-only/)
  assert.match(reason, /writes: false in \.agents\/agent-context\.json/)
  assert.match(reason, /src\\a\.ts/)
  assert.match(reason, /inside the repository/)
  assert.match(reason, /mktemp -d/)
})

test('a read-only deny outside the repository says so', () => {
  const { reason } = verdict({
    agent: 'validator',
    filePath: TARGETS.outside
  })
  assert.match(reason, /outside the repository and the OS temp dir/)
})

// -- errors -----------------------------------------------------------------------
for (const [agent, expected] of [
  ['validator', 'deny'],
  ['e2e-author', 'deny'],
  ['sdd-steward', 'ask'],
  ['general-purpose', 'ask'],
  [undefined, 'ask']
]) {
  test(`an internal error is ${expected} for ${agent ?? 'the main session'}`, () => {
    const found = verdict({ agent, cwd: 5, filePath: 'src/a.ts' })
    assert.equal(found?.decision, expected)
    assert.match(found.reason, /could not judge/)
    assert.match(
      found.reason,
      /"disableAllHooks": true in the git-ignored \.claude\/settings\.local\.json/
    )
  })
}

test('an unreadable policy asks the main session and refuses a read-only agent', () => {
  const policy = new Error(
    '.agents/contracts/write-guard.json does not parse'
  )
  assert.equal(decisionOf({ filePath: 'docs/a.md', policy }), 'ask')
  assert.equal(
    decisionOf({ agent: 'validator', filePath: TARGETS.scratch, policy }),
    'deny'
  )
  assert.match(
    verdict({ filePath: 'docs/a.md', policy }).reason,
    /write-guard\.json does not parse/
  )
})

test('an unreadable agent context refuses every subagent, an unlisted one included', () => {
  const agentContext = new Error(
    '.agents/agent-context.json does not parse'
  )
  assert.equal(
    decisionOf({
      agent: 'general-purpose',
      agentContext,
      filePath: 'docs/a.md'
    }),
    'deny'
  )
})

test('an unreadable agent context leaves the main session as it was', () => {
  const agentContext = new Error(
    '.agents/agent-context.json does not parse'
  )
  assert.equal(decisionOf({ agentContext, filePath: 'docs/a.md' }), '—')
  assert.equal(decisionOf({ agentContext, filePath: 'AGENTS.md' }), 'ask')
})

test('a file tool that names no path is an error', () => {
  const payload = {
    agent_type: 'validator',
    cwd: REPO,
    tool_input: {},
    tool_name: 'Write'
  }
  const found = decide({
    agentContext: AGENT_CONTEXT,
    host: HOST,
    payload,
    policy: POLICY
  })
  assert.equal(found?.decision, 'deny')
  assert.match(found.reason, /names no file path/)
})

// -- what the guard leaves alone ---------------------------------------------------
// Bash and PowerShell have suites of their own: decide.bash*.test.mjs and
// decide.shell.test.mjs.
test('the shell tools are Bash and PowerShell, and both are judged', () => {
  assert.deepEqual([...SHELL_TOOLS].sort(), ['Bash', 'PowerShell'])
  for (const tool of SHELL_TOOLS) {
    const found = decide({
      agentContext: AGENT_CONTEXT,
      host: HOST,
      payload: {
        agent_type: 'validator',
        cwd: REPO,
        tool_input: { command: 'echo x > AGENTS.md' },
        tool_name: tool
      },
      policy: POLICY
    })
    assert.equal(found?.decision, 'deny', tool)
  }
})

for (const payload of [
  null,
  'a string',
  { agent_type: 'validator', tool_input: { file_path: 'src/a.ts' } },
  { tool_input: { file_path: 'AGENTS.md' }, tool_name: 'Read' }
]) {
  test(`a payload with no file tool is left alone: ${JSON.stringify(payload)}`, () => {
    assert.equal(
      decide({
        agentContext: AGENT_CONTEXT,
        host: HOST,
        payload,
        policy: POLICY
      }),
      undefined
    )
  })
}

// -- spellings Windows reads as another path (verifier probes 1, 2, 4) --------
const OTHER_SPELLINGS = [
  '\\\\?\\C:\\work\\repo\\AGENTS.md',
  '\\\\.\\C:\\work\\repo\\AGENTS.md',
  '\\\\?\\UNC\\localhost\\C$\\work\\repo\\AGENTS.md',
  '\\\\localhost\\C$\\work\\repo\\AGENTS.md',
  'C:\\work\\repo\\AGENTS.md::$DATA',
  'C:\\work\\repo\\.agents\\contracts::$INDEX_ALLOCATION\\write-guard.json',
  'C:AGENTS.md'
]

test('Given a device, UNC, stream or drive-relative spelling of a rule file, when the main session writes it, then the guard asks', () => {
  for (const filePath of OTHER_SPELLINGS) {
    assert.equal(decisionOf({ filePath }), 'ask', filePath)
  }
})

test('every such spelling asks a writer and refuses a read-only agent', () => {
  for (const filePath of OTHER_SPELLINGS) {
    assert.equal(decisionOf({ agent: 'sdd-steward', filePath }), 'ask')
    assert.equal(decisionOf({ agent: 'validator', filePath }), 'deny')
  }
})

const PLANTED = {
  ...HOST,
  isCheckout: ({ dir }) =>
    ['c:/work/repo', 'c:/work/repo/.agents'].includes(dir.toLowerCase())
}

test('Given a .git planted inside a checkout, when the main session writes a rule file below it, then the guard still asks', () => {
  assert.equal(
    decisionOf({
      filePath: 'C:\\work\\repo\\.agents\\contracts\\write-guard.json',
      host: PLANTED
    }),
    'ask'
  )
})

test('Given NotebookEdit with a stray file_path, when its notebook_path is a rule file, then the guard asks', () => {
  const found = decide({
    agentContext: AGENT_CONTEXT,
    host: HOST,
    payload: {
      cwd: REPO,
      tool_input: { file_path: 'docs\\x.md', notebook_path: 'AGENTS.md' },
      tool_name: 'NotebookEdit'
    },
    policy: POLICY
  })
  assert.equal(found?.decision, 'ask')
})

test('Write and Edit read file_path, and a stray notebook_path changes nothing', () => {
  for (const tool of ['Edit', 'Write']) {
    const input = { file_path: 'docs\\x.md', notebook_path: 'AGENTS.md' }
    assert.equal(
      decide({
        agentContext: AGENT_CONTEXT,
        host: HOST,
        payload: { cwd: REPO, tool_input: input, tool_name: tool },
        policy: POLICY
      }),
      undefined
    )
    const found = decide({
      agentContext: AGENT_CONTEXT,
      host: HOST,
      payload: {
        cwd: REPO,
        tool_input: { notebook_path: 'AGENTS.md' },
        tool_name: tool
      },
      policy: POLICY
    })
    assert.match(found?.reason ?? '', /names no file path/)
  }
})

test('no cell of the table ever allows', () => {
  const decisions = TABLE.flatMap(({ agent, row }) =>
    Object.keys(row).flatMap((column) =>
      FILE_TOOLS.map((tool) =>
        verdict({ agent, filePath: TARGETS[column], tool })
      )
    )
  )
  assert.deepEqual(
    decisions.filter(
      (found) =>
        found !== undefined && !['ask', 'deny'].includes(found.decision)
    ),
    []
  )
})
