// ---------------------------------------------------------------------------
// writers.tools — the package managers and the JS tools. A read-only agent
// may run pnpm only in the forms that read (a gate, a test, lint, typecheck,
// knip, validate, view, ls, audit) and the JS tools only in their read-only
// form (`vitest run`, `eslint` without --fix, `prettier --check`, `tsc
// --noEmit`); every other form says why it writes. Any other package
// manager is a write. A report file (`eslint -o`) is judged as a target.
//
// Ported from the tools half of Certifipago's
// .claude/scripts/enforce-agent-writes.mjs.
// ---------------------------------------------------------------------------

export const PACKAGE_MANAGERS = new Set([
  'bun',
  'bunx',
  'corepack',
  'npm',
  'npx',
  'pip',
  'pip3',
  'pnpx',
  'poetry',
  'uv',
  'yarn'
])
const PNPM_SKIPPED = new Set([
  '--aggregate-output',
  '--if-present',
  '--parallel',
  '--recursive',
  '--silent',
  '--stream',
  '--workspace-root',
  '-r',
  '-s',
  '-w'
])
const PNPM_VALUED = new Set([
  '--dir',
  '--filter',
  '--reporter',
  '-C',
  '-F'
])
const PNPM_SCRIPTS = new Set([
  'knip',
  'lint',
  'test',
  'typecheck',
  'validate'
])
const PNPM_READS = new Set([
  'audit',
  'list',
  'ls',
  'outdated',
  'view',
  'why'
])
const PNPM_META = new Set(['--help', '--version', '-v', 'help'])
export const CODEGRAPH_READS = new Set([
  'affected',
  'callees',
  'callers',
  'explore',
  'files',
  'impact',
  'node',
  'query',
  'status',
  'sync'
])
export const JS_TOOLS = new Set(['eslint', 'prettier', 'tsc', 'vitest'])
const FIXING = new Set(['--fix', '--write', '-w', '-u', '--update'])
const SNAPSHOT_UPDATES = new Set(['-u', '--update', '--update-snapshots'])
// The flags a JS tool writes a report file with.
export const REPORT_FLAGS = ['-o', '--output-file', '--outputFile']
export const TOOL_ADVICE =
  'Read-only forms: pnpm verify:*, pnpm <name>:test, pnpm <name>:check, ' +
  'pnpm test, lint, typecheck, knip, validate, view, ls, audit; pnpm exec ' +
  'vitest run, eslint, prettier --check, tsc --noEmit.'

/** Undefined when a JS tool call reads; otherwise why it writes. */
export const toolWrite = ({ name, rest }) => {
  const texts = rest.map(({ text }) => text)
  const fixing = texts.some((text) => FIXING.has(text))
  if (name === 'vitest') {
    if (texts.some((text) => SNAPSHOT_UPDATES.has(text))) {
      return 'rewrites snapshots'
    }
    return texts[0] === 'run' || texts.includes('--run')
      ? undefined
      : 'is not the read-only `vitest run`'
  }
  if (name === 'eslint') {
    return texts.includes('--fix') ? 'rewrites files' : undefined
  }
  if (name === 'prettier') {
    if (fixing) return 'rewrites files'
    return texts.some((text) =>
      ['--check', '-c', '--list-different', '-l'].includes(text)
    )
      ? undefined
      : 'is not the read-only `prettier --check`'
  }
  if (name === 'tsc') {
    return texts.some((text) =>
      /^--?(?:noEmit|version|help|showConfig)$/.test(text)
    )
      ? undefined
      : 'writes its output without --noEmit'
  }
  return 'is not a read-only form'
}

/** Undefined when a pnpm call reads; otherwise why it writes. */
export const pnpmWrite = ({ rest }) => {
  const args = []
  let skip = -1
  for (const [k, arg] of rest.entries()) {
    if (k <= skip) continue
    if (PNPM_VALUED.has(arg.text)) skip = k + 1
    else if (
      !PNPM_SKIPPED.has(arg.text) &&
      !/^--(?:filter|dir|reporter)=/.test(arg.text)
    ) {
      args.push(arg)
    }
  }
  const texts = args.map(({ text }) => text)
  const offset = texts[0] === 'run' ? 1 : 0
  const script = texts[offset]
  if (script === undefined || PNPM_META.has(texts[0])) return undefined
  if (script === 'exec' || JS_TOOLS.has(script)) {
    const at = offset + (script === 'exec' ? 1 : 0)
    const tool = texts[at] ?? ''
    if (!JS_TOOLS.has(tool)) return 'is not a read-only form'
    return toolWrite({ name: tool, rest: args.slice(at + 1) })
  }
  if (
    /^verify:|:test$|:check$/.test(script) ||
    PNPM_SCRIPTS.has(script) ||
    PNPM_READS.has(script)
  ) {
    // `test` is `vitest run`: `-u` after the script, or after `--`,
    // rewrites the tracked snapshots.
    if (texts.some((text) => SNAPSHOT_UPDATES.has(text))) {
      return 'rewrites snapshots'
    }
    return texts.includes('--fix') ? 'rewrites files' : undefined
  }
  return 'is not a read-only pnpm form'
}
