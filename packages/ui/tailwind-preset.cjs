// Tailwind CSS preset for the shared dark-glass design system.
// Token values are inlined here (duplicated from src/tokens.ts) because
// CommonJS Tailwind config cannot require() TypeScript source directly.
// Keep this file in sync with src/tokens.ts.
//
// Usage in tailwind.config.js / tailwind.config.ts:
//   presets: [require('@app/ui/tailwind-preset.cjs')]

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      // -----------------------------------------------------------------
      // Colors
      // -----------------------------------------------------------------
      colors: {
        bg: {
          base: '#0A0B0D',
          raised: '#101216',
        },
        glass: {
          fill: 'rgba(24,27,34,0.42)',
          stroke: 'rgba(255,255,255,0.10)',
        },
        divider: 'rgba(255,255,255,0.06)',
        text: {
          primary: '#F7F8FA',
          secondary: 'rgba(255,255,255,0.55)',
          tertiary: '#7E808A',
          disabled: 'rgba(255,255,255,0.25)',
        },
        accent: {
          DEFAULT: '#FF6A1A',
          light: '#FF8A3D',
          ink: '#2A1402',
          tint: 'rgba(255,106,26,0.16)',
        },
        success: {
          DEFAULT: '#34C759',
          tint: 'rgba(52,199,89,0.16)',
        },
        warning: '#E0A011',
        danger: '#EF4444',
        'cool-glow': '#5B6CFF',
      },

      // -----------------------------------------------------------------
      // Spacing (8pt scale — extends Tailwind's default scale)
      // -----------------------------------------------------------------
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
      },

      // -----------------------------------------------------------------
      // Border radius
      // -----------------------------------------------------------------
      borderRadius: {
        sm: '8px',
        md: '14px',
        lg: '20px',
        xl: '26px',
        full: '9999px',
      },

      // -----------------------------------------------------------------
      // Font families
      // -----------------------------------------------------------------
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },

      // -----------------------------------------------------------------
      // Font sizes (with line-heights)
      // -----------------------------------------------------------------
      fontSize: {
        'amount-hero': ['40px', { lineHeight: '44px' }],
        amount:        ['20px', { lineHeight: '24px' }],
        display:       ['28px', { lineHeight: '34px' }],
        heading:       ['18px', { lineHeight: '22px' }],
        title:         ['15px', { lineHeight: '20px' }],
        button:        ['15px', { lineHeight: '20px' }],
        label:         ['13px', { lineHeight: '18px' }],
        body:          ['14px', { lineHeight: '20px' }],
        caption:       ['12px', { lineHeight: '15px' }],
      },

      // -----------------------------------------------------------------
      // Box shadows
      // -----------------------------------------------------------------
      boxShadow: {
        card:          '0 18px 44px -6px rgba(0,0,0,0.50), 0 2px 8px 0 rgba(0,0,0,0.28)',
        'accent-glow': '0 12px 30px 0 rgba(255,106,26,0.50)',
        'marker-glow': '0 0 8px 0 rgba(255,255,255,0.60)',
        'rim-light':   'inset 0 1px 0 0 rgba(255,255,255,0.18)',
      },
    },
  },
};
