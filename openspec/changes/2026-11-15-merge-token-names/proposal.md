# Proposal: tailwind-merge knows every token name

> **Status:** open

## Why

Every web `ui/` block builds its variants with the shared `tv` of
`apps/web/src/components/ui/variants.helper.ts`, and tailwind-variants runs tailwind-merge on
every call. The helper registers only the token font sizes with tailwind-merge (F30). tailwind-merge
knows Tailwind's own scales (`p-4`, `shadow-md`, `ease-in`) and reads any other `text-*`, `bg-*` or
`shadow-*` as a colour. It cannot name the template's other tokens, so when two classes of one
utility carry token names it keeps both, and the order of the rules in the CSS decides which one
applies. Measured through the shared `tv` at `af0c84e`, 12 of 26 probe pairs come out wrong:

| Input | Output today | Should be |
| --- | --- | --- |
| `p-sm p-lg` | `p-sm p-lg` | `p-lg` |
| `px-pill-x px-lg` | `px-pill-x px-lg` | `px-lg` |
| `px-pill-x p-lg` | `px-pill-x p-lg` | `p-lg` |
| `py-pill-y py-sm` | `py-pill-y py-sm` | `py-sm` |
| `gap-xs gap-xl` | `gap-xs gap-xl` | `gap-xl` |
| `top-knob-inset top-sm` | `top-knob-inset top-sm` | `top-sm` |
| `w-content w-dialog` | `w-content w-dialog` | `w-dialog` |
| `max-w-narrow max-w-wide` | `max-w-narrow max-w-wide` | `max-w-wide` |
| `shadow-rim-light shadow-none` | `shadow-rim-light shadow-none` | `shadow-none` |
| `shadow-card shadow-accent` | `shadow-accent` | both: a shadow size and a shadow colour |
| `shadow-accent shadow-card` | `shadow-card` | both |
| `ease-shimmer ease-linear` | `ease-shimmer ease-linear` | `ease-linear` |

The last shadow pairs are the worst case: tailwind-merge reads `shadow-card` as a shadow colour, so
it drops a real shadow next to a shadow colour. Certifipago found the same class of defect, for
`z-*`, colours and more, in its Web #849, and now ties one shared list to the names its CSS
declares. Decision 59 of `docs/INIT_AND_HARNESS_PLAN.md` gives the template one source and one
generator for every token output, so the list is one more output.

**A finding.** The web theme declares `--duration-shimmer`, but Tailwind 4.3.1 builds `duration-*`
from `--transition-duration-*`. Compiling `duration-shimmer` through the web's Tailwind with the
generated theme produces no rule, while `ease-shimmer`, `shadow-card`, `p-sm`, `top-knob-inset`,
`max-w-content`, `w-content`, `font-body`, `text-button` and `rounded-xl` each produce one.
`--duration-shimmer` is read only through `var()`, by `.animate-shimmer` in
`apps/web/src/app/globals.css`. A `duration-*` token name therefore has nothing for tailwind-merge
to merge, and the list leaves that namespace out by a named rule. The token keeps its name and
`theme.css` keeps what it writes for it.

The owner's words, verbatim:

- 2026-11-14 (translated from Spanish): "move everything to ui, that rule is a pillar. The screen
  or section files must contain only positioning, and the components are what must hold the
  other styles, but everything centralized in styles and the tokens. Fix everything you mention
  applying what is recommended, and once everything is fixed tell the Arquitecto to integrate it
  and fix everything"
- 2026-11-15 (translated from Spanish), decision 59: "we don't want to be tied to anything,
  everything must be adaptable, and that's why I like your third option"
- 2026-11-15 (translated from Spanish), on the kit behind `ui/`: "if for example tomorrow shadcn is
  not used and Material UI or another is wanted, the change should be relatively decoupled and
  'easy' to make"

## What changes

- **The list is generated.** `packages/tokens/scripts/generate.mjs` writes a fourth output,
  `packages/tokens/src/themeNames.constant.ts`: per Tailwind namespace, the sorted names of the web
  theme's tokens whose variables make a utility (color, container, ease, font, radius, shadow,
  spacing and text). The generator writes it from the same declarations it writes `theme.css`
  from, so a new token reaches both with no other change. The `duration` namespace is left out by
  a named rule, with the reason above. The file carries the generated header and has the
  generator as its one writer. Its contents are plain data with no tailwind-merge type, so the
  tokens package stays kit-neutral, and `@app/tokens` exports it as `themeNames`. `theme.css`
  keeps the same bytes.
- **The drift gate covers it.** `verify:theme-sync` already regenerates every entry of the
  generator's outputs, so the new file is held to its regeneration. Its companion gains the cases
  for the new output, and its header and claim name four outputs. `.prettierignore` lists the new
  file with the other outputs.
- **The tie test.** A tokens test reads the committed `theme.css` and maps each namespace it
  declares to the utility that namespace feeds. The test fails when a declared name of a utility
  namespace is missing from `themeNames`, when `themeNames` names something the CSS does not
  declare, or when the CSS declares a namespace the test does not classify. `duration` is
  classified as feeding no utility, by name, with its reason.
- **The helper.** `apps/web/src/components/ui/variants.helper.ts` builds its whole tailwind-merge
  config from `themeNames`, each namespace under the tailwind-merge theme key of the same name.
  tailwind-merge 3.6.0, the installed version, has a theme key for all eight namespaces, so no
  `classGroups` entry is needed. A test fails when a namespace of the list is not a theme key of
  the installed tailwind-merge. The helper stays the only module that imports
  `tailwind-variants`.
- **The proof, test first:**
  - the wrong pairs above, plus at least one pair per namespace;
  - the pairs that already resolve (`rounded-*`, `font-*`, `text-*` colour against size, `bg-*`,
    two Tailwind durations), pinned;
  - every listed name compiled through the web's Tailwind, to prove each one makes a utility and
    `duration-shimmer` does not;
  - the resolved class string of every web `ui/` block, for each variant and each `className` a
    caller passes, recorded before the change and compared after.
- **Docs and skills:** the tokens README, `docs/architecture/web.md`, `docs/code-standards.md`
  §22, `docs/maps/global-map.md`, and the `component` and `arch` skills.

## Out of scope

- Renaming `motion.duration` or changing what `theme.css` writes for it, so that `duration-*`
  utilities exist. No class uses one today, so the token stays as it is; a rename would be a
  change of its own, to TOKENS-19 and to `globals.css`.
- `ui/Text`, which keeps `{ twMerge: false }`. Its tone and weight are meant to sit beside a
  variant, and merging would drop them.
- A lint rule that keeps `tailwind-variants` out of every web file. The existing test covers
  `*.style.ts`, and plan row 203 tracks the rest.
- Mobile. NativeWind does not run tailwind-merge, and no mobile file imports it.
- Porting to Certifipago. The Arquitecto adopts the generated list when this merges.

## Affected specs

- `openspec/specs/packages/tokens/spec.md`: TOKENS-20 added; TOKENS-15 and TOKENS-16 modified.
- `openspec/specs/apps/web/spec.md`: WEB-44 added.
