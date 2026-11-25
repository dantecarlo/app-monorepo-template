// ---------------------------------------------------------------------------
// writers.editors — the writers the donor did not know, each with the files
// it writes read from its arguments: the line-ending converters, awk in
// place, the editors (vi, vim, nvim, ex, ed), openssl, iconv, sponge, yq in
// place, scp, zip, gpg and patch. writers.mjs merges them into FILE_WRITERS.
// ---------------------------------------------------------------------------

import { parseOptions } from './expansion.mjs'
import { CWD, transferTargets } from './writers.folders.mjs'

const VAR_ASSIGNMENT = /^[A-Za-z_]\w*=/u
const AWK_INPLACE = /^inplace(?:\.awk)?$/u
const YQ_EVAL = new Set(['e', 'eval', 'ea', 'eval-all'])

const lineEndings = ({ args }) => {
  const parsed = parseOptions({ args, long: ['--convmode'], short: 'c' })
  const paired = parsed.has({ long: ['--newfile'], short: ['n'] })
  return paired
    ? parsed.operands.filter((_, at) => at % 2 === 1)
    : parsed.operands
}

const awkTargets = ({ args }) => {
  const parsed = parseOptions({
    args,
    long: [
      '--assign',
      '--field-separator',
      '--file',
      '--include',
      '--load',
      '--source'
    ],
    short: 'eFfilv'
  })
  const inplace = parsed
    .values({ long: '--include', short: 'i' })
    .some(({ text }) => AWK_INPLACE.test(text))
  if (!inplace) return []
  const files = parsed.has({
    long: ['--file', '--source'],
    short: ['f', 'e']
  })
    ? parsed.operands
    : parsed.operands.slice(1)
  return files.filter(({ text }) => !VAR_ASSIGNMENT.test(text))
}

// Every file an editor opens may be written, and so may its scriptout.
const editorTargets = ({ args }) => {
  const parsed = parseOptions({
    args,
    long: ['--cmd', '--servername', '--startuptime'],
    short: 'ciqSTuUwW'
  })
  return [
    ...parsed.values({ short: ['w', 'W'] }),
    ...parsed.operands.filter(({ text }) => !text.startsWith('+'))
  ]
}

// openssl reads `-out FILE`, `--out FILE`, `-out=FILE` and `--out=FILE`
// alike, and its other outputs the same way: `-keyout`, `-certout`,
// `-reqout`, `-respout`, `-sess_out` and the folder `-outdir`.
const OPENSSL_OUTPUT =
  /^--?(?:certout|keyout|out|outdir|reqout|respout|sess_out)(?:=(.*))?$/su

const opensslTargets = ({ args }) =>
  args.flatMap((arg, at) => {
    const match = OPENSSL_OUTPUT.exec(arg.text)
    if (match === null) return []
    if (match[1] !== undefined) {
      return match[1] === '' ? [] : [{ ...arg, text: match[1] }]
    }
    return args[at + 1] ? [args[at + 1]] : []
  })

const optionTarget = ({ args, flag, long, short, valued }) => {
  const parsed = parseOptions({ args, long, short: valued })
  const out = parsed.value({ long: flag, short })
  return out ? [out] : []
}

const yqTargets = ({ args }) => {
  const parsed = parseOptions({
    args,
    long: [
      '--expression',
      '--indent',
      '--input-format',
      '--output-format'
    ],
    short: 'Iop'
  })
  if (!parsed.has({ long: ['--inplace'], short: ['i'] })) return []
  const skip = YQ_EVAL.has(parsed.operands[0]?.text) ? 2 : 1
  return parsed.operands.slice(skip)
}

const scpTargets = ({ args, state }) =>
  transferTargets({
    operands: parseOptions({ args, short: 'cFiJloPS' }).operands,
    state
  })

const patchTargets = ({ args }) => {
  const parsed = parseOptions({
    args,
    long: [
      '--directory',
      '--input',
      '--output',
      '--prefix',
      '--reject-file',
      '--strip',
      '--suffix'
    ],
    short: 'BDdFiopVYrz'
  })
  if (parsed.has({ long: ['--dry-run'] })) return []
  const reject = parsed.values({ long: '--reject-file', short: 'r' })
  const out = parsed.value({ long: '--output', short: 'o' })
  const dir = parsed.value({ long: '--directory', short: 'd' })
  const [original] = parsed.operands
  const patched = out
    ? [out]
    : original === undefined
      ? [dir ?? CWD]
      : [
          dir
            ? { ...original, text: `${dir.text}/${original.text}` }
            : original
        ]
  return [...patched, ...reject]
}

export const EDITOR_WRITERS = {
  dos2unix: lineEndings,
  ed: ({ args }) => parseOptions({ args, short: 'p' }).operands,
  ex: editorTargets,
  gawk: awkTargets,
  awk: awkTargets,
  gpg: ({ args }) =>
    optionTarget({
      args,
      flag: '--output',
      long: ['--homedir', '--local-user', '--output', '--recipient'],
      short: 'o',
      valued: 'oru'
    }),
  iconv: ({ args }) =>
    optionTarget({
      args,
      flag: '--output',
      long: ['--from-code', '--output', '--to-code'],
      short: 'o',
      valued: 'oft'
    }),
  mac2unix: lineEndings,
  nvim: editorTargets,
  openssl: opensslTargets,
  patch: patchTargets,
  red: ({ args }) => parseOptions({ args, short: 'p' }).operands,
  scp: scpTargets,
  sponge: ({ args }) => parseOptions({ args }).operands,
  unix2dos: lineEndings,
  unix2mac: lineEndings,
  vi: editorTargets,
  view: editorTargets,
  vim: editorTargets,
  vimdiff: editorTargets,
  yq: yqTargets,
  zip: ({ args }) =>
    parseOptions({ args, short: 'bnPt' }).operands.slice(0, 1)
}
