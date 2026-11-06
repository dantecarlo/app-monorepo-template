import { expect, test } from 'vitest'

import { hostConsole } from './hostConsole.helper'

// The seam is type-level, but it carries one runtime obligation: it must
// resolve to a real object in whatever runtime the package is compiled for.
// A host that lacks console fails this test.

test('hostConsole exposes the members the package depends on', () => {
  expect(typeof hostConsole.error).toBe('function')
  expect(typeof hostConsole.warn).toBe('function')
})
