# Design: the styling pillar

## Context

The owner made the styling rule a pillar on 2026-11-14 (the quote is in `proposal.md`).
Certifipago backs the same LAW on its web app with `local/style-positions-only` and a list that
only shrinks; the template has two apps, one of them React Native, where a style is mostly a
StyleSheet object rather than a class string.

## Decisions

1. **Who owns a look.** The component blocks: `src/components/ui/**` and a screen's own
   `src/screens/<Name>/components/**`. Everything else in `apps/*/src` only positions: the screen
   files, the route entries under `src/app/`, the containers under `src/components/<Name>/` and
   the shared `src/helpers/layout.style.ts`. A section, in the owner's words, is a route entry or
   a container. Tests, mocks and `src/test/` are no product surface and are out of scope.
2. **One detection, two rules.** `local/style-positions-only` judges the positioning half and
   `local/style-token-values` the value half, so a component block, which may carry a look, is
   still held to the tokens. Both read their scope from the file's path in
   `eslint-local-rules/style-positioning.detect.mjs`, which the freshness gate also imports, so
   the lint and the gate cannot judge different files. The ESLint block wires both over every
   app source file.
3. **What a style is on each app.** A `*.style.ts` file is read whole: a string is a class list,
   and an object made only of style declarations is a StyleSheet entry, judged by its keys. In a
   view only three things are read: a `className` attribute, a style slot (a `style` or `*Style`
   prop, a `*Style` option such as `contentStyle`, a `*Style` constant) and a colour attribute
   (`color`, `colors`, `*Color`, `fill`, `stroke`).
4. **What a token is.** A value from `@app/tokens`, through the preset or the TS constants, or a
   step of Tailwind's own scale (`px-2.75`, `duration-120`). A raw colour, a Tailwind palette
   colour and an arbitrary value (`[…]`, `(…)`) are not. A number in a React Native style is not
   read, and is named as not covered.
5. **The allowlist is the second exception to code-standards §20.** It is the one the rule is
   allowed to land with. An entry names its file, its rule and the reason the value cannot move;
   `verify:allowlist-freshness` fails an entry whose file no longer breaks its rule, so it only
   shrinks. The change ships it empty.
6. **The web app loads the preset, and keeps its colours.** `globals.css` keeps the colours,
   because they flip per theme through the `--c-*` variables, and the shadows `.glass-card` reads
   through `var()`. Tailwind's CSS `@theme` wins over the JS preset for a key both define
   (measured on Tailwind 4.3.1), so the preset fills only what the CSS no longer carries: the
   spacing, radius and font sizes, whose copies are deleted, and the new scales.
7. **Order of the work units.** The web refactor needs the new preset tokens on web, so the
   preset unit (F13) comes second, before the two refactors.
8. **Rendering.** The resolved values stay the same in the default dark theme. Three places now
   follow a component block or a token where the screen had drifted from it, and are named in the
   verify report: the web login submit renders `Button`'s primary look, the mobile "View all" call
   to action renders `Button`'s primary look, and the white overlays (`bg-white/[0.08]`,
   `border-white/[0.06]`) and the black scrim become `neutral-tint`, `divider` and `scrim`, equal
   in the dark theme and following the light theme on web.
