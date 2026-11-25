// ---------------------------------------------------------------------------
// reasons — the text of every verdict the write guard gives. Each names who
// is judged, what the call writes, the rule that fired and how to proceed;
// an ask before a rule file cites the LAW it protects and says to approve
// only an edit the owner asked for, and a deny says what to do instead.
//
// A finding (target.mjs, shell.mjs, powershell.mjs) carries its `kind` and
// the details its reason needs; `shape` is the part of the call that
// writes: the path for a file tool, `> AGENTS.md` or `git push` for Bash.
// ---------------------------------------------------------------------------

import { MAX_MENTIONS } from './mentions.mjs'
import { TARGET_KIND } from './paths.mjs'
import {
  ACTOR_KIND,
  AGENT_CONTEXT_FILE,
  POLICY_FILE,
  SWITCH_OFF
} from './policy.mjs'
import { TOOL_ADVICE } from './writers.tools.mjs'

// The longest part of a command a reason quotes.
export const MAX_SHOWN = 120

export const LAW =
  'The LAW "A rule is not edited to fit the work" (AGENTS.md) lets a rule ' +
  'change only when the owner asks for that change, in words, as the request.'

const SWITCH =
  `${SWITCH_OFF.variable}=${SWITCH_OFF.value} set when launching the ` +
  'session switches the guard off'

const ADVICE_REPORT = 'Report the change for the caller to make.'

const ADVICE_SCRATCH =
  'Write probes and logs under the OS temp dir instead (a folder from ' +
  'mktemp -d), or report the change for the caller to make.'

const APPROVE =
  'Approve only if the owner asked for this edit; otherwise stop, name the ' +
  'rule and what it costs the work, and ask the owner.'

export const brief = ({ text }) =>
  text.length > MAX_SHOWN ? `${text.slice(0, MAX_SHOWN)}…` : text

const calls = ({ text, tool }) => `${tool} \`${text}\``

const byWhom = ({ actor }) =>
  actor.name === null ? '' : ` by ${actor.name}`

const ruleClause = ({ rule }) =>
  rule.held
    ? `writes a folder that holds rule files: \`${rule.glob}\` ` +
      `(${rule.what}) in ${POLICY_FILE}.`
    : `edits a rule file: the path matches \`${rule.glob}\` (${rule.what}) ` +
      `in ${POLICY_FILE}.`

const surfaceOf = ({ actor }) =>
  actor.surface.map((folder) => `${folder}/`).join(', ')

const whoIs = ({ actor }) =>
  actor.kind === ACTOR_KIND.surface
    ? `${actor.name} writes only under ${surfaceOf({ actor })} or the OS ` +
      `temp dir (surface in ${AGENT_CONTEXT_FILE})`
    : `${actor.name} is read-only (writes: false in ${AGENT_CONTEXT_FILE})`

// -- the reasons of one target, shared by the file tools and Bash ------------

const askForRuleFile = ({ actor, rule, text, tool }) =>
  `${calls({ text, tool })}${byWhom({ actor })} ${ruleClause({ rule })} ` +
  `${LAW} ${APPROVE}`

const denyRuleFile = ({ actor, rule, text, tool }) =>
  `${whoIs({ actor })}: ${calls({ text, tool })} ${ruleClause({ rule })} ` +
  `${LAW} ${ADVICE_REPORT}`

const denyReadOnly = ({ actor, text, tool, where }) =>
  `${whoIs({ actor })}: ${calls({ text, tool })} writes ` +
  `${where === TARGET_KIND.repo ? 'inside the repository' : 'outside the repository and the OS temp dir'}. ` +
  ADVICE_SCRATCH

const denyOutsideSurface = ({ actor, text, tool }) =>
  `${whoIs({ actor })}: ${calls({ text, tool })} is outside them. ` +
  ADVICE_REPORT

// -- the reasons of a shell command --------------------------------------------

const DENIED = {
  code: ({ actor, finding, tool }) =>
    `${whoIs({ actor })}: the code in ${calls({ text: finding.shape, tool })} ` +
    `${finding.why}. Build written paths from os.tmpdir() or mkdtemp, or ` +
    'run the command directly.',
  git: ({ actor, finding, tool }) =>
    `${whoIs({ actor })}: ${calls({ text: finding.shape, tool })} changes ` +
    'the working tree, index, history or branches. Read with git status, ' +
    'diff, log or show, and report the change for the caller to make.',
  powershell: ({ actor }) =>
    `${whoIs({ actor })}: the PowerShell tool runs commands this hook does ` +
    'not read. Run the command through the Bash tool.',
  program: ({ actor, finding, tool }) =>
    `${whoIs({ actor })}: ${calls({ text: finding.shape, tool })} is a ` +
    'program the write guard does not know to only read, and it names ' +
    `\`${finding.token}\`, a path outside the OS temp dir. Use a known ` +
    'reader, write under the OS temp dir, or report the change for the ' +
    'caller to make.',
  'read-only': ({ actor, finding, tool }) =>
    denyReadOnly({
      actor,
      text: finding.shape,
      tool,
      where: finding.where
    }),
  rule: ({ actor, finding, tool }) =>
    denyRuleFile({ actor, rule: finding.rule, text: finding.shape, tool }),
  shell: ({ actor, finding, tool }) =>
    `${whoIs({ actor })}: ${calls({ text: finding.shape, tool })} runs ` +
    'text this hook does not read. Run the command directly.',
  surface: ({ actor, finding, tool }) =>
    denyOutsideSurface({ actor, text: finding.shape, tool }),
  tool: ({ actor, finding, tool }) =>
    `${whoIs({ actor })}: ${calls({ text: finding.shape, tool })} ` +
    `${finding.why}. ${TOOL_ADVICE}`,
  unreadable: ({ actor, finding }) =>
    `${whoIs({ actor })}, and this command cannot be read ` +
    `(${finding.problem}). Close every quote, substitution and here-doc, ` +
    'or split the command.',
  variable: ({ actor, finding, tool }) =>
    `${whoIs({ actor })}: the target of ` +
    `${calls({ text: finding.shape, tool })} depends on ` +
    `${finding.names.join(', ')}, which this command never sets, and Bash ` +
    'calls share no shell state. Set it in the same command, for example ' +
    'S=$(mktemp -d); … > $S/<name>.'
}

/** The reason a policed agent is refused the call `finding` describes. */
export const denyReason = ({ actor, finding, tool }) =>
  (DENIED[finding.kind] ?? DENIED.unreadable)({ actor, finding, tool })

// What a command the guard cannot settle does, for the ask about it.
const OPAQUE = {
  code: ({ finding }) =>
    `runs code the write guard cannot follow (\`${finding.shape}\` ` +
    `${finding.why})`,
  powershell: ({ finding }) => `holds a write (\`${finding.write}\`)`,
  program: ({ finding }) =>
    `runs \`${finding.shape}\`, a program the write guard does not know`,
  shell: ({ finding }) =>
    `runs text the write guard does not read (\`${finding.shape}\`)`,
  tool: ({ finding }) => `runs \`${finding.shape}\`, which ${finding.why}`,
  uncertain: ({ finding }) =>
    `writes \`${finding.shape}\`, a path the write guard cannot fully read`,
  unreadable: ({ finding }) =>
    `cannot be read by the write guard (${finding.problem})`,
  variable: ({ finding }) =>
    `writes \`${finding.shape}\`, which depends on ` +
    `${finding.names.join(', ')}, which the write guard cannot resolve`
}

const namesClause = ({ named }) =>
  named.rule.held
    ? `it names \`${named.token}\`, a folder that holds rule files: ` +
      `\`${named.rule.glob}\` (${named.rule.what}) in ${POLICY_FILE}`
    : `it names \`${named.token}\`, a rule file: the path matches ` +
      `\`${named.rule.glob}\` (${named.rule.what}) in ${POLICY_FILE}`

/**
 * The reason the call `finding` describes is asked of the human: a rule
 * file it writes, or a command the guard cannot read that names one
 * (`named`, from mentions.mjs) or is too long to check.
 */
export const askReason = ({ actor, command, finding, named, tool }) => {
  if (finding.kind === 'rule') {
    return askForRuleFile({
      actor,
      rule: finding.rule,
      text: finding.shape,
      tool
    })
  }
  const head =
    `${calls({ text: brief({ text: command }), tool })}${byWhom({ actor })} ` +
    (OPAQUE[finding.kind] ?? OPAQUE.unreadable)({ finding })
  return named.tooLong
    ? `${head}, and it is too long for the write guard to check for rule ` +
        `files (more than ${MAX_MENTIONS} words). ${LAW} Approve only if ` +
        'it edits no rule file, or the owner asked for that edit.'
    : `${head}, and ${namesClause({ named })}. ${LAW} ${APPROVE}`
}

/** The reason of a call the guard could not judge. */
export const guardError = ({ actor, denied, problem, tool }) =>
  `The write guard could not judge this ${tool} (${problem}), so it ` +
  `${denied ? `refuses it for ${actor.name}, which it polices` : 'asks before letting it run'}. ` +
  `Fix what it names, or, if the owner agrees, ${SWITCH}.`
