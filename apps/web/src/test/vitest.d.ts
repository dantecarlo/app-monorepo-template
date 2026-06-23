// jest-dom matchers (toBeInTheDocument, etc.).
import '@testing-library/jest-dom/vitest'

import type { AxeMatchers } from 'vitest-axe/matchers'

// vitest-axe 0.1.0 augments the legacy `Vi.Assertion` namespace, which
// Vitest 2 no longer maps onto its `Assertion` interface. Augment the
// Vitest 2 interfaces directly so toHaveNoViolations type-checks.
declare module 'vitest' {
  interface Assertion<T = unknown> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
