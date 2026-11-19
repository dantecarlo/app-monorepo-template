// ---------------------------------------------------------------------------
// eslint-config.detect — the workspace manifests, and which frameworks each
// app declares (decision 52).
//
// eslint.config.mjs applies every shared rule set to apps/* and packages/*
// by pattern. What a framework forces (the React rules, the Next.js block,
// the Expo block) it applies to the apps whose package.json declares that
// framework, read once when the config loads, so a new app, plain React for
// example, gets its rules with no config change.
//
// verify:dependency-seams reads the same workspace folders and counts a
// manifest's packages the same way, from this module, so the config and the
// gate cannot disagree about what a package.json declares.
// ---------------------------------------------------------------------------

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { DEPENDENCY_FIELDS } from './dependency-seams.detect.mjs'

// The folders whose children are the workspace's packages.
export const WORKSPACE_GROUPS = Object.freeze(['apps', 'packages'])
export const MANIFEST_FILE = 'package.json'

const APPS_GROUP = 'apps'
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

// `[{ dir, manifest }]` for every folder under apps/ that holds a
// package.json, sorted by folder. A folder without one is no app.
const readAppManifests = ({ root }) => {
  const appsDir = join(root, APPS_GROUP)
  if (!existsSync(appsDir)) return []
  return readdirSync(appsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `${APPS_GROUP}/${entry.name}`)
    .sort()
    .filter((dir) => existsSync(join(root, dir, MANIFEST_FILE)))
    .map((dir) => ({
      dir,
      manifest: readManifest({ path: `${dir}/${MANIFEST_FILE}`, root })
    }))
}

// `{ expo, next, react }`: the folders of the apps that declare each
// framework, in any dependency field.
const appsByFramework = ({ apps }) =>
  Object.fromEntries(
    Object.values(FRAMEWORK)
      .sort()
      .map((framework) => [
        framework,
        apps
          .filter(({ manifest }) =>
            declaredPackages({ manifest }).includes(framework)
          )
          .map(({ dir }) => dir)
      ])
  )

export const readAppFrameworks = ({ root }) =>
  appsByFramework({ apps: readAppManifests({ root }) })
