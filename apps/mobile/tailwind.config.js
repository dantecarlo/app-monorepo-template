/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind v4 uses 'class' strategy on RN
  darkMode: 'class',
  presets: [require('@app/tokens/tailwind-preset.cjs')],
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../../packages/tokens/src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
}
