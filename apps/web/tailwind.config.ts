import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  // Consume the shared design system from @app/ui.
  // All tokens (colors, spacing, radius, typography, shadows) are defined there.
  presets: [require('@app/ui/tailwind-preset.cjs')],
  theme: {
    extend: {
      // Override font families to use Next.js CSS variable injection
      fontFamily: {
        display: ['var(--font-montserrat)', 'Montserrat', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
