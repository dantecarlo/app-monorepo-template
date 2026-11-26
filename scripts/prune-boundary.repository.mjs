// ---------------------------------------------------------------------------
// prune-boundary.repository — this repository, read the way the prune
// boundary judges it: every file git lists, the template.manifest.json it
// carries, and the prune of one capability that manifest declares.
//
// The checks of one capability's prune live in a suite of their own,
// scripts/prune-boundary.<capability>.test.mjs, which that capability
// claims: its prune deletes the suite with the rest of its files, so a
// project /init pruned runs every check its manifest still declares and
// carries none for a capability it no longer declares. This module is core
// and names no capability.
//
// The pure rule is findPruneLeaks (packages/tooling/src/prune-boundary.mjs),
// fed the glob matcher and the region reader of the manifest engine
// (scripts/manifest.mjs), as the coverage gate reads the manifest.
// ---------------------------------------------------------------------------

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

import { findPruneLeaks } from '../packages/tooling/src/prune-boundary.mjs'
import { gitFreeEnv } from './git-free-env.mjs'
import {
  analyzeCoverage,
  CORE_OWNER,
  dropRegions,
  matchesAny,
  parseRegions
} from './manifest.mjs'

export const REPO_ROOT = resolve(import.meta.dirname, '..')

const MANIFEST_FILE = 'template.manifest.json'
const SPEC_ROOT = 'openspec/specs/'
const REGISTRY_KIND = 'registry-'
const ALIASED_IMPORT = /import \{ \w+ as (\w+) \}/u
const LINE_BREAK = /\r?\n/u
const NEWLINE = '\n'
const POSIX_SEPARATOR = '/'

export const readRepositoryFile = ({ path }) =>
  readFileSync(join(REPO_ROOT, path), 'utf8')

export const REPOSITORY_MANIFEST = JSON.parse(
  readRepositoryFile({ path: MANIFEST_FILE })
)

// git lists the tracked files and the ones not yet added; a tracked file
// deleted in the work tree is gone after the prune too.
export const listRepositoryFiles = () =>
  execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    { cwd: REPO_ROOT, encoding: 'utf8', env: gitFreeEnv() }
  )
    .split('\0')
    .filter((path) => path !== '' && existsSync(join(REPO_ROOT, path)))

const capabilityOf = ({ capabilityId }) => {
  const capability = REPOSITORY_MANIFEST.capabilities.find(
    ({ id }) => id === capabilityId
  )
  if (!capability) {
    throw new Error(
      `${MANIFEST_FILE} declares no capability "${capabilityId}"`
    )
  }
  return capability
}

// The owners the manifest gives the file at `file`, an absolute path: the
// coverage gate holds every file to exactly one.
export const ownersOf = ({ file }) => {
  const path = relative(REPO_ROOT, file).split(sep).join(POSIX_SEPARATOR)
  return [
    { claims: REPOSITORY_MANIFEST.core, id: CORE_OWNER },
    ...REPOSITORY_MANIFEST.capabilities
  ]
    .filter(({ claims }) => matchesAny({ path, patterns: claims }))
    .map(({ id }) => id)
}

// Every reference a file the prune of `capabilityId` keeps still makes to
// what that prune deletes or removes, the kept files read without the
// capability's regions unless `regions` reads them otherwise.
export const pruneRepository = ({ capabilityId, regions = dropRegions }) =>
  findPruneLeaks({
    capabilityId,
    files: listRepositoryFiles(),
    manifest: REPOSITORY_MANIFEST,
    dropRegions: regions,
    matches: matchesAny,
    readText: readRepositoryFile
  })

export const registryFindingsOf = ({ leaks }) =>
  leaks.filter(({ kind }) => kind.startsWith(REGISTRY_KIND))

// The patterns of every file the prune of `capabilityId` deletes: its
// claims and the paths of its `remove` actions.
const prunedPatternsOf = ({ capabilityId }) => {
  const capability = capabilityOf({ capabilityId })
  return [
    ...capability.claims,
    ...(capability.onAbsent ?? [])
      .filter(({ verb }) => verb === 'remove')
      .flatMap(({ paths }) => paths)
  ]
}

export const prunedFilesOf = ({ capabilityId }) => {
  const patterns = prunedPatternsOf({ capabilityId })
  return listRepositoryFiles().filter((path) =>
    matchesAny({ path, patterns })
  )
}

// The claims on a living spec the coverage gate would find matching no
// file once `capabilityId` is pruned: the files it claims or removes
// deleted, and the manifest no longer declaring it.
export const staleSpecClaimsAfter = ({ capabilityId }) => {
  const patterns = prunedPatternsOf({ capabilityId })
  const kept = listRepositoryFiles().filter(
    (path) => !matchesAny({ path, patterns })
  )
  const manifest = {
    ...REPOSITORY_MANIFEST,
    capabilities: REPOSITORY_MANIFEST.capabilities.filter(
      ({ id }) => id !== capabilityId
    )
  }
  return analyzeCoverage({ files: kept, manifest }).staleClaims.filter(
    ({ claim }) => claim.startsWith(SPEC_ROOT)
  )
}

// An app's auth gateway adapter imports a backend's gateway inside that
// backend's region and lists it inside a region of the same owner, so the
// backend's prune drops the import and the entry together. Each region
// whose import some other region names in a region of another owner, or
// in none, is returned with the owners that name it.
export const misplacedGatewaysOf = ({ app }) => {
  const path = `apps/${app}/src/lib/auth/authGateway.adapter.ts`
  const text = readRepositoryFile({ path })
  const lines = text.split(LINE_BREAK)
  const { regions } = parseRegions({ text })
  const body = ({ end, start }) =>
    lines.slice(start - 1, end).join(NEWLINE)
  return regions.flatMap((region) => {
    const imported = ALIASED_IMPORT.exec(body(region))?.[1]
    if (!imported) return []
    const listedBy = regions
      .filter(
        (other) =>
          other !== region &&
          new RegExp(`\\b${imported}\\b`, 'u').test(body(other))
      )
      .map(({ owner }) => owner)
    const placed = listedBy.length === 1 && listedBy[0] === region.owner
    return placed
      ? []
      : [{ imported, listedBy, owner: region.owner, path }]
  })
}
