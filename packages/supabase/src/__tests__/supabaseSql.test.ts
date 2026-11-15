import { describe, expect, test } from 'vitest'

import { findMigrationOrderViolations } from '@/findMigrationOrderViolations.helper'
import { MIGRATION_FILES } from '@/test/sqlFiles'

describe('the package SQL files', () => {
  test('the migrations name no public object that only a later migration creates', () => {
    expect(MIGRATION_FILES.map(({ name }) => name)).toContain(
      '0001_extensions.sql'
    )
    expect(
      findMigrationOrderViolations({ migrations: MIGRATION_FILES })
    ).toEqual([])
  })
})
