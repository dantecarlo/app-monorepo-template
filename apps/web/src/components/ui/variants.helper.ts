import { themeNames } from '@app/tokens'
import { createTV } from 'tailwind-variants'

// The one `tv` every ui block builds its variants with.
//
// tailwind-merge, which tailwind-variants runs on every call, resolves a
// conflict only between classes it can name. It knows Tailwind's own scales
// (p-4, text-lg, shadow-md) and reads any other text-*, bg-* or shadow-* as
// a colour, so it kept both of two token paddings (p-sm p-lg), read a token
// font size as a colour and dropped it beside one, and dropped a token
// shadow beside a shadow colour. Every token utility the web theme declares
// is registered here, under the tailwind-merge theme key of its namespace,
// from the generated themeNames of @app/tokens: a new token is covered with
// no change to this file.
//
// tailwind-variants keeps one merge config for the whole app, so a block that
// imports `tv` from the kit directly would depend on which module loaded
// first: every ui style file imports this one.

const THEME = Object.fromEntries(
  Object.entries(themeNames).map(([namespace, names]) => [
    namespace,
    [...names]
  ])
)

export const tv = createTV({ twMergeConfig: { extend: { theme: THEME } } })
