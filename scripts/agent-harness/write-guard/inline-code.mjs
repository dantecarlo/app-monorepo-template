// ---------------------------------------------------------------------------
// inline-code — the code a `node -e`, a `python -c` or a here-doc hands an
// interpreter, and what the guard reads from it.
//
// `interpreterCode` finds the code of one interpreter call; `readCode`
// reads it: `written`, every path a write call names (a literal, a literal
// folder plus one run-time segment, or undefined where the path is built at
// run time), `spawned`, every command it starts (judged as a Bash command)
// and whether one is built at run time, `builder`, whether it builds paths
// from the OS temp dir, and `literals`, the path-like strings it holds. The
// judge classifies the paths; this module reads text only.
//
// Calls are read by their arguments, split on the top-level commas by one
// linear scan, never by a pattern that backtracks: a hook that takes longer
// than its timeout lets the call through.
//
// Ported from the inline-code analyzer of Certifipago's
// .claude/scripts/enforce-agent-writes.mjs.
// ---------------------------------------------------------------------------

import { repeat, SAFE } from './scan.mjs'

export const INTERPRETERS = new Set([
  'node',
  'py',
  'python',
  'python3',
  'ts-node',
  'tsx'
])

const CODE_RULES = {
  js: {
    builder:
      /\btmpdir\s*\(|\bmkdtemp|process\.env(?:\.|\[\s*['"`])(?:TEMP|TMP|TMPDIR)\b/,
    isWriter: () => true,
    open: /\bopen(?:Sync)?\s*\(/g,
    receiver: undefined,
    spawn:
      /\bchild_process\b|\b(?:execSync|execFileSync|spawnSync)\b|\bBun\.spawn\b|\bDeno\.(?:run|Command)\b/,
    spawnCall:
      /\b(execSync|exec|execFileSync|execFile|spawnSync|spawn)\s*\(/g,
    write:
      /\b(writeFile|appendFile|mkdir|rm|rmdir|unlink|rename|copyFile|cp|symlink|link|truncate|chmod|utimes|createWriteStream|outputFile|outputJson|writeJson)(?:Sync)?\s*\(/g
  },
  python: {
    builder:
      /\btempfile\b|\bgettempdir\b|\bmkdtemp\b|environ(?:\.get)?\s*[[(]\s*['"](?:TEMP|TMP|TMPDIR)['"]/,
    isWriter: ({ name }) =>
      name.startsWith('os.') ||
      /^shutil\.(?:copy|copy2|copyfile|copymode|copystat|copytree|move|rmtree|make_archive|unpack_archive|chown)$/.test(
        name
      ),
    open: /\bopen\s*\(/g,
    // `Path('x').write_text(...)` writes its receiver, not an argument.
    receiver: {
      any: /(?<!\b(?:os|shutil))\.(?:write_text|write_bytes|touch|mkdir|unlink|rmdir|symlink_to|hardlink_to)\s*\(/g,
      literal:
        /\bPath\(\s*(['"])((?:(?!\1)[^\\\n]|\\.)*)\1\s*\)\s*\.(?:write_text|write_bytes|touch|mkdir|unlink|rmdir|symlink_to|hardlink_to)\s*\(/g
    },
    spawn: /\bsubprocess\b|\bos\.(?:system|popen|exec\w*|spawn\w*)\s*\(/,
    spawnCall:
      /\b(subprocess\.(?:run|check_output|check_call|call|Popen|getoutput|getstatusoutput)|os\.system|os\.popen)\s*\(/g,
    write:
      /\b(os\.(?:remove|unlink|rename|replace|makedirs|mkdir|rmdir|removedirs|symlink|link|truncate|chmod)|shutil\.\w+)\s*\(/g
  }
}
// Which arguments a call writes: the destination of a copy or a link, both
// ends of a move, the first argument of everything else.
const WRITTEN_ARGUMENTS = {
  copyFile: [1],
  cp: [1],
  link: [1],
  'os.link': [1],
  'os.rename': [0, 1],
  'os.replace': [0, 1],
  'os.symlink': [1],
  rename: [0, 1],
  'shutil.copy': [1],
  'shutil.copy2': [1],
  'shutil.copyfile': [1],
  'shutil.copymode': [1],
  'shutil.copystat': [1],
  'shutil.copytree': [1],
  'shutil.move': [0, 1],
  symlink: [1]
}
const MAX_CALLS = 64
const STRING = /^(['"`])((?:(?!\1)[^\\\n]|\\.)*)\1/
const ALL_STRINGS = /(['"`])((?:(?!\1)[^\\\n]|\\.)*)\1/g
const WRITE_MODE = /^(?:mode\s*=\s*)?(['"`])[^'"`]*[wax+][^'"`]*\1$/
// A literal that names a file: has a separator, or a name and an extension.
const PATH_LIKE = /[\\/]|^[\w.-]+\.[A-Za-z0-9]{1,8}$/
const FILE_PROGRAM = /^(?:execFile|execFileSync|spawn|spawnSync)$/
const OPENERS = '([{'
const CLOSERS = ')]}'
const QUOTES = '\'"`'
const TEMPLATE_DIRECTORY = /^`([^`$\\]*[\\/])\$\{/

const unescaped = ({ text }) => text.replace(/\\(.)/g, '$1')
const shellQuoted = ({ text }) => `'${text.replace(/'/g, `'\\''`)}'`

// The top-level items between an opening bracket (just before `from`) and
// its match, split on commas outside quotes and nested brackets; undefined
// when it never closes.
const topLevelItems = ({ code, from }) => {
  const items = []
  let depth = 0
  let quote = ''
  let start = from
  let j = from
  let end
  repeat({
    bound: code.length - from,
    step: () => {
      if (j >= code.length) return false
      const c = code[j]
      if (quote !== '') {
        if (c === '\\') j += 1
        else if (c === quote) quote = ''
      } else if (QUOTES.includes(c)) quote = c
      else if (OPENERS.includes(c)) depth += 1
      else if (CLOSERS.includes(c) && depth > 0) depth -= 1
      else if (CLOSERS.includes(c)) {
        items.push(code.slice(start, j).trim())
        end = j
        return false
      } else if (c === ',' && depth === 0) {
        items.push(code.slice(start, j).trim())
        start = j + 1
      }
      j += 1
      return true
    }
  })
  return end === undefined ? undefined : { end, items }
}

// The value of a whole-string literal; undefined for anything built at run
// time, a template with `${...}` included.
const literalOf = ({ text }) => {
  const match = STRING.exec(text ?? '')
  return match &&
    match[0].length === text.length &&
    !(match[1] === '`' && match[2].includes('${'))
    ? unescaped({ text: match[2] })
    : undefined
}

// The path a write argument names: a whole literal, or a literal folder
// followed by a run-time name (`'/tmp/x/' + f`, `` `/tmp/x/${f}` ``), which
// counts as that folder plus one segment, the way `$S/$(...)` does in a
// shell command. Undefined for anything else built at run time.
const writtenPathOf = ({ text }) => {
  const whole = literalOf({ text })
  if (whole !== undefined || text === undefined) return whole
  const template = TEMPLATE_DIRECTORY.exec(text)
  if (template) return `${template[1]}${SAFE}`
  const match = STRING.exec(text)
  if (!match || match[1] === '`') return undefined
  const directory = unescaped({ text: match[2] })
  return /[\\/]$/.test(directory) &&
    /^\s*\+/.test(text.slice(match[0].length))
    ? `${directory}${SAFE}`
    : undefined
}

// `['git', 'diff']` as its literal items; undefined when any is not one.
const literalList = ({ text }) => {
  if (!text?.startsWith('[')) return undefined
  const list = topLevelItems({ code: text, from: 1 })
  if (!list || list.end !== text.length - 1) return undefined
  const items =
    list.items.at(-1) === '' ? list.items.slice(0, -1) : list.items
  const values = items.map((item) => literalOf({ text: item }))
  return values.includes(undefined) ? undefined : values
}

const argumentsAt = ({ code, match }) =>
  topLevelItems({ code, from: (match.index ?? 0) + match[0].length })
    ?.items ?? []

// The shell command a spawn call runs, when it is all literal: a string
// (`execSync('git diff')`, `os.system('ls')`) or a list of strings
// (`execFileSync('git', ['diff'])`, `subprocess.run(['git', 'diff'])`).
const spawnedCommand = ({ args, name }) => {
  const [first, second] = args
  const list = literalList({ text: first })
  if (list) return list.map((text) => shellQuoted({ text })).join(' ')
  const command = literalOf({ text: first })
  if (command === undefined || !FILE_PROGRAM.test(name)) return command
  const rest = second === undefined ? [] : literalList({ text: second })
  return rest
    ? [command, ...rest].map((text) => shellQuoted({ text })).join(' ')
    : undefined
}

// Every process the code starts: the commands it reads, and `opaque` when
// one is built at run time, or the code names a spawner it never calls.
const spawnedBy = ({ code, rules }) => {
  if (!rules.spawn.test(code)) return { commands: [], opaque: false }
  const calls = [...code.matchAll(rules.spawnCall)].filter(
    (match) =>
      code.slice(Math.max(0, (match.index ?? 0) - 2), match.index) !== '/.'
  )
  if (calls.length === 0 || calls.length > MAX_CALLS) {
    return { commands: [], opaque: true }
  }
  const commands = calls.map((match) =>
    spawnedCommand({ args: argumentsAt({ code, match }), name: match[1] })
  )
  return {
    commands: commands.filter((command) => command !== undefined),
    opaque: commands.includes(undefined)
  }
}

// Every path the code writes: a literal, or undefined where a call writes
// a path built at run time.
const writtenBy = ({ code, rules }) => {
  const calls = [...code.matchAll(rules.write)]
  const opens = [...code.matchAll(rules.open)]
  if (calls.length + opens.length > MAX_CALLS) return [undefined]
  const written = calls
    .filter((match) => rules.isWriter({ name: match[1] }))
    .flatMap((match) => {
      const args = argumentsAt({ code, match })
      return (WRITTEN_ARGUMENTS[match[1]] ?? [0]).map((index) =>
        writtenPathOf({ text: args[index] })
      )
    })
  const opened = opens.flatMap((match) => {
    const args = argumentsAt({ code, match })
    return args.slice(1).some((arg) => WRITE_MODE.test(arg))
      ? [writtenPathOf({ text: args[0] })]
      : []
  })
  const receivers = rules.receiver
    ? [...code.matchAll(rules.receiver.literal)].map((match) =>
        unescaped({ text: match[2] })
      )
    : []
  const unread = rules.receiver
    ? [...code.matchAll(rules.receiver.any)].length - receivers.length
    : 0
  return [
    ...written,
    ...opened,
    ...receivers,
    ...(unread > 0 ? [undefined] : [])
  ]
}

/** What the guard reads from `code` in `language` ('js' or 'python'). */
export const readCode = ({ code, language }) => {
  const rules = CODE_RULES[language]
  return {
    builder: rules.builder.test(code),
    literals: [...code.matchAll(ALL_STRINGS)]
      .map((match) => match[2])
      .filter((text) => PATH_LIKE.test(text) && !text.includes('${')),
    spawned: spawnedBy({ code, rules }),
    written: writtenBy({ code, rules })
  }
}

/**
 * The code an interpreter or a shell reads from stdin, when the guard can
 * read it: a here-doc, a here-string, or what `cat`, `echo` or `printf`
 * feed it through a pipe. `{ text: null }` when another command feeds it,
 * and undefined when nothing does or a file does.
 */
export const stdinCode = ({ command, producer }) => {
  const heredoc = command.redirects.find(
    (redirect) => redirect.heredoc
  )?.heredoc
  if (heredoc) return { text: heredoc.body }
  const herestring = command.redirects.find(
    (redirect) => redirect.op === '<<<'
  )
  if (herestring) return { text: herestring.target.raw }
  if (command.redirects.some((redirect) => redirect.op === '<')) {
    return undefined
  }
  if (!producer) return undefined
  const source = producer.words.map((word) => word.raw)
  const fed = producer.redirects.find(
    (redirect) => redirect.heredoc
  )?.heredoc
  if (['cat', 'echo', 'printf'].includes(source[0] ?? '')) {
    return { text: fed ? fed.body : source.slice(1).join(' ') }
  }
  return { text: null }
}

const CODE_FLAGS = {
  js: ['-e', '--eval', '-p', '--print', '-pe'],
  python: ['-c']
}
const VALUED_NODE_FLAGS =
  /^-[rCm]$|^--(?:require|import|loader|conditions|input-type)$/

/**
 * The code one interpreter call runs: `{ kind: 'code', code, language,
 * shape }`; `{ kind: 'pip', shape }` for `python -m pip`; `{ kind: 'pipe',
 * shape }` for code piped in by a command the guard cannot read; undefined
 * for a script file, or when nothing feeds it.
 */
export const interpreterCode = ({ args, command, name, producer }) => {
  const texts = args.map(({ text }) => text)
  const language = name.startsWith('py') ? 'python' : 'js'
  if (language === 'python' && texts[texts.indexOf('-m') + 1] === 'pip') {
    return { kind: 'pip', shape: `${name} -m pip` }
  }
  const flagAt = texts.findIndex(
    (text) =>
      CODE_FLAGS[language].includes(text) ||
      /^--(?:eval|print)=/.test(text)
  )
  if (flagAt >= 0) {
    const flag = texts[flagAt]
    const code = flag.includes('=')
      ? flag.slice(flag.indexOf('=') + 1)
      : args[flagAt + 1]?.text
    return code === undefined
      ? undefined
      : { code, kind: 'code', language, shape: `${name} ${flag}` }
  }
  const script = texts.find(
    (text, k) =>
      !text.startsWith('-') && !VALUED_NODE_FLAGS.test(texts[k - 1] ?? '')
  )
  if (script !== undefined) return undefined
  const fed = stdinCode({ command, producer })
  if (fed === undefined) return undefined
  if (fed.text === null) return { kind: 'pipe', shape: `… | ${name}` }
  return {
    code: fed.text,
    kind: 'code',
    language,
    shape: `${name} - <<EOF`
  }
}
