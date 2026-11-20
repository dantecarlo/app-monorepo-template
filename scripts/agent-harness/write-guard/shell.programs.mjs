// ---------------------------------------------------------------------------
// shell.programs — the programs whose writes the guard does not read from
// their arguments: inner shells, `eval`, `cmd /c`, PowerShell, node and
// python code, package managers, the JS tools in a writing form, codegraph's
// lifecycle commands and `gh pr checkout`. A read-only agent is refused each
// one; for anyone else it is opaque, and decide asks only when the command
// names a rule path. Inline code is read (inline-code.mjs): the commands it
// starts are judged as Bash commands and the paths it writes as targets.
//
// Ported from the read-only half of Certifipago's
// .claude/scripts/enforce-agent-writes.mjs.
// ---------------------------------------------------------------------------

import { literal, optionValue, splitArgs } from './expansion.mjs'
import {
  INTERPRETERS,
  interpreterCode,
  readCode,
  stdinCode
} from './inline-code.mjs'
import { classify, TARGET_KIND } from './paths.mjs'
import {
  firstOfChecks,
  isReadOnly,
  opaqueLevel,
  strongestOf,
  targetFinding
} from './shell.findings.mjs'
import { LEVEL } from './target.mjs'
import {
  CODEGRAPH_READS,
  JS_TOOLS,
  PACKAGE_MANAGERS,
  pnpmWrite,
  REPORT_FLAGS,
  toolWrite
} from './writers.tools.mjs'

const SHAPE_WORDS = 3
const SHELLS = new Set(['bash', 'dash', 'fish', 'ksh', 'sh', 'zsh'])

// `eslint -o`, `vitest --outputFile`: a report file is a write like any
// other.
const reportTarget = ({ rest, state }) => {
  const { options } = splitArgs({ args: rest, valued: REPORT_FLAGS })
  const output = optionValue({ flags: REPORT_FLAGS, options })
  return output
    ? targetFinding({
        contained: isReadOnly({ state }),
        state,
        target: output,
        via: '-o'
      })
    : undefined
}

const isScratch = ({ state, text }) => {
  try {
    return (
      classify({ cwd: state.cwd ?? undefined, host: state.host, text })
        .kind === TARGET_KIND.scratch
    )
  } catch {
    return false
  }
}

// The code a node or python call runs: every command it starts, judged as
// a Bash command, every path it writes, and code built at run time, which
// passes only when it builds its paths from the OS temp dir or every path
// literal it holds is scratch.
const codeVerdict = ({ code, language, shape, state }) => {
  const read = readCode({ code, language })
  const level = opaqueLevel({ state })
  const settled = () =>
    read.builder ||
    (read.literals.length > 0 &&
      read.literals.every((text) => isScratch({ state, text })))
  return firstOfChecks({
    checks: [
      () =>
        strongestOf({
          items: read.spawned.commands,
          judge: (command) => {
            const inner = state.judgeText({ command })
            return inner?.level === LEVEL.deny
              ? {
                  kind: 'code',
                  level,
                  shape,
                  why: `starts \`${command}\``
                }
              : inner
          }
        }),
      () =>
        strongestOf({
          items: read.written.filter((text) => text !== undefined),
          judge: (text) =>
            targetFinding({
              contained: isReadOnly({ state }),
              state,
              target: literal({ text }),
              via: shape
            })
        }),
      () => {
        const opaque =
          read.spawned.opaque || read.written.includes(undefined)
        if (!opaque || settled()) return undefined
        return {
          kind: 'code',
          level,
          shape,
          why: read.spawned.opaque
            ? 'starts a process built at run time'
            : 'writes a path built at run time, not from os.tmpdir() or mkdtemp'
        }
      }
    ]
  })
}

const interpreterVerdict = ({ args, command, name, producer, state }) => {
  const code = interpreterCode({ args, command, name, producer })
  if (code === undefined) return undefined
  const level = opaqueLevel({ state })
  if (code.kind === 'pip') {
    return {
      kind: 'tool',
      level,
      shape: code.shape,
      why: 'installs packages'
    }
  }
  if (code.kind === 'pipe') {
    return {
      kind: 'code',
      level,
      shape: code.shape,
      why: 'arrives through a pipe this hook cannot read'
    }
  }
  return codeVerdict({
    code: code.code,
    language: code.language,
    shape: code.shape,
    state
  })
}

/** The finding of a program whose writes the guard does not read. */
export const programVerdict = ({
  args,
  command,
  name,
  producer,
  rest,
  state
}) => {
  const texts = rest.map(({ text }) => text)
  const level = opaqueLevel({ state })
  if (SHELLS.has(name)) {
    if (texts.some((text) => /^-[a-zA-Z]*c[a-zA-Z]*$/.test(text))) {
      return { kind: 'shell', level, shape: `${name} -c` }
    }
    const script = texts.find((text) => !text.startsWith('-'))
    return script === undefined &&
      stdinCode({ command, producer }) !== undefined
      ? {
          kind: 'shell',
          level,
          shape: `${name} reading commands from stdin`
        }
      : undefined
  }
  if (name === 'eval') return { kind: 'shell', level, shape: 'eval' }
  if (name === 'cmd' && texts.some((text) => /^\/+[ck]$/i.test(text))) {
    return { kind: 'shell', level, shape: 'cmd /c' }
  }
  if (name === 'powershell' || name === 'pwsh') {
    return texts.some((text) => /^-f(?:ile)?$/i.test(text))
      ? undefined
      : { kind: 'shell', level, shape: `${name} -Command` }
  }
  if (INTERPRETERS.has(name)) {
    return interpreterVerdict({
      args: rest,
      command,
      name,
      producer,
      state
    })
  }
  const shape = args
    .slice(0, SHAPE_WORDS)
    .map(({ raw }) => raw)
    .join(' ')
  if (PACKAGE_MANAGERS.has(name)) {
    return { kind: 'tool', level, shape, why: 'runs a package manager' }
  }
  if (name === 'pnpm' || JS_TOOLS.has(name)) {
    const why =
      name === 'pnpm' ? pnpmWrite({ rest }) : toolWrite({ name, rest })
    return firstOfChecks({
      checks: [
        () => (why ? { kind: 'tool', level, shape, why } : undefined),
        () => reportTarget({ rest, state })
      ]
    })
  }
  if (name === 'codegraph') {
    const sub = texts.find((text) => !text.startsWith('-'))
    return sub === undefined || CODEGRAPH_READS.has(sub)
      ? undefined
      : {
          kind: 'tool',
          level,
          shape: `codegraph ${sub}`,
          why:
            'changes the index setup; explore, query, status, node, ' +
            'files, callers, callees, impact, affected and sync read'
        }
  }
  if (
    name === 'gh' &&
    ['pr checkout', 'repo clone'].includes(texts.slice(0, 2).join(' '))
  ) {
    return { kind: 'tool', level, shape, why: 'changes the working tree' }
  }
  return undefined
}
