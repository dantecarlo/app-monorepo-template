import '@testing-library/jest-dom/vitest'

import type { AxeMatchers } from 'vitest-axe/matchers'

declare module 'vitest' {
  // T takes no default here: the declarations of a merged interface must
  // agree on their type parameters, and vitest's own declaration sets it.
  interface Assertion<T> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
