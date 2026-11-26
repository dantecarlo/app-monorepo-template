// ---------------------------------------------------------------------------
// messages — the texts `pnpm updaters:run` writes: an update's commit
// subject and body, its pull request's body (with the rule-proposal section
// that quotes the LAW "A rule is not edited to fit the work" word for
// word), the rule-proposal label, the paths an update asks a person to
// review, and the plan a dry run prints. It runs nothing.
// ---------------------------------------------------------------------------

export const BRANCH_PREFIX = 'updates/'
export const RULE_PROPOSAL_LABEL = 'rule-proposal'
export const LABEL_COLOR = 'b60205'
export const LABEL_DESCRIPTION =
  'An updater proposes a rule change; the owner decides it'

const COMMIT_WIDTH = 100

// The LAW of AGENTS.md a rule proposal quotes, word for word.
const LAW = 'A rule is not edited to fit the work'
const LAW_TEXT =
  'They change only when the owner asks for that change, in words, as the request.'

const wrap = ({ text }) =>
  text.split(' ').reduce((lines, word) => {
    const last = lines.at(-1)
    if (last === undefined) return [word]
    return `${last} ${word}`.length <= COMMIT_WIDTH
      ? [...lines.slice(0, -1), `${last} ${word}`]
      : [...lines, word]
  }, [])

export const subjectOf = ({ entry }) =>
  `chore(updates): run the ${entry.id} updater`

const verifiedBy = ({ entry, quote = (text) => text }) =>
  entry.verify.length === 0
    ? 'It declares no verify command.'
    : `Then ${entry.verify.map(quote).join(', ')} passed.`

export const commitBodyOf = ({ branch, entry, start }) =>
  wrap({
    text:
      `pnpm updaters:run found ${entry.id} out of date and ran ${entry.command} ` +
      `on ${branch}, ${start.how}. ${verifiedBy({ entry })}`
  }).join('\n')

// The paths an update printed as `review: <path>`.
export const reviewsOf = ({ stdout }) =>
  (stdout ?? '')
    .split(/\r?\n/u)
    .map((line) => /^review: (?<path>.+)$/u.exec(line.trim())?.groups.path)
    .filter((path) => path !== undefined)

const bullet = ({ text }) => `- \`${text}\``

const proposalSection = ({ rules }) => [
  '## Rule proposal',
  '',
  rules.length === 0
    ? `Its updater declares \`proposal: true\`, so this pull request opens as a draft labelled \`${RULE_PROPOSAL_LABEL}\`.`
    : `This change touches a rule path, so it opens as a draft labelled \`${RULE_PROPOSAL_LABEL}\`:`,
  ...(rules.length === 0
    ? []
    : [
        '',
        ...rules.map(
          ({ path, rule }) => `${bullet({ text: path })}, ${rule.what}`
        )
      ]),
  '',
  `> **${LAW} — LAW** (\`AGENTS.md\`)`,
  '>',
  `> ${LAW_TEXT}`,
  '',
  'The owner decides: approve the rule change in words, or close this pull request.',
  ''
]

export const pullBodyOf = ({
  base,
  branch,
  changed,
  entry,
  proposal,
  reviews,
  rules,
  start
}) =>
  [
    `\`pnpm updaters:run\` found \`${entry.id}\` out of date (\`${entry.command} --check\` exited 2). ` +
      `It ran \`${entry.command}\` on \`${branch}\`, ${start.how}. ` +
      verifiedBy({ entry, quote: (text) => `\`${text}\`` }),
    '',
    '## Changed',
    '',
    ...changed.map((path) => bullet({ text: path })),
    '',
    ...(reviews.length === 0
      ? []
      : [
          '## Review',
          '',
          ...reviews.map((path) => bullet({ text: path })),
          ''
        ]),
    ...(proposal ? proposalSection({ rules }) : []),
    '---',
    '',
    'An updater opened this pull request. It never merges, approves or enables auto-merge: a ' +
      `person reviews and merges it. The next run merges \`${base}\` into \`${branch}\` and ` +
      'adds its commit on top, never rewriting it, so a commit pushed to it by hand stays.'
  ].join('\n')

// What a dry run prints for an out-of-date updater.
export const planOf = ({ entry }) => {
  const branch = `${BRANCH_PREFIX}${entry.id}`
  const verify =
    entry.verify.length === 0 ? '' : `, then ${entry.verify.join(', ')}`
  const pull = entry.proposal
    ? `a draft labelled ${RULE_PROPOSAL_LABEL}`
    : `ready for review, or a draft labelled ${RULE_PROPOSAL_LABEL} if its diff touches a rule path`
  return (
    `updaters: [dry run] ${entry.id} would merge the default branch into ${branch}, or start ` +
    `it from the default branch, run ${entry.command}${verify}, commit "${subjectOf({ entry })}", ` +
    `push ${branch} without force and open or update one pull request, ${pull}`
  )
}
