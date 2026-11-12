// ---------------------------------------------------------------------------
// Shared detection for verify-specs. Not a gate — it exports the parsing and
// the checks as pure functions over the text of the specs, the changes and
// the test files they cite, so every branch is drivable from a synthetic
// string.
//
// The shape it holds is the one openspec/README.md § 2.2 and § 3 state and
// openspec/templates/ carries.
// ---------------------------------------------------------------------------

export const SPEC_ROOT = 'openspec/specs/'
export const CHANGE_ROOT = 'openspec/changes/'
export const ARCHIVE_DIR = 'archive'
export const SPEC_FILE = 'spec.md'

const SECTION = /^## (?<title>.+?)\s*$/u
const REQUIREMENT = /^### Requirement: (?<id>\S+) — (?<name>\S.*?)\s*$/u
const SCENARIO = /^#### Scenario: (?<name>\S.*?)\s*$/u
const STEP = /^- \*\*(?<keyword>GIVEN|WHEN|THEN|AND)\*\* \S/u
const TEST_LINE = /^- \*\*Test:\*\* (?<value>.*?)\s*$/u
const TEST_REFERENCE = /^`(?<path>[^`]+)`(?: › "(?<title>.+)")?$/u
const NOT_COVERED = /^Not covered — \S/u
const GOVERNS = /^> \*\*Governs:\*\* (?<value>.+)$/u
const PREFIX_LINE = /^> \*\*ID prefix:\*\* `(?<prefix>[^`]+)`\s*$/u
const PREFIX_SHAPE = /^[A-Z][A-Z0-9]*$/u
const BACKTICKED = /`[^`]+`/u
const STATUS_LINE = /^> \*\*Status:\*\* (?<status>\S.*?)\s*$/u
const TASK_LINE = /^- \[(?<mark>[ x])\] (?<body>.*)$/u
const TASK_BODY =
  /^T\d+ — \S.*? · Requirements: (?<requirements>\S.*?) · Commit: (?<commit>\S+)$/u
const SHA = /^[0-9a-f]{7,40}$/u
const CHANGE_NAME = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/u
const REASON = /^\*\*Reason:\*\* \S/u

export const SPEC_SECTIONS = ['Purpose', 'Requirements']
export const PROPOSAL_SECTIONS = [
  'Why',
  'What changes',
  'Out of scope',
  'Affected specs'
]
export const DELTA_SECTIONS = {
  added: 'ADDED Requirements',
  modified: 'MODIFIED Requirements',
  removed: 'REMOVED Requirements'
}
const OPEN_STATUS = 'open'

// Reads one spec or delta into its header, its sections and its
// requirements, each requirement carrying the section it sits in.
export const parseSpec = ({ text }) => {
  const lines = text.split(/\r?\n/u)
  const sections = []
  const requirements = []
  let governs = null
  let prefix = null
  let section = null
  let requirement = null
  let scenario = null

  lines.forEach((line, index) => {
    const lineNumber = index + 1
    const governsMatch = line.match(GOVERNS)
    if (governsMatch) governs = governsMatch.groups.value
    const prefixMatch = line.match(PREFIX_LINE)
    if (prefixMatch) prefix = prefixMatch.groups.prefix

    const sectionMatch = line.match(SECTION)
    if (sectionMatch) {
      section = sectionMatch.groups.title
      sections.push(section)
      requirement = null
      scenario = null
      return
    }

    const requirementMatch = line.match(REQUIREMENT)
    if (requirementMatch) {
      requirement = {
        body: [],
        id: requirementMatch.groups.id,
        line: lineNumber,
        scenarios: [],
        section
      }
      requirements.push(requirement)
      scenario = null
      return
    }

    if (requirement === null) return

    const scenarioMatch = line.match(SCENARIO)
    if (scenarioMatch) {
      scenario = {
        line: lineNumber,
        name: scenarioMatch.groups.name,
        steps: new Set(),
        tests: []
      }
      requirement.scenarios.push(scenario)
      return
    }

    if (scenario === null) {
      requirement.body.push(line)
      return
    }

    const stepMatch = line.match(STEP)
    if (stepMatch) scenario.steps.add(stepMatch.groups.keyword)
    const testMatch = line.match(TEST_LINE)
    if (testMatch) {
      scenario.tests.push({
        line: lineNumber,
        value: testMatch.groups.value
      })
    }
  })

  return { governs, prefix, requirements, sections }
}

// A test line names a test file (and optionally a title in it) or says
// why nothing covers the scenario.
export const readTestValue = ({ value }) => {
  if (NOT_COVERED.test(value)) return { kind: 'not-covered' }
  const reference = value.match(TEST_REFERENCE)
  if (reference === null) return { kind: 'malformed' }
  return {
    kind: 'reference',
    path: reference.groups.path,
    title: reference.groups.title ?? null
  }
}

// Every test file the specs, and the deltas of a change with a verify
// report, cite, so the caller can read them before deciding.
export const collectTestReferences = ({ changes, specs }) => {
  const judged = [
    ...specs.map(({ text }) => text),
    ...changes
      .filter(({ files }) => files.verifyReport !== undefined)
      .flatMap(({ files }) => files.deltas.map(({ text }) => text))
  ]
  const paths = new Set()
  judged.forEach((text) => {
    parseSpec({ text }).requirements.forEach(({ scenarios }) =>
      scenarios.forEach(({ tests }) =>
        tests.forEach(({ value }) => {
          const test = readTestValue({ value })
          if (test.kind === 'reference') paths.add(test.path)
        })
      )
    )
  })
  return [...paths].sort()
}

const checkTest = ({ line, path, testFiles, value }) => {
  const test = readTestValue({ value })
  if (test.kind === 'not-covered') return []
  if (test.kind === 'malformed') {
    return [
      `${path}:${line}: the test line is neither \`<test path>\` › "<title>" ` +
        'nor "Not covered — <why>"'
    ]
  }
  if (testFiles === null) return []
  const content = testFiles[test.path]
  if (content === undefined || content === null) {
    return [`${path}:${line}: ${test.path} does not exist`]
  }
  if (test.title !== null && !content.includes(test.title)) {
    return [
      `${path}:${line}: no test titled "${test.title}" in ${test.path}`
    ]
  }
  return []
}

// The shape every requirement owes: an ID with the spec's prefix, a SHALL
// before its first scenario, and scenarios with GIVEN, WHEN, THEN and a
// test line each. A prefix of the wrong shape is never put into the ID
// pattern; the ID is then held to the generic upper-case shape.
const checkRequirement = ({ path, prefix, requirement, testFiles }) => {
  const findings = []
  const { body, id, line, scenarios } = requirement
  const validPrefix =
    prefix !== null && PREFIX_SHAPE.test(prefix) ? prefix : null
  const idShape = new RegExp(
    `^${validPrefix ?? '[A-Z][A-Z0-9]*'}-\\d{2,}$`,
    'u'
  )
  if (!idShape.test(id)) {
    findings.push(
      `${path}:${line}: requirement ${id} does not have the shape ` +
        `${validPrefix ?? '<PREFIX>'}-NN`
    )
  }
  if (!body.some((text) => text.includes('SHALL'))) {
    findings.push(`${path}:${line}: requirement ${id} states no SHALL`)
  }
  if (scenarios.length === 0) {
    findings.push(`${path}:${line}: requirement ${id} has no scenario`)
  }
  scenarios.forEach((scenario) => {
    const missing = ['GIVEN', 'WHEN', 'THEN'].filter(
      (keyword) => !scenario.steps.has(keyword)
    )
    if (missing.length > 0) {
      findings.push(
        `${path}:${scenario.line}: scenario "${scenario.name}" of ${id} ` +
          `has no ${missing.join(', ')}`
      )
    }
    if (scenario.tests.length === 0) {
      findings.push(
        `${path}:${scenario.line}: scenario "${scenario.name}" of ${id} ` +
          'names no test and does not say "Not covered — <why>"'
      )
    }
    scenario.tests.forEach(({ line: testLine, value }) =>
      findings.push(
        ...checkTest({ line: testLine, path, testFiles, value })
      )
    )
  })
  return findings
}

const duplicates = ({ values }) =>
  values.filter((value, index) => values.indexOf(value) !== index)

const checkLivingSpec = ({ parsed, path, testFiles }) => {
  const findings = []
  if (parsed.governs === null || !BACKTICKED.test(parsed.governs)) {
    findings.push(
      `${path}: no "> **Governs:**" line naming a backticked path`
    )
  }
  if (parsed.prefix === null || !PREFIX_SHAPE.test(parsed.prefix)) {
    findings.push(
      `${path}: no "> **ID prefix:**" line with an upper-case prefix`
    )
  }
  SPEC_SECTIONS.filter(
    (title) => !parsed.sections.includes(title)
  ).forEach((title) => findings.push(`${path}: no "## ${title}" section`))
  if (parsed.requirements.length === 0) {
    findings.push(`${path}: states no requirement`)
  }
  duplicates({ values: parsed.requirements.map(({ id }) => id) }).forEach(
    (id) => findings.push(`${path}: requirement ${id} is declared twice`)
  )
  parsed.requirements.forEach((requirement) =>
    findings.push(
      ...checkRequirement({
        path,
        prefix: parsed.prefix,
        requirement,
        testFiles
      })
    )
  )
  return findings
}

const checkPrefixes = ({ parsedSpecs }) => {
  const prefixes = parsedSpecs
    .map(({ parsed }) => parsed.prefix)
    .filter((prefix) => prefix !== null)
  return [...new Set(duplicates({ values: prefixes }))].map(
    (prefix) => `ID prefix ${prefix} is declared by more than one spec`
  )
}

const checkProposal = ({ name, proposal }) => {
  const path = `${CHANGE_ROOT}${name}/proposal.md`
  if (proposal === undefined) return [`${path}: missing`]
  const findings = []
  const parsed = parseSpec({ text: proposal })
  PROPOSAL_SECTIONS.filter(
    (title) => !parsed.sections.includes(title)
  ).forEach((title) => findings.push(`${path}: no "## ${title}" section`))
  const status = proposal
    .split(/\r?\n/u)
    .map((line) => line.match(STATUS_LINE))
    .find((match) => match !== null)
  if (status === undefined || status.groups.status !== OPEN_STATUS) {
    findings.push(
      `${path}: an open change says "> **Status:** open"; a finished or ` +
        `discarded one moves to ${CHANGE_ROOT}${ARCHIVE_DIR}/`
    )
  }
  return findings
}

const checkTasks = ({ name, tasks }) => {
  const path = `${CHANGE_ROOT}${name}/tasks.md`
  if (tasks === undefined)
    return { done: false, findings: [`${path}: missing`] }
  const findings = []
  const marks = []
  tasks.split(/\r?\n/u).forEach((line, index) => {
    const task = line.match(TASK_LINE)
    if (task === null) return
    marks.push(task.groups.mark)
    const body = task.groups.body.match(TASK_BODY)
    if (body === null) {
      findings.push(
        `${path}:${index + 1}: a task reads "T<n> — <what> · ` +
          'Requirements: <IDs or none> · Commit: <sha or —>"'
      )
      return
    }
    if (task.groups.mark === 'x' && !SHA.test(body.groups.commit)) {
      findings.push(
        `${path}:${index + 1}: a done task names the sha of its commit`
      )
    }
  })
  if (marks.length === 0) findings.push(`${path}: lists no task`)
  const done = marks.length > 0 && marks.every((mark) => mark === 'x')
  return { done, findings }
}

const checkDelta = ({ delta, livingSpecs, name, testFiles }) => {
  const path = `${CHANGE_ROOT}${name}/specs/${delta.specPath}/${SPEC_FILE}`
  const findings = []
  const parsed = parseSpec({ text: delta.text })
  const allowed = Object.values(DELTA_SECTIONS)
  parsed.sections
    .filter((title) => !allowed.includes(title))
    .forEach((title) =>
      findings.push(
        `${path}: "## ${title}" is not one of ${allowed.join(', ')}`
      )
    )
  const living = livingSpecs.find(
    ({ path: specPath }) =>
      specPath === `${SPEC_ROOT}${delta.specPath}/${SPEC_FILE}`
  )
  const livingIds = new Set(
    living === undefined
      ? []
      : living.parsed.requirements.map(({ id }) => id)
  )
  const prefix = living?.parsed.prefix ?? parsed.prefix
  parsed.requirements.forEach((requirement) => {
    const { id, line, section } = requirement
    if (section === DELTA_SECTIONS.added && livingIds.has(id)) {
      findings.push(
        `${path}:${line}: ${id} is ADDED but the living spec already has it`
      )
    }
    if (section !== DELTA_SECTIONS.added && !livingIds.has(id)) {
      findings.push(
        `${path}:${line}: ${id} is ${section} but the living spec has no ` +
          'such requirement'
      )
    }
    if (section === DELTA_SECTIONS.removed) {
      if (!requirement.body.some((text) => REASON.test(text))) {
        findings.push(
          `${path}:${line}: removed ${id} gives no **Reason:**`
        )
      }
      return
    }
    findings.push(
      ...checkRequirement({ path, prefix, requirement, testFiles })
    )
  })
  return findings
}

const checkChange = ({ change, livingSpecs, testFiles }) => {
  const { files, name } = change
  const findings = []
  if (!CHANGE_NAME.test(name)) {
    findings.push(
      `${CHANGE_ROOT}${name}/: a change folder is named <YYYY-MM-DD>-<name>`
    )
  }
  findings.push(...checkProposal({ name, proposal: files.proposal }))
  const tasks = checkTasks({ name, tasks: files.tasks })
  findings.push(...tasks.findings)
  if (tasks.done && files.verifyReport === undefined) {
    findings.push(
      `${CHANGE_ROOT}${name}/: every task is done and there is no ` +
        'verify-report.md'
    )
  }
  const deltaTestFiles =
    files.verifyReport === undefined ? null : testFiles
  files.deltas.forEach((delta) =>
    findings.push(
      ...checkDelta({
        delta,
        livingSpecs,
        name,
        testFiles: deltaTestFiles
      })
    )
  )
  return findings
}

// The whole verdict: every living spec, the prefixes across them, and every
// open change. `testFiles` maps each cited test path to its text, or to null
// when the file does not exist.
export const collectSpecFindings = ({ changes, specs, testFiles }) => {
  const parsedSpecs = specs.map(({ path, text }) => ({
    parsed: parseSpec({ text }),
    path
  }))
  return [
    ...parsedSpecs.flatMap(({ parsed, path }) =>
      checkLivingSpec({ parsed, path, testFiles })
    ),
    ...checkPrefixes({ parsedSpecs }),
    ...changes.flatMap((change) =>
      checkChange({ change, livingSpecs: parsedSpecs, testFiles })
    )
  ]
}
