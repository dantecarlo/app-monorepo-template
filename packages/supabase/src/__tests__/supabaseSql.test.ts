import { describe, expect, test } from 'vitest'

import { findMigrationOrderViolations } from '@/findMigrationOrderViolations.helper'
import { toSqlCode } from '@/sqlCode.helper'
import { MIGRATION_FILES, PGTAP_FILES } from '@/test/sqlFiles'

// pg_prove fails a file whose TAP output has no plan line, and finish() reports a count that
// differs from the plan, so every file the CLI runs declares both.
const PLAN_CALL_PATTERN = /\bselect\s+plan\s*\(\s*\d+\s*\)/i
const FINISH_CALL_PATTERN = /\bselect\s+\*\s+from\s+finish\s*\(\s*\)/i

describe('the package SQL files', () => {
  test('the migrations name no public object that only a later migration creates', () => {
    expect(MIGRATION_FILES.map(({ name }) => name)).toContain(
      '0001_extensions.sql'
    )
    expect(
      findMigrationOrderViolations({ migrations: MIGRATION_FILES })
    ).toEqual([])
  })

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
