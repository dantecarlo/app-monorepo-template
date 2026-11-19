#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-dependency-seams — the dependency registry holds every package the
// workspace declares, only those, with seams that exist; the files ESLint
// skips keep their imports inside those seams; and the frozen allowlist of
// local/dependency-seam only shrinks.
//
// Fails, one finding per problem:
//   - a registry that cannot be read, or an entry that breaks its shape (a
//     category outside the seven, a non-core entry with no seam, a core
//     entry with one, an owner that is not text, a name listed twice);
//     reported alone, since every other check reads the registry. Whether
//     an owner names a capability is verify-manifest-coverage's to judge;
//   - a dependency of the root, an apps/* or a packages/* package.json that
//     no entry names, and such a package.json that cannot be read or is not
//     a JSON object, which also stops the stale-entry check below;
//   - a stale entry: its package is declared by no package.json (the node:*
//     entry of the builtins excepted);
//   - a seam or test-infrastructure glob that matches no file under apps/ or
//     packages/;
//   - a source file under apps/ or packages/ that cannot be parsed;
//   - a file ESLint does not lint (the configs its ignore list skips) that
//     imports a package outside its seam, or an unregistered one;
//   - eslint-dependency-seam-allowlist.json: a stale entry (its file no
//     longer imports that package outside the seam), a violation it does not
//     list, a pair listed twice, an entry without a path, a package or a
//     reason starting with the F.8 unit that removes it.
//
// Every violation is re-derived from the source with the detection the rule
// runs (eslint-local-rules/dependency-seam.detect.mjs), uncached, so a lint
// result Turborepo replays cannot hide one. Which files ESLint lints is asked
// of ESLint itself, with the repository's eslint.config.mjs.
//
// Usage:
//   node scripts/verify-dependency-seams.mjs [--root <dir>]
// ---------------------------------------------------------------------------

import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { ESLint } from 'eslint'
import tseslint from 'typescript-eslint'

import {
  collectImportSites,
  DEPENDENCY_REGISTRY_FILE,
  SEAM_ALLOWLIST_FILE
} from '../eslint-local-rules/dependency-seam.detect.mjs'
import {
  countViolations,
  FINDING_KIND,
  judgeSeams
} from './dependency-seams.detect.mjs'
import {
  declaredPackages,
  isWorkspaceManifest,
  MANIFEST_FILE,
  readManifestAt,
  WORKSPACE_GROUPS
} from './eslint-config.detect.mjs'
import { defineGate, reportGate } from './gate/gate.mjs'

export { FINDING_KIND }

const REPO_ROOT = resolve(import.meta.dirname, '..')
const ESLINT_CONFIG = join(REPO_ROOT, 'eslint.config.mjs')

const SOURCE_FILE = /\.[cm]?[jt]sx?$/u
// Folders never walked: dependencies, caches and build output.
const SKIPPED_DIRS = new Set([
  '.expo',
  '.next',
  '.turbo',
  '.vercel',
  'android',
  'build',
  'coverage',
  'dist',
  'dist-web',
  'ios',
  'node_modules',
  'out'
])

const toPosix = (path) => path.replaceAll('\\', '/')

const readJson = ({ path }) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    return { unreadable: error.message }
  }
}

// Every file under apps/ and packages/, repository-relative, sorted. The
// workspace folders, and what a manifest declares, are the ones the ESLint
// config reads (./eslint-config.detect.mjs).
const listFiles = ({ root }) =>
  WORKSPACE_GROUPS.flatMap((group) => {
    try {
      return readdirSync(join(root, group), {
        recursive: true,
        withFileTypes: true
      })
        .filter((entry) => entry.isFile())
        .map((entry) =>
          toPosix(relative(root, join(entry.parentPath, entry.name)))
        )
        .filter(
          (path) => !path.split('/').some((part) => SKIPPED_DIRS.has(part))
        )
    } catch {
      return []
    }
  }).sort()

// `{ names, path }` for every manifest, or `{ path, problem }` for one that
// cannot be read: it is reported, never skipped.
const readManifests = ({ files, root }) =>
  [MANIFEST_FILE, ...files.filter(isWorkspaceManifest)].map((path) => {
    const { manifest, problem } = readManifestAt({ path, root })
    return problem
      ? { path, problem }
      : { names: declaredPackages({ manifest }), path }
  })

const parse = ({ path, root }) =>
  tseslint.parser.parseForESLint(readFileSync(join(root, path), 'utf8'), {
    ecmaVersion: 'latest',
    filePath: path,
    loc: true,
    range: true,
    sourceType: 'module'
  }).ast

const readSites = ({ isLinted, paths, root }) => {
  const sites = []
  const unparsed = []
  paths.forEach((path) => {
    try {
      const linted = isLinted(path)
      collectImportSites({ program: parse({ path, root }) }).forEach(
        ({ source, typeOnly }) =>
          sites.push({ linted, path, source, typeOnly })
      )
    } catch (error) {
      unparsed.push({ message: error.message, path })
    }
  })
  return { sites, unparsed }
}

// `isLinted(path)` answers whether ESLint lints a repository-relative path.
export const collectContext = ({ isLinted, root }) => {
  const files = listFiles({ root })
  const sources = files.filter((path) => SOURCE_FILE.test(path))
  const { sites, unparsed } = readSites({ isLinted, paths: sources, root })
  return {
    allowlist: readJson({ path: join(root, SEAM_ALLOWLIST_FILE) }),
    files,
    manifests: readManifests({ files, root }),
    registry: readJson({ path: join(root, DEPENDENCY_REGISTRY_FILE) }),
    sites,
    sources,
    unlinted: sources.filter((path) => !isLinted(path)),
    unparsed
  }
}

export const gate = defineGate({
  claims:
    'every dependency of every package.json is registered in ' +
    '.agents/contracts/dependencies.json, every entry is declared and well ' +
    'formed, every seam glob matches a file, every file ESLint does not lint ' +
    'imports inside its seams, and every entry of ' +
    'eslint-dependency-seam-allowlist.json names an import that still ' +
    'breaks local/dependency-seam and the F.8 unit that removes it, with ' +
    'every such import listed.',
  id: 'verify-dependency-seams',
  notCovered:
    'a name imported from a package that local/wrapped-import does not ' +
    'narrow (Pressable and TextInput, which no ui block is named after; a ' +
    'block that stands in for a primitive under another name); a specifier ' +
    'that is not a literal; triple-slash ' +
    'type references and declare module augmentations; imports in CSS and ' +
    'in JSON (an Expo plugin); a subpath entry no file imports any longer; ' +
    'a type a wrapper re-exports; whether a seam is the right one, and ' +
    'whether a frozen import should be frozen at all, which review reads.',
  run: (context) => judgeSeams(context)
})

const plural = ({ count, one, many }) =>
  `${count} ${count === 1 ? one : many}`

// The files ESLint ignores, as eslint.config.mjs decides, read from `root`.
const listUnlinted = async ({ files, root }) => {
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: ESLINT_CONFIG
  })
  const ignored = await Promise.all(
    files.map(async (path) => ({
      ignored: await eslint.isPathIgnored(join(root, path)),
      path
    }))
  )
  return new Set(
    ignored.filter((row) => row.ignored).map(({ path }) => path)
  )
}

const main = async () => {
  const { values } = parseArgs({
    options: { root: { default: REPO_ROOT, type: 'string' } }
  })
  const root = resolve(values.root)
  const unlinted = await listUnlinted({
    files: listFiles({ root }).filter((path) => SOURCE_FILE.test(path)),
    root
  })
  const context = collectContext({
    isLinted: (path) => !unlinted.has(path),
    root
  })
  const entries = Array.isArray(context.registry?.packages)
    ? context.registry.packages.length
    : 0
  const outside = countViolations(context)
  const listed = Array.isArray(context.allowlist)
    ? context.allowlist.length
    : 0
  reportGate({
    context,
    denominator:
      `${plural({ count: entries, many: 'registry entries', one: 'registry entry' })}, ` +
      `${context.manifests.length} package.json file(s), ` +
      `${context.files.length} file(s) under apps/ and packages/ with ` +
      `${context.sources.length} source file(s) ` +
      `(${context.unlinted.length} that ESLint does not lint), ` +
      `${plural({ count: listed, many: 'allowlist entries', one: 'allowlist entry' })}, ` +
      (outside === null
        ? 'no file-package pair judged against a registry it refuses'
        : `${outside} file-package pair(s) outside their seam`),
    gate
  })
}

if (import.meta.main) await main()
