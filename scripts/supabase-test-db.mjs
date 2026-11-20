#!/usr/bin/env node
// ---------------------------------------------------------------------------
// supabase-test-db — `pnpm --filter @app/supabase test:db`.
//
// Wires Node's files and processes into runTestDb
// (packages/supabase/src/testDbRun.helper.ts), which reads the target from
// `config.testDbTarget` of packages/supabase/package.json (linked, local or
// off), bundles every pgTAP file with the checkout's migrations that the
// database's ledger lacks, and runs `supabase test db --linked|--local` over
// the bundle from the package's folder. The bundle is a fresh folder of the
// system's temporary directory, removed after the run.
//
// It reads no .env: the Supabase CLI takes its credentials from the shell,
// where packages/supabase/docs/database.md § 9 says to load them.
//
// It belongs to the supabase capability of template.manifest.json, which a
// prune of that capability removes with packages/supabase.
//
// Usage:
//   node scripts/supabase-test-db.mjs [--dry-run]
//   --dry-run   write the bundle and name the command, running nothing
// ---------------------------------------------------------------------------

import { spawnSync } from 'node:child_process'
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { runTestDb } from '../packages/supabase/src/testDbRun.helper.ts'

const PACKAGE_DIR = resolve(import.meta.dirname, '../packages/supabase')
const MIGRATIONS_DIR = join(PACKAGE_DIR, 'supabase', 'migrations')
const TESTS_DIR = join(PACKAGE_DIR, 'supabase', 'tests')
const PACKAGE_MANIFEST = join(PACKAGE_DIR, 'package.json')
const SQL_EXTENSION = '.sql'
const BUNDLE_PREFIX = 'app-supabase-test-db-'

const readSqlFiles = ({ dir }) =>
  readdirSync(dir)
    .filter((name) => name.endsWith(SQL_EXTENSION))
    .sort()
    .map((name) => ({ name, sql: readFileSync(join(dir, name), 'utf8') }))

const { values } = parseArgs({
  options: { 'dry-run': { default: false, type: 'boolean' } }
})

process.exitCode = runTestDb({
  dryRun: values['dry-run'],
  io: {
    log: ({ line }) => console.log(line),
    logError: ({ line }) => console.error(line),
    readMigrations: () => readSqlFiles({ dir: MIGRATIONS_DIR }),
    readTarget: () =>
      JSON.parse(readFileSync(PACKAGE_MANIFEST, 'utf8')).config?.testDbTarget,
    readTests: () => readSqlFiles({ dir: TESTS_DIR }),
    removeBundle: ({ dir }) => rmSync(dir, { force: true, recursive: true }),
    runSupabase: ({ args }) => {
      const { error, status } = spawnSync('supabase', args, {
        cwd: PACKAGE_DIR,
        stdio: 'inherit'
      })
      return { error: error?.message, status }
    },
    writeBundle: ({ files }) => {
      const dir = mkdtempSync(join(tmpdir(), BUNDLE_PREFIX))
      for (const { name, sql } of files) writeFileSync(join(dir, name), sql)
      return dir
    }
  }
})
