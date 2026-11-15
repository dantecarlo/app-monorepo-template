/** One SQL file of the package: its file name and its text. */
export interface ISqlFile {
  name: string
  sql: string
}

/** A migration that names a public object only a later migration creates. */
export interface IMigrationOrderViolation {
  /** The later migration, the first one that creates the object. */
  createdIn: string
  /** The migration that names the object too early. */
  migration: string
  /** The schema-qualified name, such as `public.profile`. */
  name: string
}
