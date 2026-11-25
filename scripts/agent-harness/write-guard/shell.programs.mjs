// ---------------------------------------------------------------------------
// shell.programs — the programs whose writes the guard does not read from
// their arguments: inner shells, `eval`, `cmd /c`, PowerShell, node and
// python code, package managers, the JS tools in a writing form, codegraph's
// lifecycle commands and `gh pr checkout`. A read-only agent is refused each
// one; for anyone else it is opaque, and decide asks only when the command
// names a rule path. The text of an inner shell (`bash -c`, `eval`, a
// here-doc fed to `sh`) is judged as a Bash command of its own for anyone
// but a read-only agent; perl and ruby code is read for the calls that write
// or start a process. Inline code is read (inline-code.mjs): the commands it
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
import { cachedClassify, isDeadline, TARGET_KIND } from './paths.mjs'
import { UNKNOWN } from './scan.mjs'
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
const COMMAND_FLAG = /^-[a-zA-Z]*c[a-zA-Z]*$/u
const NPX = new Set(['bunx', 'npx', 'pnpx'])
const CODE_FLAG = /^-[^-]*[eE]$/u
// The calls of perl and ruby code that write a file or start a process.
const WRITING_CODE = {
  perl: /\bopen\w*\s*\(?[^;)]*?['"][^'"]*(?:>|\+<|\|)|\b(?:chmod|chown|exec|link|mkdir|rename|rmdir|symlink|sysopen|system|truncate|unlink|utime)\b|\bqx\b|`/u,
  ruby: /\b(?:File|IO)\.(?:binwrite|chmod|delete|link|new|open|popen|rename|symlink|truncate|unlink|write)\b|\bFileUtils\b|\bDir\.(?:delete|mkdir|rmdir|unlink)\b|\b(?:exec|spawn|system)\b|%x|`/u
}

// The text an inner shell runs, judged as a Bash command of its own; one
// built from what the guard cannot see is opaque.
const innerShell = ({ shape, state, word }) => {
  if (word === undefined) return undefined
  if (word.text.includes(UNKNOWN) || word.unknown.length > 0) {
    return { kind: 'shell', level: LEVEL.opaque, shape }
  }
  return state.judgeText({ command: word.text })
}

// perl -e and ruby -e: the code, read for the calls that write.
const scriptVerdict = ({ language, rest, state }) => {
  const code = rest
    .filter((_, at) => CODE_FLAG.test(rest[at - 1]?.text ?? ''))
    .map(({ text }) => text)
    .join('\n')
  if (code === '' || !WRITING_CODE[language].test(code)) return undefined
  return {
    kind: 'code',
    level: opaqueLevel({ state }),
    shape: `${language} -e`,
    why: 'may write files or start a process'
  }
}

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
      cachedClassify({ cwd: state.cwd ?? undefined, host: state.host, text })
        .kind === TARGET_KIND.scratch
    )
  } catch (error) {
    if (isDeadline({ error })) throw error
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

// The programs programVerdict judges, whatever it finds of them.
const JUDGED = new Set([
  'cmd',
  'codegraph',
  'eval',
  'gh',
  'perl',
  'pnpm',
  'powershell',
  'pwsh',
  'ruby'
])

/** Whether programVerdict knows `name`, so it is no unknown program. */
export const isKnownProgram = ({ name }) =>
  JUDGED.has(name) ||
  SHELLS.has(name) ||
  INTERPRETERS.has(name) ||
  PACKAGE_MANAGERS.has(name) ||
  JS_TOOLS.has(name)

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
  const readOnly = isReadOnly({ state })
  if (SHELLS.has(name)) {
    const flag = texts.findIndex((text) => COMMAND_FLAG.test(text))
    if (flag >= 0) {
      const shape = `${name} -c`
      return readOnly
        ? { kind: 'shell', level, shape }
        : innerShell({ shape, state, word: rest[flag + 1] })
    }
    const script = texts.find((text) => !text.startsWith('-'))
    const fed =
      script === undefined ? stdinCode({ command, producer }) : undefined
    if (fed === undefined) return undefined
    const shape = `${name} reading commands from stdin`
    if (readOnly || fed.text === null) return { kind: 'shell', level, shape }
    return state.judgeText({ command: fed.text })
  }
  if (name === 'eval') {
    if (readOnly) return { kind: 'shell', level, shape: 'eval' }
    return innerShell({
      shape: 'eval',
      state,
      word: {
        text: texts.join(' '),
        unknown: rest.flatMap(({ unknown }) => unknown)
      }
    })
  }
  if (name === 'perl' || name === 'ruby') {
    return scriptVerdict({ language: name, rest, state })
  }
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
  const tool = rest[0]?.text
  if (!readOnly && NPX.has(name) && JS_TOOLS.has(tool)) {
    const why = toolWrite({ name: tool, rest: rest.slice(1) })
    return firstOfChecks({
      checks: [
        () => (why ? { kind: 'tool', level, shape, why } : undefined),
        () => reportTarget({ rest: rest.slice(1), state })
      ]
    })
  }
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
