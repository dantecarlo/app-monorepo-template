import { describe, expect, test } from 'vitest'

import { toSqlCode } from '@/sqlCode.helper'
import { PGTAP_FILES } from '@/test/sqlFiles'

// pg_prove fails a file whose TAP output has no plan line, and finish() reports a count that
// differs from the plan, so every file the CLI runs declares both.
const PLAN_CALL_PATTERN = /\bselect\s+plan\s*\(\s*\d+\s*\)/i
const FINISH_CALL_PATTERN = /\bselect\s+\*\s+from\s+finish\s*\(\s*\)/i

describe('the package pgTAP files', () => {
  test('every pgTAP file declares a plan and calls finish', () => {
    expect(PGTAP_FILES.map(({ name }) => name)).toContain(
      'rls_profile.test.sql'
    )
    expect(
      PGTAP_FILES.filter(({ sql }) => {
        const code = toSqlCode({ sql })
        return (
          !PLAN_CALL_PATTERN.test(code) || !FINISH_CALL_PATTERN.test(code)
        )
      }).map(({ name }) => name)
    ).toEqual([])
  })
})
