import { themeNames } from '@app/tokens'
import { createTV, type VariantProps } from 'tailwind-variants'

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

// The variants a block built with tv takes: each variant's name, required, to
// the union of its option names, an option `true` read as a boolean. A block's
// props never name it, nor any type of the kit: they use the unions its
// *.constant.ts declares, and the block's constant test compares those with
// this type, so typecheck fails when the unions and the config disagree.
export type VariantUnionsType<
  TVariants extends (...args: never[]) => unknown
> = {
  [TName in keyof VariantProps<TVariants>]-?: Exclude<
    VariantProps<TVariants>[TName],
    undefined
  >
}
