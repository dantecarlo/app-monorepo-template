// ---------------------------------------------------------------------------
// writers — the file commands, each with the files it writes read from its
// arguments: `FILE_WRITERS[name]({ args, state })` returns the expanded
// argument words it writes (`.` for one that writes into the folder it runs
// in). Every actor's targets come from here: a read-only agent is refused
// every one outside scratch, and anyone is asked before one that is a rule
// file. A surface agent is held to its surface only for SURFACE_WRITERS.
//
// A file written into a folder is judged by the name it gets there: cp, mv
// and install into a folder, the members tar and unzip extract, the name
// curl -O and wget give a download. The writers the donor did not know are
// writers.editors.mjs's; git is read by writers.git.mjs, and the package
// managers and JS tools by writers.tools.mjs.
//
// Ported from the file writers of Certifipago's
// .claude/scripts/enforce-agent-writes.mjs.
// ---------------------------------------------------------------------------

import {
  literal,
  mktempTarget,
  operandsOf,
  parseOptions
} from './expansion.mjs'
import { SAFE } from './scan.mjs'
import { EDITOR_WRITERS } from './writers.editors.mjs'
import {
  copyTargets,
  CWD,
  lastSegmentOf,
  transferTargets,
  under
} from './writers.folders.mjs'

const URL_TAIL = /[?#].*$/su
const URL_HEAD = /^[a-z][a-z0-9+.-]*:\/\/[^/]*/iu

// The name a download gets: the last segment of the URL's path, or
// undefined when it has none.
const urlName = ({ url }) => {
  const path = url.text.replace(URL_TAIL, '').replace(URL_HEAD, '')
  const name = lastSegmentOf({ text: path })
  return name === '' ? undefined : name
}

// The files sed edits in place: the operands after the script, when a
// cluster holds `i`. `valued` lists the letters that take a value, and
// `codeLetters` those whose value is the script itself.
const inPlaceTargets = ({ args, codeLetters, valued }) => {
  let inPlace = false
  let code = false
  let skip = -1
  const operands = []
  for (const [k, arg] of args.entries()) {
    if (k <= skip) continue
    const text = arg.text
    if (/^--in-place(?:=|$)/.test(text)) inPlace = true
    else if (text === '--expression' || text === '--file') {
      code = true
      skip = k + 1
    } else if (/^--(?:expression|file)=/.test(text)) code = true
    else if (/^-[A-Za-z]/.test(text) && operands.length === 0) {
      const letters = [...text.slice(1)]
      const at = letters.findIndex((letter) =>
        `i${valued}`.includes(letter)
      )
      const letter = letters[at]
      if (letter === 'i') inPlace = true
      else if (letter !== undefined) {
        if (codeLetters.includes(letter)) code = true
        if (at === letters.length - 1) skip = k + 1
      }
    } else operands.push(arg)
  }
  if (!inPlace) return []
  return code ? operands : operands.slice(1)
}

// One perl switch of a bundle: `-0` and `-l` take digits (`-0777`), `-C`
// a number; `-i` takes the rest as a backup extension and `-e`, `-M`, `-x`
// and friends the rest as their value; every other letter stands alone.
const PERL_SWITCH =
  /0[xX][0-9a-fA-F]*|0[0-7]*|l[0-7]*|C\d*|[ieEMmIxFdD].*|./gs

// perl reads switches until the first argument that is not one; after a
// `-e` every operand is a file, without one the first is the script.
const perlTargets = ({ args }) => {
  let inPlace = false
  let code = false
  let skip = -1
  let ended = false
  const operands = []
  for (const [k, arg] of args.entries()) {
    if (k <= skip) continue
    const text = arg.text
    if (ended || text === '-' || !text.startsWith('-')) {
      ended = true
      operands.push(arg)
    } else if (text === '--') ended = true
    else {
      const switches = [...text.slice(1).matchAll(PERL_SWITCH)].map(
        ([one]) => one
      )
      if (switches.some((one) => one.startsWith('i'))) inPlace = true
      if (switches.some((one) => /^[eE]/.test(one))) code = true
      // A bare `-e` or `-I` takes the next argument as its value.
      if (switches.some((one) => ['e', 'E', 'I'].includes(one)))
        skip = k + 1
    }
  }
  if (!inPlace) return []
  return code ? operands : operands.slice(1)
}

const TAR_VALUED = 'bCfFgHIKLNTVX'
const TAR_LONG_VALUED = [
  '--directory',
  '--exclude',
  '--exclude-from',
  '--file',
  '--files-from',
  '--format',
  '--group',
  '--mode',
  '--mtime',
  '--newer',
  '--owner',
  '--transform',
  '--use-compress-program'
]
const TAR_CREATE = ['c', 'r', 'u']
const TAR_CREATE_LONG = ['--append', '--create', '--update']

// tar's options, the old bundled form included (`tar xzf a.tgz`, each
// value letter taking the next argument in order), and its operands: the
// members it extracts, or the files it archives.
const tarParse = ({ args }) => {
  const first = args[0]?.text ?? ''
  const bundled = first !== '' && !first.startsWith('-')
  const letters = bundled ? [...first] : []
  const bundledValues = {}
  let next = 1
  letters
    .filter((letter) => TAR_VALUED.includes(letter))
    .forEach((letter) => {
      bundledValues[letter] = args[next]
      next += 1
    })
  const parsed = parseOptions({
    args: bundled ? args.slice(next) : args,
    long: TAR_LONG_VALUED,
    short: TAR_VALUED
  })
  const all = [...letters, ...parsed.letters.map(({ letter }) => letter)]
  return {
    has: ({ letters: wanted, long }) =>
      wanted.some((letter) => all.includes(letter)) ||
      parsed.has({ long }),
    operands: parsed.operands,
    valueOf: ({ letter, long }) =>
      parsed.value({ long, short: letter }) ?? bundledValues[letter]
  }
}

const tarTargets = ({ args }) => {
  const tar = tarParse({ args })
  if (tar.has({ letters: ['x'], long: ['--extract', '--get'] })) {
    const dir = tar.valueOf({ letter: 'C', long: '--directory' }) ?? CWD
    return tar.operands.length === 0
      ? [dir]
      : tar.operands.map((member) => under({ dir, name: member.text }))
  }
  const create = tar.has({ letters: TAR_CREATE, long: TAR_CREATE_LONG })
  const file = tar.valueOf({ letter: 'f', long: '--file' })
  return create && file && file.text !== '-' ? [file] : []
}

const CURL_SHORT = 'oDcbdHXuAeEFKmTwxyYzrCUQtP'
const CURL_LONG = [
  '--config',
  '--connect-timeout',
  '--cookie',
  '--cookie-jar',
  '--data',
  '--data-binary',
  '--data-raw',
  '--dump-header',
  '--form',
  '--header',
  '--max-time',
  '--output',
  '--output-dir',
  '--proxy',
  '--referer',
  '--request',
  '--retry',
  '--user',
  '--user-agent'
]

const curlTargets = ({ args }) => {
  const parsed = parseOptions({ args, long: CURL_LONG, short: CURL_SHORT })
  const outputs = parsed.values({
    long: ['--output', '--dump-header', '--cookie-jar'],
    short: ['o', 'D', 'c']
  })
  const dir = parsed.value({ long: '--output-dir' }) ?? CWD
  const remote = parsed.has({
    long: ['--remote-name', '--remote-name-all'],
    short: ['O']
  })
  const headerName = parsed.has({
    long: ['--remote-header-name'],
    short: ['J']
  })
  const named = !remote
    ? []
    : parsed.operands.length === 0
      ? [dir]
      : parsed.operands.map((url) => {
          const name = headerName ? SAFE : urlName({ url })
          return name === undefined ? dir : under({ dir, name })
        })
  return [...outputs, ...named].filter((target) => target.text !== '-')
}

const WGET_SHORT = 'aABDeiIlOoPQRtTUwX'
const WGET_LONG = [
  '--accept',
  '--append-output',
  '--base',
  '--directory-prefix',
  '--domains',
  '--execute',
  '--header',
  '--input-file',
  '--level',
  '--output-document',
  '--output-file',
  '--reject',
  '--timeout',
  '--tries',
  '--user-agent',
  '--wait'
]
const WGET_INDEX = 'index.html'

const wgetTargets = ({ args }) => {
  const parsed = parseOptions({ args, long: WGET_LONG, short: WGET_SHORT })
  if (parsed.has({ long: ['--spider'] })) return []
  const document = parsed.value({ long: '--output-document', short: 'O' })
  const logs = parsed.values({
    long: ['--output-file', '--append-output'],
    short: ['o', 'a']
  })
  const dir =
    parsed.value({ long: '--directory-prefix', short: 'P' }) ?? CWD
  const body = document
    ? [document]
    : parsed.operands.length === 0
      ? [dir]
      : parsed.operands.map((url) =>
          under({ dir, name: urlName({ url }) ?? WGET_INDEX })
        )
  return [...logs, ...body].filter((target) => target.text !== '-')
}

const UNZIP_LISTS = /^-[a-zA-Z]*[ltpvZc]/u
const UNZIP_FOLDER = 'd'
const UNZIP_PASSWORD = 'P'

// `unzip [-opts] file [members] [-x excluded] [-d folder]`.
const unzipTargets = ({ args }) => {
  if (args.some(({ text }) => UNZIP_LISTS.test(text))) return []
  let dir
  let excluding = false
  const operands = []
  for (let at = 0; at < args.length; at += 1) {
    const { text } = args[at]
    if (text === '-x') excluding = true
    else if (text.startsWith('-') && text.length > 1) {
      excluding = false
      const d = text.indexOf(UNZIP_FOLDER)
      if (d > 0) {
        const rest = text.slice(d + 1)
        dir = rest === '' ? args[at + 1] : { ...args[at], text: rest }
        if (rest === '') at += 1
      } else if (text.endsWith(UNZIP_PASSWORD)) at += 1
    } else if (!excluding) operands.push(args[at])
  }
  const folder = dir ?? CWD
  const members = operands.slice(1)
  return members.length === 0
    ? [folder]
    : members.map((member) => under({ dir: folder, name: member.text }))
}

const compressorTargets = ({ args }) =>
  args.some(
    ({ text }) =>
      /^-[a-zA-Z]*[ctl]/.test(text) ||
      /^--(?:stdout|test|list)$/.test(text)
  )
    ? []
    : operandsOf({ args, valued: ['-S', '--suffix'] })

// Every command that names the files it writes.
export const FILE_WRITERS = {
  bunzip2: compressorTargets,
  bzip2: compressorTargets,
  chgrp: ({ args }) => operandsOf({ args }).slice(1),
  chmod: ({ args }) => operandsOf({ args }).slice(1),
  chown: ({ args }) => operandsOf({ args }).slice(1),
  cp: ({ args, state }) =>
    copyTargets({ args, move: false, short: 'St', state }),
  curl: curlTargets,
  dd: ({ args }) =>
    args
      .filter(({ text }) => text.startsWith('of='))
      .map((arg) => ({ ...arg, text: arg.text.slice('of='.length) })),
  gunzip: compressorTargets,
  gzip: compressorTargets,
  install: ({ args, state }) =>
    args.some(({ text }) => text === '-d')
      ? operandsOf({ args, valued: ['-m', '-o', '-g'] })
      : copyTargets({ args, move: false, short: 'gmoSt', state }),
  ln: ({ args, state }) =>
    copyTargets({ args, move: false, short: 'St', single: true, state }),
  mkdir: ({ args }) => operandsOf({ args, valued: ['-m', '--mode'] }),
  mkfifo: ({ args }) => operandsOf({ args, valued: ['-m'] }),
  mktemp: ({ args, state }) => [
    literal({ text: mktempTarget({ args, state }) })
  ],
  mv: ({ args, state }) =>
    copyTargets({ args, move: true, short: 'St', state }),
  perl: perlTargets,
  rm: ({ args }) => operandsOf({ args }),
  rmdir: ({ args }) => operandsOf({ args }),
  rsync: ({ args, state }) =>
    transferTargets({
      operands: operandsOf({ args, valued: ['-e', '--rsh'] }),
      state
    }),
  sd: ({ args }) =>
    args.some(({ text }) => text === '-p' || text === '--preview')
      ? []
      : operandsOf({ args, valued: ['-f', '--flags', '-n'] }).slice(2),
  sed: ({ args }) =>
    inPlaceTargets({ args, codeLetters: 'ef', valued: 'efl' }),
  shred: ({ args }) => operandsOf({ args, valued: ['-n', '-s'] }),
  sort: ({ args }) => {
    const out = parseOptions({
      args,
      long: [
        '--buffer-size',
        '--key',
        '--output',
        '--temporary-directory'
      ],
      short: 'kostST'
    }).value({ long: '--output', short: 'o' })
    return out ? [out] : []
  },
  tar: tarTargets,
  tee: ({ args }) => operandsOf({ args }),
  touch: ({ args }) =>
    operandsOf({
      args,
      valued: ['-d', '-t', '-r', '--date', '--reference']
    }),
  truncate: ({ args }) =>
    operandsOf({ args, valued: ['-s', '-r', '--size', '--reference'] }),
  uniq: ({ args }) =>
    operandsOf({ args, valued: ['-f', '-s', '-w'] }).slice(1, 2),
  unlink: ({ args }) => operandsOf({ args }),
  unxz: compressorTargets,
  unzip: unzipTargets,
  wget: wgetTargets,
  xz: compressorTargets,
  ...EDITOR_WRITERS
}

// The commands a surface agent is held to; the rest is its workflow.
export const SURFACE_WRITERS = new Set([
  'cp',
  'ln',
  'mkdir',
  'mv',
  'perl',
  'rm',
  'rmdir',
  'sd',
  'sed',
  'tee',
  'touch',
  'unlink'
])
