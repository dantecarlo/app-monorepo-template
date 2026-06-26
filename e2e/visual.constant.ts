// Visual-regression configuration. Snapshots are taken per key screen across
// these breakpoints. Pixel tolerance absorbs font-rendering differences
// between hosts so a locally generated baseline does not hard-fail on a
// container; CI either matches the baseline OS or re-generates with
// `--update-snapshots`.
export const VISUAL_KEY_PAGES = ['/'] as const

export interface IVisualBreakpoint {
  name: string
  height: number
  width: number
}

export const VISUAL_BREAKPOINTS: readonly IVisualBreakpoint[] = [
  { height: 844, name: 'mobile-390', width: 390 },
  { height: 1024, name: 'tablet-768', width: 768 },
  { height: 800, name: 'desktop-1280', width: 1280 }
]

// Allow up to 1% of pixels to differ before failing — wide enough to swallow
// subpixel font hinting across hosts, narrow enough to catch real layout or
// color drift.
export const VISUAL_MAX_DIFF_PIXEL_RATIO = 0.01

// Per-pixel color-distance threshold (0 strict, 1 loose). Pairs with the
// ratio above to tolerate anti-aliasing noise.
export const VISUAL_PIXEL_THRESHOLD = 0.2
