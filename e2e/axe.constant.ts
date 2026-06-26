// Key pages the page-level axe sweep visits. The template ships a single
// route today; downstream projects extend this list as they add screens, and
// every entry is scanned for zero accessibility violations.
export const AXE_KEY_PAGES = ['/'] as const

// WCAG rule tags the page-level scan enforces. These complement the
// component-level vitest-axe checks already wired per component.
export const AXE_RULE_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa'
] as const

// Rules explicitly called out as load-bearing for this template's posture:
// color contrast on the dark glass surfaces and valid ARIA roles.
export const AXE_REQUIRED_RULES = ['color-contrast', 'aria-roles'] as const
