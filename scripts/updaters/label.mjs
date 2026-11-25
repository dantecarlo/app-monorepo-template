// ---------------------------------------------------------------------------
// label — a pull-request label of `pnpm updaters:run` made current with no
// force option (the LAW "A force option is never used", AGENTS.md):
// `gh label list` reads it, then `gh label create` makes it when it is
// missing, or `gh label edit` sets its colour and description when either
// differs. A current label is left alone.
// ---------------------------------------------------------------------------

import { must } from './steps.mjs'

const sameColor = ({ a, b }) => a.toLowerCase() === b.toLowerCase()

/** Makes the label `name` exist with `color` and `description`. */
export const ensureLabel = ({ color, description, env, gh, name }) => {
  const listed = must({
    result: gh({
      args: [
        'label',
        'list',
        '--search',
        name,
        '--json',
        'name,color,description'
      ],
      env
    }),
    what: `gh label list --search ${name}`
  })
  const label = JSON.parse(listed.stdout || '[]').find(
    (entry) => entry.name === name
  )
  if (
    label !== undefined &&
    sameColor({ a: label.color, b: color }) &&
    label.description === description
  ) {
    return
  }
  const verb = label === undefined ? 'create' : 'edit'
  must({
    result: gh({
      args: [
        'label',
        verb,
        name,
        '--color',
        color,
        '--description',
        description
      ],
      env
    }),
    what: `gh label ${verb} ${name}`
  })
}
