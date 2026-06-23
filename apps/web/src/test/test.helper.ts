// Re-exports from @testing-library/react.
// Import testing utilities from here, NOT directly from
// @testing-library/react (keeps a single seam for render config / providers).
export {
  act,
  render,
  renderHook,
  screen,
  waitFor
} from '@testing-library/react'
