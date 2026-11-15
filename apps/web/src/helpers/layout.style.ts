// Shared layout classes of the web app: positioning only. A screen or a route
// entry composes these; the look of what it places lives in a component
// (AGENTS.md § Styling lives in the components).

export const LAYOUT = {
  CONTENT_AREA: 'relative z-10',
  MAX_WIDTH: 'max-w-content mx-auto',
  SCREEN_PADDING: 'px-4',
  SECTION_GAP: 'space-y-4'
} as const
