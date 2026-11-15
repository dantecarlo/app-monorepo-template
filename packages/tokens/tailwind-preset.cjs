// Tailwind CSS preset for the shared glass design system (web and mobile).
// Token values are inlined here (duplicated from src/tokens.constant.ts) because
// CommonJS Tailwind config cannot require() TypeScript source directly.
//
// These colors are the DARK canon (themes.dark). Mobile flips to light at
// runtime via NativeWind colorScheme + the useThemeTokens() hook (StyleSheet
// consumers read themes[active]); the preset itself stays single-valued.
//
// Keep this file in sync with src/tokens.constant.ts (themes.dark) and
// apps/web/src/app/globals.css — scripts/verify-theme-sync.mjs compares every
// color of both themes with globals.css, and the dark theme with this preset.
// The scales below are not compared (__tests__/tailwind-preset.test.ts reads them).
//
// Loaded by both apps: apps/mobile/tailwind.config.js and
// apps/web/tailwind.config.cjs, which apps/web/src/app/globals.css loads with
// @config. On web the CSS @theme wins for a key both define, so the colors
// flip per theme there, and the scales come from this file alone.
//
// Usage in tailwind.config.js:
//   presets: [require('@app/tokens/tailwind-preset.cjs')]

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
          tertiary: '#9A9CA6',
          disabled: 'rgba(255,255,255,0.25)',
        },
        accent: {
          DEFAULT: '#FF6A1A',
          light: '#FF8A3D',
          ink: '#2A1402',
          surface: '#241A12',
          // Foreground variant of the brand accent for small TEXT — keeps the
          // `accent` fill untouched while text-on-surface meets WCAG AA.
          text: '#FF8A3D',
          tint: 'rgba(255,106,26,0.16)',
        },
        success: {
          DEFAULT: '#34C759',
          // Foreground variant of `success` for text on tint surfaces (AA).
          text: '#3DD168',
          tint: 'rgba(52,199,89,0.16)',
        },
        warning: {
          DEFAULT: '#E0A011',
          // Foreground variant of `warning` for text on tint surfaces (AA).
          text: '#EBB13A',
          tint: 'rgba(224,160,17,0.16)',
          stroke: 'rgba(224,160,17,0.30)',
        },
        danger: {
          DEFAULT: '#EF4444',
          // Foreground variant of `danger` for text on tint surfaces (AA).
          text: '#F36A6A',
          tint: 'rgba(239,68,68,0.16)',
        },
        neutral: {
          tint: 'rgba(255,255,255,0.08)',
        },
        scrim: 'rgba(0,0,0,0.60)',
        'cool-glow': '#5B6CFF',
        knob: {
          off: '#80828B',
          on: '#FFFFFF',
        },
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
        // Insets off the scale (inset in tokens.constant.ts).
        'knob-inset': '2.5px',
        'pill-x': '11px',
        'pill-y': '5px',
      },

      // -----------------------------------------------------------------
      // Layout widths (layoutWidth in tokens.constant.ts) — max-w-content
      // -----------------------------------------------------------------
      maxWidth: {
        narrow: '24rem',
        content: '28rem',
        dialog: '32rem',
        wide: '42rem',
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
        // Glyph sizes: a font size with no line height (glyphSize).
        'initials-sm': '10px',
        'initials-md': '13px',
        'initials-lg': '16px',
        'nav-icon':    '22px',
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
