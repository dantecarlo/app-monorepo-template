// ---------------------------------------------------------------------------
// decide.fixtures — the synthetic policy, agent context and host the decide
// suites share, and the helpers that build a payload and read its verdict.
// ---------------------------------------------------------------------------

import { decide } from './decide.mjs'

export const REPO = 'C:\\work\\repo'
export const SCRATCH = 'C:\\Users\\me\\AppData\\Local\\Temp'

export const POLICY = {
  ruleFiles: [
    { glob: 'AGENTS.md', what: 'the LAWs and the router' },
    { glob: '.claude/skills/**', what: 'a skill' },
    { glob: 'scripts/verify-*', what: 'a gate' },
    { glob: '.agents/contracts/**', what: 'a contract' },
    { glob: 'template.manifest.json', what: 'the manifest' },
    { glob: '.claude/settings*.json', what: 'the hook wiring' },
    { glob: '~/.claude/settings.json', what: 'the user-level settings' }
  ]
}

export const AGENT_CONTEXT = {
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

export const HOST = {
  isCheckout: ({ dir }) =>
    ['c:/work/repo', 'c:/users/me/appdata/local/temp/clone'].includes(
      dir.toLowerCase()
    ),
  ownRoot: REPO,
  scratchRoots: [SCRATCH, '/tmp'],
  windows: true
}

export const payloadFor = ({
  agent,
  cwd = REPO,
  filePath,
  tool = 'Write'
}) => ({
  ...(agent === undefined ? {} : { agent_type: agent }),
  cwd,
  tool_input:
    tool === 'NotebookEdit'
      ? { new_source: 'x', notebook_path: filePath }
      : { content: 'x', file_path: filePath },
  tool_name: tool
})

export const verdict = ({
  agent,
  agentContext = AGENT_CONTEXT,
  cwd,
  filePath,
  host = HOST,
  policy = POLICY,
  tool
}) =>
  decide({
    agentContext,
    host,
    payload: payloadFor({ agent, cwd, filePath, tool }),
    policy
  })

export const decisionOf = (input) => verdict(input)?.decision ?? '—'
