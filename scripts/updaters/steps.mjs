// ---------------------------------------------------------------------------
// steps — what every step of `pnpm updaters:run` shares: the exit codes of
// an updater's check, the errors that stop an update with what they say,
// and `must`, which turns a failed git or gh call into one.
// ---------------------------------------------------------------------------

export const EXIT = Object.freeze({ current: 0, failed: 1, outdated: 2 })

/** A step that failed: the run stops there, and the message says where. */
export class StepFailed extends Error {}

/**
 * The merge that starts an update conflicts. The merge is aborted and the
 * tree is back on the ref the run started on, so the run goes on to the
 * next updater.
 */
export class MergeConflict extends StepFailed {}

export const firstLine = ({ text }) =>
  (text ?? '').split(/\r?\n/u).find((line) => line.trim() !== '') ?? ''

/** The result of one call, or a StepFailed naming it. */
export const must = ({ result, what }) => {
  if (result.status === EXIT.current) return result
  const why = firstLine({ text: result.stderr })
  throw new StepFailed(
    `\`${what}\` exited ${result.status ?? 'without a status'}` +
      (why === '' ? '' : `: ${why}`)
  )
}
