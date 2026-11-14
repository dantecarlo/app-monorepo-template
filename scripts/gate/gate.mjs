// ---------------------------------------------------------------------------
// defineGate — the shape a validation gate has.
//
// `id`, `claims` and `notCovered` are required and validated at definition
// time, so a gate missing any of them throws before it can report a green.
//
// `run` returns findings and never prints or exits. Reporting lives here, so a
// companion test drives a gate as data, and can run its cases against a
// blinded copy to prove they assert something (`blindGate`).
// ---------------------------------------------------------------------------

const REQUIRED_TEXT = ['claims', 'id', 'notCovered']

export class GateDefinitionError extends Error {}

const assertText = ({ field, value }) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new GateDefinitionError(
      `gate field \`${field}\` must be a non-empty string. A gate that ` +
        'cannot say what it claims, or what it leaves uncovered, reports a ' +
        'green that nobody can size.'
    )
  }
}

export const defineGate = ({ claims, id, notCovered, run }) => {
  REQUIRED_TEXT.forEach((field) =>
    assertText({ field, value: { claims, id, notCovered }[field] })
  )

  if (typeof run !== 'function') {
    throw new GateDefinitionError(
      `gate \`${id}\` must supply a \`run\` function returning findings.`
    )
  }

  return Object.freeze({ claims, id, notCovered, run })
}

// A finding is a string or an object carrying `detail`, the line that names
// what is wrong; anything else prints as JSON.
const renderFinding = ({ finding }) => {
  if (typeof finding === 'string') return finding
  if (finding && typeof finding.detail === 'string') return finding.detail
  return JSON.stringify(finding)
}

// The caller gathers `context` — reading files, walking directories — and
// `run` only decides, so a detector can be driven from synthetic input.
//
// `denominator` states the population the verdict covers, and is required:
// without it a green over an empty walk reads like a green over everything. It
// belongs to the call, not the definition, because only the caller, holding
// the gathered context, knows how many things were judged.
export const reportGate = ({ context, denominator, gate }) => {
  assertText({ field: 'denominator', value: denominator })

  const findings = gate.run(context)

  if (findings.length > 0) {
    console.error(
      `${gate.id}: ${findings.length} problem(s) across ${denominator}.`
    )
    findings.forEach((finding) =>
      console.error(`  ${renderFinding({ finding })}`)
    )
    process.exitCode = 1
    return findings
  }

  console.log(
    `${gate.id}: PASS — ${denominator}. ${gate.claims} NOT covered: ` +
      gate.notCovered
  )
  return findings
}

// Returns the same gate with a detector that finds nothing. A companion run
// against it must fail, or it is asserting only about its own fixtures.
export const blindGate = ({ gate }) =>
  Object.freeze({ ...gate, run: () => [] })
