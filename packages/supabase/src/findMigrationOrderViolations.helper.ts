import {
  PUBLIC_OBJECT_CREATE_PATTERN,
  PUBLIC_OBJECT_REFERENCE_PATTERN,
  PUBLIC_SCHEMA_PREFIX
} from '#src/migrationOrder.constant'
import { toSqlCode } from '#src/sqlCode.helper'
import type { IMigrationOrderViolation, ISqlFile } from '#src/sqlFile.type'

interface IFindMigrationOrderViolationsParams {
  migrations: ISqlFile[]
}

interface IMigrationCode {
  code: string
  name: string
}

const namesMatching = ({
  code,
  pattern
}: {
  code: string
  pattern: RegExp
}): string[] => Array.from(code.matchAll(pattern), ([, name]) => name)

/**
 * Every public type, table, view or function a migration names while only a later migration
 * creates it, the migrations read in name order, the order the Supabase CLI applies them.
 * Postgres checks a SQL function's body and every statement of a migration when it runs, so
 * each such name fails that migration on an empty database. Names are compared lower-cased,
 * as Postgres folds an unquoted identifier.
 */
export const findMigrationOrderViolations = ({
  migrations
}: IFindMigrationOrderViolationsParams): IMigrationOrderViolation[] => {
  const ordered: IMigrationCode[] = [...migrations]
    .sort((left, right) =>
      left.name < right.name ? -1 : Number(left.name > right.name)
    )
    .map(({ name, sql }) => ({
      code: toSqlCode({ sql }).toLowerCase(),
      name
    }))

  const firstCreator = new Map<string, number>()
  ordered.forEach(({ code }, index) => {
    namesMatching({ code, pattern: PUBLIC_OBJECT_CREATE_PATTERN }).forEach(
      (objectName) => {
        if (!firstCreator.has(objectName))
          firstCreator.set(objectName, index)
      }
    )
  })

  return ordered.flatMap(({ code, name }, index) =>
    [
      ...new Set(
        namesMatching({ code, pattern: PUBLIC_OBJECT_REFERENCE_PATTERN })
      )
    ].flatMap((objectName) => {
      const creator = firstCreator.get(objectName)
      return creator === undefined || creator <= index
        ? []
        : [
            {
              createdIn: ordered[creator].name,
              migration: name,
              name: `${PUBLIC_SCHEMA_PREFIX}${objectName}`
            }
          ]
    })
  )
}
