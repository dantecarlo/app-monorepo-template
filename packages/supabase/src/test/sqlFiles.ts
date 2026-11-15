import type { ISqlFile } from '#src/sqlFile.type'

// The package's SQL files, read offline at test time. Each glob is relative to this file.
const toSqlFiles = ({
  files
}: {
  files: Record<string, string>
}): ISqlFile[] =>
  Object.entries(files)
    .map(([path, sql]) => ({ name: path.split('/').at(-1) ?? path, sql }))
    .sort((left, right) =>
      left.name < right.name ? -1 : Number(left.name > right.name)
    )

export const MIGRATION_FILES = toSqlFiles({
  files: import.meta.glob('../../supabase/migrations/*.sql', {
    eager: true,
    import: 'default',
    query: '?raw'
  })
})
