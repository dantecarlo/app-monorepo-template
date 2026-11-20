#!/usr/bin/env node
// ---------------------------------------------------------------------------
// decide — the write guard's decision for the file tools, cell by cell of
// the decision table in docs/harness.md § 3f, plus the errors, the
// switch-off variable and the tools this slice does not judge. The policy,
// the agent context and the host are synthetic, so no case reads the disk.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/decide.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { decide, FILE_TOOLS, UNJUDGED_TOOLS } from './decide.mjs'

const REPO = 'C:\\work\\repo'
const SCRATCH = 'C:\\Users\\me\\AppData\\Local\\Temp'

const POLICY = {
  ruleFiles: [
    { glob: 'AGENTS.md', what: 'the LAWs and the router' },
    { glob: '.claude/skills/**', what: 'a skill' },
    { glob: 'scripts/verify-*', what: 'a gate' }
  ],
  switchOff: { value: 'off', variable: 'ATL_WRITE_GUARD' }
}

const AGENT_CONTEXT = {
  agents: {
    'e2e-author': {
      surface: [
        'apps/mobile/.maestro/',
        'docs/qa/',
        '.claude/skills/e2e/'
      ],
      writes: true
    },
    'sdd-steward': { writes: true },
    validator: { writes: false }
  }
}

const HOST = {
  env: {},
  isCheckout: ({ dir }) =>
    ['c:/work/repo', 'c:/users/me/appdata/local/temp/clone'].includes(
      dir.toLowerCase()
    ),
  ownRoot: REPO,
  scratchRoots: [SCRATCH, '/tmp'],
  windows: true
}

const payloadFor = ({ agent, cwd = REPO, filePath, tool = 'Write' }) => ({
  ...(agent === undefined ? {} : { agent_type: agent }),
  cwd,
  tool_input:
    tool === 'NotebookEdit'
      ? { new_source: 'x', notebook_path: filePath }
      : { content: 'x', file_path: filePath },
  tool_name: tool
})

const verdict = ({
  agent,
  agentContext = AGENT_CONTEXT,
  cwd,
  env = {},
  filePath,
  policy = POLICY,
  tool
}) =>
  decide({
    agentContext,
    host: { ...HOST, env },
    payload: payloadFor({ agent, cwd, filePath, tool }),
    policy
  })

const decisionOf = (input) => verdict(input)?.decision ?? '—'

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

// -- the surface, ported from Certifipago's guard ------------------------------
for (const filePath of [
  'apps/mobile/.maestro/flows/login.yaml',
  'docs/qa/traceability.md',
  `${REPO}\\apps\\mobile\\.maestro\\a.yaml`,
  `${SCRATCH}\\shot.png`
]) {
  test(`e2e-author may write ${filePath}`, () => {
    assert.equal(verdict({ agent: 'e2e-author', filePath }), undefined)
  })
}

for (const filePath of [
  'apps/web/src/a.ts',
  'apps/mobile/.maestro/../src/a.ts',
  'docs/qa-other/a.md'
]) {
  test(`e2e-author may not write ${filePath}`, () => {
    const found = verdict({ agent: 'e2e-author', filePath })
    assert.equal(found?.decision, 'deny')
    assert.match(found.reason, /e2e-author/)
    assert.match(found.reason, /apps\/mobile\/\.maestro\//)
    assert.match(found.reason, /docs\/qa\//)
  })
}

// -- path spellings --------------------------------------------------------------
for (const filePath of [
  'C:\\work\\repo\\AGENTS.md',
  'c:/work/repo/AGENTS.md',
  '/c/work/repo/AGENTS.md',
  'C:\\WORK\\Repo\\agents.md',
  'docs/../AGENTS.md',
  'C:\\work\\repo\\docs\\..\\AGENTS.md'
]) {
  test(`the main session is asked before any spelling of a rule file: ${filePath}`, () => {
    assert.equal(decisionOf({ filePath }), 'ask')
  })
}

test('a scratch path that walks back out is refused for a read-only agent', () => {
  assert.equal(
    decisionOf({
      agent: 'validator',
      filePath: `${SCRATCH}\\..\\..\\a.ts`
    }),
    'deny'
  )
})

test('a write into a repository that lives under a scratch root is refused', () => {
  assert.equal(
    decisionOf({
      agent: 'validator',
      cwd: `${SCRATCH}\\clone`,
      filePath: 'apps/web/src/probe.txt'
    }),
    'deny'
  )
})

test('a rule file of a repository under a scratch root still asks the main session', () => {
  assert.equal(
    decisionOf({ cwd: `${SCRATCH}\\clone`, filePath: 'AGENTS.md' }),
    'ask'
  )
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
    assert.match(found.reason, /ATL_WRITE_GUARD=off/)
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
test('ATL_WRITE_GUARD=off silences every verdict', () => {
  const env = { ATL_WRITE_GUARD: 'off' }
  assert.equal(verdict({ env, filePath: 'AGENTS.md' }), undefined)
  assert.equal(
    verdict({ agent: 'validator', env, filePath: 'src/a.ts' }),
    undefined
  )
  assert.equal(
    verdict({
      agent: 'validator',
      cwd: 5,
      env,
      filePath: 'src/a.ts',
      policy: new Error('unreadable')
    }),
    undefined
  )
})

for (const tool of UNJUDGED_TOOLS) {
  test(`${tool} is not judged in this slice, for any actor`, () => {
    for (const agent of ['validator', 'e2e-author', undefined]) {
      assert.equal(
        decide({
          agentContext: AGENT_CONTEXT,
          host: HOST,
          payload: {
            ...(agent === undefined ? {} : { agent_type: agent }),
            cwd: REPO,
            tool_input: { command: 'echo x > AGENTS.md' },
            tool_name: tool
          },
          policy: POLICY
        }),
        undefined
      )
    }
  })
}

test('the tools left to a later slice are Bash and PowerShell', () => {
  assert.deepEqual([...UNJUDGED_TOOLS].sort(), ['Bash', 'PowerShell'])
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
