// The targets of test:db, read from `config.testDbTarget` of packages/supabase/package.json:
// the linked cloud project, a local Supabase stack, or no database test.
export const TEST_DB_TARGET = {
  LINKED: 'linked',
  LOCAL: 'local',
  OFF: 'off'
} as const

// The target when the key is unset.
export const DEFAULT_TEST_DB_TARGET = TEST_DB_TARGET.LINKED

// Where the target is set, as the messages name it.
export const TEST_DB_TARGET_SETTING =
  'config.testDbTarget of packages/supabase/package.json'

// `supabase test db` and the flag that points it at each target that runs suites.
export const SUPABASE_COMMAND = 'supabase'
export const SUPABASE_TEST_DB_ARGS = ['test', 'db']
export const TEST_DB_TARGET_FLAG = {
  [TEST_DB_TARGET.LINKED]: '--linked',
  [TEST_DB_TARGET.LOCAL]: '--local'
} as const

export const EXIT_SUCCESS = 0
export const EXIT_FAILURE = 1

export const ARGUMENT_SEPARATOR = ' '
export const LIST_SEPARATOR = ', '
export const LAST_LIST_SEPARATOR = ' or '
