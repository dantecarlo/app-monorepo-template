import { expect, test } from 'vitest'

import { isConstantTimeEqual } from '#src/constantTimeEqual.helper'

const EXPECTED = 'origin-secret'

test('isConstantTimeEqual is true for the same string only', () => {
  const differentFirst = `X${EXPECTED.slice(1)}`
  const differentLast = `${EXPECTED.slice(0, -1)}X`
  expect(
    isConstantTimeEqual({ expected: EXPECTED, presented: EXPECTED })
  ).toBe(true)
  expect(
    isConstantTimeEqual({ expected: EXPECTED, presented: differentFirst })
  ).toBe(false)
  expect(
    isConstantTimeEqual({ expected: EXPECTED, presented: differentLast })
  ).toBe(false)
  expect(
    isConstantTimeEqual({
      expected: EXPECTED,
      presented: EXPECTED.slice(0, -1)
    })
  ).toBe(false)
  expect(
    isConstantTimeEqual({ expected: EXPECTED, presented: `${EXPECTED}X` })
  ).toBe(false)
})
