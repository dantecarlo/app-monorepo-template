import type { Config } from 'tailwindcss'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const uiPreset = require('@app/tokens/tailwind-preset.cjs') as object

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',

  plugins: [],
  // Consume the shared design system from @app/tokens.
  // All tokens (colors, spacing, radius, typography, shadows) are defined there.
  presets: [uiPreset],
  theme: {
    extend: {
      // Override font families to use Next.js CSS variable injection
      fontFamily: {
        body: ['var(--font-inter)', 'Inter', 'sans-serif'],
        display: ['var(--font-montserrat)', 'Montserrat', 'sans-serif']
      }
    }
  }
}

export default config
