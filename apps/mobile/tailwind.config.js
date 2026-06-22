/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind v4 uses 'class' strategy on RN
  darkMode: 'class',
  presets: [require('@app/ui/tailwind-preset.cjs')],
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
}
