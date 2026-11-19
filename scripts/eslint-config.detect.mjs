// ---------------------------------------------------------------------------
// eslint-config.detect — the workspace list, its manifests, and which
// frameworks each workspace declares (decision 52).
//
// A workspace is a folder under apps/ or packages/ that holds a
// package.json: an app or a package. eslint.config.mjs applies every shared
// rule set to apps/* and packages/* by pattern. What a framework forces it
// applies by what a package.json declares, read once when the config loads:
// the React rules to every app and package that declares react, the Next.js
// and Expo blocks to the apps that declare next or expo. So a new app or
// package, plain React for example, gets its rules with no config change.
//
// The gates read the same list from this module: verify:dependency-seams
// counts a manifest's packages the same way, verify:allowlist-freshness and
// verify:maps walk its apps, and verify:tests exempts the components and
// hooks of the apps that declare expo. The config and the gates cannot
// disagree about which folders are apps or what a package.json declares.
// ---------------------------------------------------------------------------

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { DEPENDENCY_FIELDS } from './dependency-seams.detect.mjs'

// The folders whose children are the workspace's packages.
export const WORKSPACE_GROUPS = Object.freeze(['apps', 'packages'])
export const MANIFEST_FILE = 'package.json'

export const APPS_GROUP = 'apps'
const WORKSPACE_MANIFEST_DEPTH = 3

// The frameworks an app may declare, each with its own block in the config.
const FRAMEWORK = Object.freeze({
  EXPO: 'expo',
  NEXT: 'next',
  REACT: 'react'
})

// `apps/<app>/package.json` or `packages/<package>/package.json`: the
// manifest of a workspace package, as a repository-relative path.
export const isWorkspaceManifest = (path) => {
  const parts = path.split('/')
  return (
    parts.length === WORKSPACE_MANIFEST_DEPTH &&
    WORKSPACE_GROUPS.includes(parts[0]) &&
    parts[2] === MANIFEST_FILE
  )
}

// Every package a manifest's dependency fields name, once each, sorted.
export const declaredPackages = ({ manifest }) =>
  [
    ...new Set(
      DEPENDENCY_FIELDS.flatMap((field) =>
        manifest?.[field] && typeof manifest[field] === 'object'
          ? Object.keys(manifest[field])
          : []
      )
    )
  ].sort()

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

// `{ manifest }` for a package.json that reads as a JSON object, else
// `{ problem }`, why it does not: the config and the gates read a manifest
// this one way.
export const readManifestAt = ({ path, root }) => {
  let text
  try {
    text = readFileSync(join(root, path), 'utf8')
  } catch (error) {
    return { problem: `cannot be read: ${error.message}` }
  }
  let manifest
  try {
    manifest = JSON.parse(text)
  } catch (error) {
    return { problem: `cannot be parsed: ${error.message}` }
  }
  return isPlainObject(manifest)
    ? { manifest }
    : { problem: 'is not a JSON object' }
}

// A manifest that cannot be read or parsed throws, naming the file: an app
// whose frameworks are unknown would lose their rules without a word.
const readManifest = ({ path, root }) => {
  const { manifest, problem } = readManifestAt({ path, root })
  if (problem) throw new Error(`${path} ${problem}`)
  return manifest
}

// `[{ dir, group }]`: every folder under apps/ and packages/ that holds a
// package.json, sorted by folder. A folder without one is no workspace.
export const listWorkspaces = ({ root }) =>
  WORKSPACE_GROUPS.flatMap((group) => {
    const groupDir = join(root, group)
    if (!existsSync(groupDir)) return []
    return readdirSync(groupDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `${group}/${entry.name}`)
      .sort()
      .filter((dir) => existsSync(join(root, dir, MANIFEST_FILE)))
      .map((dir) => ({ dir, group }))
  })

// `apps/<app>` for every app, sorted.
export const listApps = ({ root }) =>
  listWorkspaces({ root })
    .filter(({ group }) => group === APPS_GROUP)
    .map(({ dir }) => dir)

// The frameworks whose block an app alone takes: their file names belong to
// an app's router. React is every workspace's.
const APP_ONLY_FRAMEWORKS = new Set([FRAMEWORK.EXPO, FRAMEWORK.NEXT])

// `{ expo, next, react }`: the apps that declare expo, the apps that
// declare next, and every app and package that declares react, in any
// dependency field.
export const readFrameworks = ({ root }) => {
  const workspaces = listWorkspaces({ root }).map(({ dir, group }) => ({
    dir,
    group,
    manifest: readManifest({ path: `${dir}/${MANIFEST_FILE}`, root })
  }))
  return Object.fromEntries(
    Object.values(FRAMEWORK)
      .sort()
      .map((framework) => [
        framework,
        workspaces
          .filter(
            ({ group }) =>
              group === APPS_GROUP || !APP_ONLY_FRAMEWORKS.has(framework)
          )
          .filter(({ manifest }) =>
            declaredPackages({ manifest }).includes(framework)
          )
          .map(({ dir }) => dir)
      ])
  )
}
