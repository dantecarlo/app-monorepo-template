import { describe, expect, test } from 'vitest'

import { bundlePgTapFiles } from '@/pgTapBundle.helper'
import type { ISqlFile } from '@/sqlFile.type'
import { runTestDb } from '@/testDbRun.helper'
import type { ITestDbCliResult } from '@/testDbRun.type'

const MIGRATIONS = [
  { name: '0001_base.sql', sql: 'create table public.t (id int);' }
]
const TESTS = [
  {
    name: 'rls.test.sql',
    sql: "begin;\nselect plan(1);\nselect ok(true, 'holds');\nselect * from finish();\nrollback;\n"
  }
]
const BUNDLE_DIR = '/tmp/app-supabase-test-db-abc'
const PASSED = { status: 0 }

interface IFakeIoParams {
  result?: ITestDbCliResult
  target?: unknown
  tests?: ISqlFile[]
}

// A fake of the runner's files, folders and processes, recording each call.
const fakeIo = ({
  result = PASSED,
  target,
  tests = TESTS
}: IFakeIoParams = {}) => {
  const calls = {
    errors: [] as string[],
    lines: [] as string[],
    read: [] as string[],
    removed: [] as string[],
    runs: [] as string[][],
    written: [] as ISqlFile[][]
  }
  const io = {
    log: ({ line }: { line: string }) => {
      calls.lines.push(line)
    },
    logError: ({ line }: { line: string }) => {
      calls.errors.push(line)
    },
    readMigrations: () => {
      calls.read.push('migrations')
      return MIGRATIONS
    },
    readTarget: () => target,
    readTests: () => {
      calls.read.push('tests')
      return tests
    },
    removeBundle: ({ dir }: { dir: string }) => {
      calls.removed.push(dir)
    },
    runSupabase: ({ args }: { args: string[] }) => {
      calls.runs.push(args)
      return result
    },
    writeBundle: ({ files }: { files: ISqlFile[] }) => {
      calls.written.push(files)
      return BUNDLE_DIR
    }
  }
  return { calls, io }
}

const BUNDLE = bundlePgTapFiles({ migrations: MIGRATIONS, tests: TESTS })

describe('runTestDb', () => {
  test('runs supabase test db --linked over the bundle when the config names no target', () => {
    const { calls, io } = fakeIo()

    expect(runTestDb({ dryRun: false, io })).toBe(0)
    expect(calls.written).toEqual([BUNDLE])
    expect(calls.runs).toEqual([['test', 'db', '--linked', BUNDLE_DIR]])
    expect(calls.removed).toEqual([BUNDLE_DIR])
    expect(calls.lines).toEqual([
      `test:db: supabase test db --linked ${BUNDLE_DIR} (target linked)`
    ])
    expect(calls.errors).toEqual([])
  })

  test('runs supabase test db --linked over the bundle for the linked target', () => {
    const { calls, io } = fakeIo({ target: 'linked' })

    expect(runTestDb({ dryRun: false, io })).toBe(0)
    expect(calls.written).toEqual([BUNDLE])
    expect(calls.runs).toEqual([['test', 'db', '--linked', BUNDLE_DIR]])
    expect(calls.removed).toEqual([BUNDLE_DIR])
  })

  test('runs supabase test db --local over the bundle for the local target', () => {
    const { calls, io } = fakeIo({ target: 'local' })

    expect(runTestDb({ dryRun: false, io })).toBe(0)
    expect(calls.written).toEqual([BUNDLE])
    expect(calls.runs).toEqual([['test', 'db', '--local', BUNDLE_DIR]])
    expect(calls.removed).toEqual([BUNDLE_DIR])
    expect(calls.lines).toEqual([
      `test:db: supabase test db --local ${BUNDLE_DIR} (target local)`
    ])
  })

  test('runs no database test for the off target', () => {
    const { calls, io } = fakeIo({ target: 'off' })

    expect(runTestDb({ dryRun: false, io })).toBe(0)
    expect(calls.read).toEqual([])
    expect(calls.written).toEqual([])
    expect(calls.runs).toEqual([])
    expect(calls.removed).toEqual([])
    expect(calls.lines).toEqual([
      'test:db: no database test runs: config.testDbTarget of packages/supabase/package.json is off'
    ])
    expect(calls.errors).toEqual([])
  })

  test('refuses a target it does not know, naming the ones it takes', () => {
    const { calls, io } = fakeIo({ target: 'cloud' })

    expect(runTestDb({ dryRun: false, io })).toBe(1)
    expect(calls.read).toEqual([])
    expect(calls.written).toEqual([])
    expect(calls.runs).toEqual([])
    expect(calls.errors).toEqual([
      'test:db ran nothing: config.testDbTarget of packages/supabase/package.json is "cloud"; it takes linked, local or off'
    ])
  })

  test('refuses a null target, naming the setting', () => {
    const { calls, io } = fakeIo({ target: null })

    expect(runTestDb({ dryRun: false, io })).toBe(1)
    expect(calls.read).toEqual([])
    expect(calls.written).toEqual([])
    expect(calls.runs).toEqual([])
    expect(calls.errors).toEqual([
      'test:db ran nothing: config.testDbTarget of packages/supabase/package.json is null; it takes linked, local or off'
    ])
  })

  test('writes the bundle and names the command without running it on a dry run', () => {
    const { calls, io } = fakeIo({ target: 'linked' })

    expect(runTestDb({ dryRun: true, io })).toBe(0)
    expect(calls.written).toEqual([BUNDLE])
    expect(calls.runs).toEqual([])
    expect(calls.removed).toEqual([])
    expect(calls.lines).toEqual([
      `test:db: dry run, nothing ran; it would run supabase test db --linked ${BUNDLE_DIR} (target linked), and the bundle stays in ${BUNDLE_DIR}`
    ])
  })

  test('fails with the exit status of the CLI when a suite fails', () => {
    const { calls, io } = fakeIo({ result: { status: 3 } })

    expect(runTestDb({ dryRun: false, io })).toBe(3)
    expect(calls.removed).toEqual([BUNDLE_DIR])
    expect(calls.errors).toEqual([])
  })

  test('fails when the Supabase CLI cannot start', () => {
    const { calls, io } = fakeIo({
      result: { error: 'spawnSync supabase ENOENT', status: null }
    })

    expect(runTestDb({ dryRun: false, io })).toBe(1)
    expect(calls.removed).toEqual([BUNDLE_DIR])
    expect(calls.errors).toEqual([
      'test:db: the Supabase CLI could not start: spawnSync supabase ENOENT'
    ])
  })

  test('runs nothing when a pgTAP file cannot be bundled', () => {
    const outside = {
      name: 'outside.test.sql',
      sql: 'select plan(1);\nrollback;\n'
    }
    const { calls, io } = fakeIo({ tests: [outside] })

    expect(runTestDb({ dryRun: false, io })).toBe(1)
    expect(calls.written).toEqual([])
    expect(calls.runs).toEqual([])
    expect(calls.errors).toEqual([
      'test:db ran nothing: outside.test.sql does not open with begin;, so the migrations would run outside its transaction'
    ])
  })
})
