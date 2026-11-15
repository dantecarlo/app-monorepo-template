import { fontSize, glyphSize } from '@app/tokens'
import { createTV } from 'tailwind-variants'

// The one `tv` every ui block builds its variants with.
//
// tailwind-merge, which tailwind-variants runs on every call, knows Tailwind's
// own font sizes (text-sm, text-lg) but not the token ones, so it reads
// text-button or text-title as a text colour and drops it next to one. The
// token font sizes are registered here as font sizes, read from @app/tokens:
// a new size token is covered with no change to this file.
//
// tailwind-variants keeps one merge config for the whole app, so a block that
// imports `tv` from the kit directly would depend on which module loaded
// first: every ui style file imports this one.

const CAPITAL_LETTER = /[A-Z]/g

// The Tailwind key the tokens preset gives a token: amountHero is amount-hero.
const toTailwindKey = ({ key }: { key: string }) =>
  key.replace(CAPITAL_LETTER, (letter) => `-${letter.toLowerCase()}`)

const TOKEN_FONT_SIZE_KEYS = [
  ...Object.keys(fontSize),
  ...Object.keys(glyphSize)
].map((key) => toTailwindKey({ key }))

export const tv = createTV({
  twMergeConfig: {
    extend: { theme: { text: TOKEN_FONT_SIZE_KEYS } }
  }
})
