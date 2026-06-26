// Deterministic glass-card recipe — the single source of truth the
// computed-style e2e asserts against. These values mirror the `.glass-card`
// rule in apps/web/src/app/globals.css (built from packages/tokens custom
// properties). If the glass recipe drifts in CSS, glass.e2e.ts fails here.
//
// Browsers serialize computed colors as `rgb(...)` / `rgba(...)` with a single
// space after each comma, so the expected fragments use that exact spelling.

export const GLASS_SELECTOR = '.glass-card'

export const GLASS_BACKDROP_BLUR = 'blur(26px)'

export const GLASS_BACKGROUND_COLOR = 'rgba(24, 27, 34, 0.42)'

export const GLASS_BORDER = '1px solid rgba(255, 255, 255, 0.1)'

export const GLASS_BORDER_WIDTH = '1px'

export const GLASS_BORDER_STYLE = 'solid'

export const GLASS_BORDER_COLOR = 'rgba(255, 255, 255, 0.1)'

// The composed box-shadow: card elevation (two layers) + inset rim light.
// Chromium's getComputedStyle re-serializes box-shadow as color-first, with
// `0px` (not `0`) zero lengths and a trailing `inset`, so each expected layer
// below mirrors that exact computed form. Each layer is asserted
// independently so the order between layers is irrelevant.
export const GLASS_SHADOW_ELEVATION_FAR =
  'rgba(0, 0, 0, 0.5) 0px 18px 44px -6px'

export const GLASS_SHADOW_ELEVATION_NEAR =
  'rgba(0, 0, 0, 0.28) 0px 2px 8px 0px'

export const GLASS_SHADOW_RIM_LIGHT =
  'rgba(255, 255, 255, 0.18) 0px 1px 0px 0px inset'

export const GLASS_SHADOW_LAYERS = [
  GLASS_SHADOW_ELEVATION_FAR,
  GLASS_SHADOW_ELEVATION_NEAR,
  GLASS_SHADOW_RIM_LIGHT
]
