import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'

import type { NextConfig } from 'next'
import { afterAll, expect, test } from 'vitest'

import { applyConfigPlugins } from '../next.config'

// Each folder holds capability files written for one test, outside the work
// tree; afterAll removes them.
const FOLDERS: string[] = []

const folderWith = ({ files }: { files: Record<string, string> }) => {
  const folder = mkdtempSync(join(tmpdir(), 'next-config-plugins-'))
  FOLDERS.push(folder)
  Object.entries(files).forEach(([name, source]) =>
    writeFileSync(join(folder, name), source)
  )
  return folder
}

// A capability file that records its step on the config.
const stepPlugin =
  ({ step }: { step: string }) =>
  ({ config }: { config: NextConfig & { steps?: string[] } }) => ({
    ...config,
    steps: [...(config.steps ?? []), step]
  })

afterAll(() => {
  FOLDERS.forEach((folder) => rmSync(folder, { recursive: true }))
})

test('applies every next-<capability>.config.ts beside it, in name order', async () => {
  const dir = folderWith({
    files: {
      'next-alpha.config.ts': 'export {}\n',
      'next-beta.config.ts': 'export {}\n',
      'other.config.ts': 'export {}\n'
    }
  })
  const loaded: string[] = []
  const load = async ({ path }: { path: string }) => {
    loaded.push(basename(path))
    return stepPlugin({ step: basename(path) })
  }

  const applied = await applyConfigPlugins({
    config: { reactStrictMode: true },
    dir,
    load
  })

  expect(loaded).toEqual(['next-alpha.config.ts', 'next-beta.config.ts'])
  expect(applied).toEqual({
    reactStrictMode: true,
    steps: ['next-alpha.config.ts', 'next-beta.config.ts']
  })
})

test('keeps the config as built when no capability file is beside it', async () => {
  const config: NextConfig = { reactStrictMode: true }
  const dir = folderWith({ files: { 'next.config.ts': 'export {}\n' } })

  expect(await applyConfigPlugins({ config, dir })).toBe(config)
})
