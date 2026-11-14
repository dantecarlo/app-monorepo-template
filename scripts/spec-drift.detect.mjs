// ---------------------------------------------------------------------------
// Shared detection for report-spec-drift. Not a report — it reads a living
// spec's anchor (the code paths it governs and the commit it was last
// verified at) and decides, from what the caller measured in git, which
// specs are behind their code. Pure, so every branch is drivable from a
// synthetic spec.
// ---------------------------------------------------------------------------

import { parseSpec } from './specs.detect.mjs'

const VERIFIED =
  /^> \*\*Verified against the code:\*\* .*? at `(?<sha>[0-9a-f]{7,40})`/u
const BACKTICKED = /`(?<path>[^`]+)`/gu

export const DRIFT_KIND = {
  missingPath: 'missing-path',
  noAnchor: 'no-anchor',
  stale: 'stale',
  unknownCommit: 'unknown-commit'
}

// The governed paths of a spec, in the order its Governs line names them,
// and the commit its Verified line names, or null.
export const readSpecAnchor = ({ text }) => {
  const verified = text
    .split(/\r?\n/u)
    .map((line) => line.match(VERIFIED))
    .find((match) => match !== null)
  const { governs } = parseSpec({ text })
  const governed =
    governs === null
      ? []
      : [...governs.matchAll(BACKTICKED)].map(({ groups }) => groups.path)
  return { governed, sha: verified?.groups.sha ?? null }
}

// One finding per spec that is behind its code or cannot be measured.
// `measured` holds, per spec, whether its commit exists, which governed
// paths are absent from the tree, and the files under them that differ
// from that commit.
export const collectDrift = ({ measured }) =>
  measured.flatMap(
    ({ changed, commitKnown, governed, missing, path, sha }) => {
      if (sha === null || governed.length === 0) {
        return [
          {
            detail:
              `${path}: no "Verified against the code" commit or no governed ` +
              'path, so its drift cannot be measured',
            kind: DRIFT_KIND.noAnchor,
            path
          }
        ]
      }
      if (!commitKnown) {
        return [
          {
            detail: `${path}: verified at ${sha}, a commit this repository does not hold`,
            kind: DRIFT_KIND.unknownCommit,
            path
          }
        ]
      }
      const findings = missing.map((governedPath) => ({
        detail: `${path}: governs \`${governedPath}\`, which does not exist`,
        kind: DRIFT_KIND.missingPath,
        path
      }))
      if (changed.length > 0) {
        findings.push({
          changed,
          detail:
            `${path}: ${changed.length} file(s) under its governed paths ` +
            `changed since ${sha}`,
          kind: DRIFT_KIND.stale,
          path
        })
      }
      return findings
    }
  )
