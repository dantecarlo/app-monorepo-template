// Tailwind config of the web app, loaded by `@config` in src/app/globals.css.
// It brings in the @app/tokens preset, the source of the spacing, radius,
// font-size and layout-width scales. The colors stay in globals.css, whose
// @theme wins over the preset for a key both define and flips them per
// theme.

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@app/tokens/tailwind-preset.cjs')]
}
