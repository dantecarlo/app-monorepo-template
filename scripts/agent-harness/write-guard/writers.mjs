// ---------------------------------------------------------------------------
// writers — the file commands, each with the files it writes read from its
// arguments: `FILE_WRITERS[name]({ args, state })` returns the expanded
// argument words it writes (`.` for one that writes into the folder it runs
// in). Every actor's targets come from here: a read-only agent is refused
// every one outside scratch, and anyone is asked before one that is a rule
// file. A surface agent is held to its surface only for SURFACE_WRITERS.
//
// git is read by writers.git.mjs, and the package managers and JS tools by
// writers.tools.mjs.
//
// Ported from the file writers of Certifipago's
// .claude/scripts/enforce-agent-writes.mjs.
// ---------------------------------------------------------------------------

import {
  clusters,
  hasFlag,
  literal,
  mktempTarget,
  operandsOf,
  optionValue,
  splitArgs
} from './expansion.mjs'

// The folder a command writes into when it names none.
export const CWD = literal({ text: '.' })

const lastOrTarget = ({ args, valued = [] }) => {
  const { operands, options } = splitArgs({
    args,
    valued: ['-t', '--target-directory', ...valued]
  })
  const target = optionValue({
    flags: ['-t', '--target-directory'],
    options
  })
  if (target) return [target]
  return operands.length > 1 ? [operands.at(-1)] : []
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

const tarTargets = ({ args }) => {
  const first = args[0]?.text ?? ''
  const bundled = first !== '' && !first.startsWith('-')
  const valued = ['f', 'C']
  const found = clusters({ args: bundled ? args.slice(1) : args, valued })
  const letters = [
    ...(bundled ? first : ''),
    ...found.map((one) => one.letter)
  ]
  const { options } = splitArgs({
    args,
    valued: ['-C', '-f', '--directory', '--file']
  })
  // `tar xzf a.tgz`: each value letter of the bundle takes the next
  // argument, in order.
  const bundledValue = ({ letter }) =>
    bundled && first.includes(letter)
      ? args[
          1 +
            [...first]
              .filter((one) => valued.includes(one))
              .indexOf(letter)
        ]
      : undefined
  const valueOf = ({ letter, long }) =>
    optionValue({ flags: [`-${letter}`, long], options }) ??
    found.find((one) => one.letter === letter)?.value ??
    bundledValue({ letter })
  const extract =
    letters.includes('x') ||
    hasFlag({ flags: ['--extract', '--get'], options })
  const create =
    ['c', 'r', 'u'].some((letter) => letters.includes(letter)) ||
    hasFlag({ flags: ['--create', '--append', '--update'], options })
  if (extract)
    return [valueOf({ letter: 'C', long: '--directory' }) ?? CWD]
  const file = valueOf({ letter: 'f', long: '--file' })
  return create && file && file.text !== '-' ? [file] : []
}

const curlTargets = ({ args }) => {
  const { options } = splitArgs({
    args,
    valued: ['--output', '--dump-header', '--cookie-jar', '--output-dir']
  })
  const found = clusters({
    args: args.filter((arg) => !arg.text.startsWith('--')),
    valued: [...'oDcbdHXuAeEFKmTwxyYzrCUQtP']
  })
  const dir = optionValue({ flags: ['--output-dir'], options }) ?? CWD
  const remoteName =
    found.some(({ letter }) => 'OJ'.includes(letter)) ||
    hasFlag({ flags: ['--remote-name', '--remote-name-all'], options })
  return [
    ...found
      .filter(({ letter, value }) => 'oDc'.includes(letter) && value)
      .map(({ value }) => value),
    ...['--output', '--dump-header', '--cookie-jar']
      .map((flag) => optionValue({ flags: [flag], options }))
      .filter(Boolean),
    ...(remoteName ? [dir] : [])
  ].filter((target) => target.text !== '-')
}

const wgetTargets = ({ args }) => {
  const { options } = splitArgs({
    args,
    valued: [
      '-O',
      '-P',
      '-o',
      '-a',
      '--output-document',
      '--directory-prefix'
    ]
  })
  if (hasFlag({ flags: ['--spider'], options })) return []
  const document = optionValue({
    flags: ['-O', '--output-document'],
    options
  })
  const logs = ['-o', '-a']
    .map((flag) => optionValue({ flags: [flag], options }))
    .filter(Boolean)
  const dir = optionValue({ flags: ['-P', '--directory-prefix'], options })
  const body = document ? [document] : [dir ?? CWD]
  return [...logs, ...body].filter((target) => target.text !== '-')
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
  cp: ({ args }) => lastOrTarget({ args }),
  curl: curlTargets,
  dd: ({ args }) =>
    args
      .filter(({ text }) => text.startsWith('of='))
      .map((arg) => ({ ...arg, text: arg.text.slice('of='.length) })),
  gunzip: compressorTargets,
  gzip: compressorTargets,
  install: ({ args }) =>
    args.some(({ text }) => text === '-d')
      ? operandsOf({ args, valued: ['-m', '-o', '-g'] })
      : lastOrTarget({ args, valued: ['-m', '-o', '-g', '-S'] }),
  ln: ({ args }) => {
    const targets = lastOrTarget({ args })
    return targets.length > 0 ? targets : [CWD]
  },
  mkdir: ({ args }) => operandsOf({ args, valued: ['-m', '--mode'] }),
  mkfifo: ({ args }) => operandsOf({ args, valued: ['-m'] }),
  mktemp: ({ args, state }) => [
    literal({ text: mktempTarget({ args, state }) })
  ],
  mv: ({ args }) => {
    const { operands, options } = splitArgs({ args, valued: ['-t'] })
    const target = optionValue({
      flags: ['-t', '--target-directory'],
      options
    })
    return target ? [target, ...operands] : operands
  },
  patch: ({ args }) =>
    args.some(({ text }) => text === '--dry-run') ? [] : [CWD],
  perl: perlTargets,
  rm: ({ args }) => operandsOf({ args }),
  rmdir: ({ args }) => operandsOf({ args }),
  rsync: ({ args }) => operandsOf({ args }).slice(-1),
  sd: ({ args }) =>
    args.some(({ text }) => text === '-p' || text === '--preview')
      ? []
      : operandsOf({ args, valued: ['-f', '--flags', '-n'] }).slice(2),
  sed: ({ args }) =>
    inPlaceTargets({ args, codeLetters: 'ef', valued: 'efl' }),
  shred: ({ args }) => operandsOf({ args, valued: ['-n', '-s'] }),
  sort: ({ args }) => {
    const { options } = splitArgs({
      args,
      valued: ['-o', '-k', '-t', '-S']
    })
    const out = optionValue({ flags: ['-o', '--output'], options })
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
  unzip: ({ args }) => {
    if (args.some(({ text }) => /^-[ltpvZc]+$/.test(text))) return []
    const { options } = splitArgs({ args, valued: ['-d', '-x'] })
    return [optionValue({ flags: ['-d'], options }) ?? CWD]
  },
  wget: wgetTargets,
  xz: compressorTargets
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
