// ---------------------------------------------------------------------------
// decide.shell.fixtures — the synthetic agent context and host the Bash and
// PowerShell suites share, after the CONTEXT of Certifipago's
// enforce-agent-writes test, and the helpers that run one shell command
// through `decide` and read its verdict. The policy is decide.fixtures.mjs's.
// ---------------------------------------------------------------------------

import { POLICY } from './decide.fixtures.mjs'
import { decide } from './decide.mjs'

export const REPO = 'C:\\work\\repo'
export const SCRATCH = 'C:\\Users\\me\\AppData\\Local\\Temp'
export const GIT_BASH_SCRATCH = '/c/Users/me/AppData/Local/Temp'
export const CLONE_IN_SCRATCH = `${SCRATCH}\\verify-clone`
// The `agent` of the main session, which carries no agent_type.
export const MAIN = null

export const AGENT_CONTEXT = {
  agents: {
    'codegraph-explorer': { writes: false },
    'e2e-author': {
      surface: ['apps/mobile/.maestro/', 'docs/qa/'],
      writes: true
    },
    'skill-author': { writes: true },
    validator: { writes: false }
  }
}

export const HOST = {
  env: {},
  homeDir: 'C:\\Users\\me',
  isCheckout: ({ dir }) =>
    [
      'c:/work/repo',
      'c:/work/sibling',
      'c:/users/me/appdata/local/temp/verify-clone'
    ].includes(dir.toLowerCase()),
  ownRoot: REPO,
  scratchRoots: [SCRATCH, '/tmp'],
  windows: true
}

// A synthetic disk under the repository, for the cases that read it: what
// exists, which entries are folders, and what a glob matches there.
const ROOT = 'c:/work/repo'
const FILES = [
  'AGENTS.md',
  'README.md',
  'package.json',
  'template.manifest.json',
  'docs/a.md',
  'docs/log.md',
  'docs/qa/a.md',
  'scripts/env.sh',
  'scripts/manifest.mjs',
  'scripts/verify-maps.mjs',
  'scripts/gate/scratch.mjs',
  '.claude/settings.json',
  '.claude/skills/sdd/SKILL.md',
  'src/a.ts'
].map((path) => `${ROOT}/${path}`)
const DIRS = [
  '',
  '/docs',
  '/docs/qa',
  '/scripts',
  '/scripts/gate',
  '/.claude',
  '/.claude/skills',
  '/.claude/skills/sdd',
  '/src'
].map((path) => `${ROOT}${path}`)
const ENTRIES = [...FILES, ...DIRS]

const lowered = ({ path }) =>
  path.replaceAll('\\', '/').replace(/\/+$/u, '').toLowerCase()

const globRegExp = ({ pattern }) =>
  new RegExp(
    `^${pattern
      .toLowerCase()
      .replace(/[.+^${}()|\\]/gu, '\\$&')
      .replaceAll('*', '[^/]*')
      .replaceAll('?', '[^/]')}$`,
    'u'
  )

export const ON_DISK = {
  ...HOST,
  exists: ({ path }) =>
    ENTRIES.some((entry) => entry.toLowerCase() === lowered({ path })),
  glob: ({ cwd, pattern }) => {
    const absolute = /^(?:[a-zA-Z]:|\/)/u.test(pattern)
      ? pattern
      : `${cwd}/${pattern}`
    const matcher = globRegExp({ pattern: lowered({ path: absolute }) })
    return ENTRIES.filter((entry) => matcher.test(entry.toLowerCase()))
  },
  isDirectory: ({ path }) =>
    DIRS.some((dir) => dir.toLowerCase() === lowered({ path }))
}

/** The verdict for one shell command, by `agent` (MAIN for the main session). */
export const shell = ({
  agent = 'validator',
  command,
  cwd = REPO,
  host = HOST,
  policy = POLICY,
  tool = 'Bash'
}) =>
  decide({
    agentContext: AGENT_CONTEXT,
    host,
    payload: {
      ...(agent === MAIN ? {} : { agent_type: agent }),
      cwd,
      tool_input: { command },
      tool_name: tool
    },
    policy
  })

export const decisionOf = (input) => shell(input)?.decision ?? '—'
