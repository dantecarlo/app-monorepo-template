// @ts-check
// ---------------------------------------------------------------------------
// wrapped-import.detect — a name a project wrapper owns is imported only by
// that wrapper.
//
// Shared by the ESLint rule local/wrapped-import (./index.mjs) and its suite
// (./wrapped-import.cases.mjs). local/dependency-seam judges a package; this
// judges the names a file imports from two core packages whose names have a
// wrapper (decision 58):
//   - `react-native`: a name one of the app's `src/components/ui/` folders is
//     named after (ui/Text for `Text`, ui/Modal for `Modal`) passes only under
//     that folder. The folders are read from disk, per app, so a block added
//     later covers its primitive with no edit here, and a block removed stops
//     covering it. A name no block is named after (`View`, `Pressable`)
//     passes anywhere.
//   - `expo-router`: a hook (`use` and a capital) and the `router` object,
//     useRouter's navigation outside React, pass only under the app's
//     `src/lib/routing/`; the layout components and the types pass anywhere.
// A file under a test-infrastructure glob of the registry (`src/test/**`)
// passes any name, and a test is judged as the unit beside it.
//
// Read: named imports, type-only ones included, judged by the name the
// module exports (not the local alias); named re-exports; the keys of the
// object a `vi.mock` or `vi.doMock` factory returns; and the names a literal
// dynamic `import()` or `require()` is destructured into or read by. A reach
// of the whole module (a namespace import, `export *`, `import x =
// require()`, an `import()` or `require()` read any other way, a `vi.mock`
// with no factory or one whose object cannot be read) is refused where one of
// its narrowed names would be.
// ---------------------------------------------------------------------------

import { readdirSync } from 'node:fs'
import { join, posix } from 'node:path'

import { isInScope, unitPathsOf } from './dependency-seam.detect.mjs'

const PRIMITIVE_PACKAGE = 'react-native'
const ROUTER_PACKAGE = 'expo-router'

export const WRAPPED_FINDING = Object.freeze({
  HOOK_OUTSIDE_ROUTING: 'hookOutsideRouting',
  PRIMITIVE_OUTSIDE_BLOCK: 'primitiveOutsideBlock',
  WHOLE_MODULE: 'wholeModule'
})

const UI_FOLDER = 'src/components/ui'
const ROUTING_FOLDER = 'src/lib/routing'
const ROUTER_HOOK_RE = /^use[A-Z]/u
const ROUTER_OBJECT = 'router'
const APP_RE = /^(?<app>apps\/[^/]+)\//u
const MISSING_DIRECTORY = 'ENOENT'

// The `vi` helpers that replace a module, and so its names.
const VI_REPLACING_HELPERS = new Set(['doMock', 'mock'])

// ---------------------------------------------------------------------------
// The ui blocks of an app, read from disk
// ---------------------------------------------------------------------------

// The folder names under `<root>/<appDir>/src/components/ui/`; none when
// the app has no such folder. Any other read error throws, so a broken read
// never passes every import silently.
const readUiBlocks = ({ appDir, root }) => {
  try {
    return new Set(
      readdirSync(join(root, appDir, UI_FOLDER), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    )
  } catch (error) {
    if (error?.code === MISSING_DIRECTORY) return new Set()
    throw error
  }
}

// A reader of the ui blocks under `root` that reads each app once.
export const createUiBlockReader = ({ root }) => {
  const cache = new Map()
  return (appDir) => {
    if (!cache.has(appDir)) {
      cache.set(appDir, readUiBlocks({ appDir, root }))
    }
    return cache.get(appDir)
  }
}

// ---------------------------------------------------------------------------
// Where a file reaches one of the two packages, and which names
// ---------------------------------------------------------------------------

const literalOf = (node) => {
  if (node?.type === 'Literal' && typeof node.value === 'string') {
    return node.value
  }
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0].value.cooked
  }
  return null
}

const isWrappedPackage = (source) =>
  source === PRIMITIVE_PACKAGE || source === ROUTER_PACKAGE

const nameOf = (node) =>
  node?.type === 'Identifier'
    ? node.name
    : typeof node?.value === 'string'
      ? node.value
      : null

const isViCall = ({ helpers, node }) =>
  node.callee.type === 'MemberExpression' &&
  !node.callee.computed &&
  node.callee.object.type === 'Identifier' &&
  node.callee.object.name === 'vi' &&
  node.callee.property.type === 'Identifier' &&
  helpers.has(node.callee.property.name)

const isRequireCall = (node) =>
  node.callee.type === 'Identifier' && node.callee.name === 'require'

const UNWRAPPED_TYPES = new Set([
  'TSAsExpression',
  'TSSatisfiesExpression',
  'TSTypeAssertion'
])

const unwrap = (node) =>
  UNWRAPPED_TYPES.has(node?.type) ? unwrap(node.expression) : node

// The object a mock factory returns: its expression body, or the argument
// of the last top-level `return` of its block.
const returnedObject = (factory) => {
  const body = unwrap(factory.body)
  if (body?.type === 'ObjectExpression') return body
  if (body?.type !== 'BlockStatement') return null
  const returns = body.body.filter(
    (statement) => statement.type === 'ReturnStatement'
  )
  const object = unwrap(returns.at(-1)?.argument)
  return object?.type === 'ObjectExpression' ? object : null
}

const FACTORY_TYPES = new Set([
  'ArrowFunctionExpression',
  'FunctionExpression'
])

// The names a mock factory replaces, or null when they cannot be read: no
// factory, a factory that is not a function literal, a returned value that
// is not an object literal, or a computed key. A spread re-provides the
// module's own names unchanged, so it replaces none.
const factoryNames = (factory) => {
  if (!FACTORY_TYPES.has(factory?.type)) return null
  const object = returnedObject(factory)
  if (!object) return null
  const names = []
  for (const property of object.properties) {
    if (property.type === 'SpreadElement') continue
    const name = property.computed ? null : nameOf(property.key)
    if (name === null) return null
    names.push({ name, node: property.key })
  }
  return names
}

// The names a dynamic `import()` or a `require()` hands its code: the keys
// of an object pattern it is destructured into (`const { A } = await
// import('x')`), or the one property read off it (`require('x').A`); null
// for anything else, a rest element or a computed key included.
const PASS_THROUGH_TYPES = new Set(['AwaitExpression', 'ChainExpression'])

const namesTakenFrom = ({ ancestors, node }) => {
  let child = node
  let index = ancestors.length - 1
  while (PASS_THROUGH_TYPES.has(ancestors[index]?.type)) {
    child = ancestors[index]
    index -= 1
  }
  const parent = ancestors[index]
  if (
    parent?.type === 'MemberExpression' &&
    parent.object === child &&
    !parent.computed
  ) {
    const name = nameOf(parent.property)
    return name === null ? null : [{ name, node: parent.property }]
  }
  if (
    parent?.type !== 'VariableDeclarator' ||
    parent.init !== child ||
    parent.id.type !== 'ObjectPattern'
  ) {
    return null
  }
  const names = []
  for (const property of parent.id.properties) {
    const name =
      property.type === 'Property' && !property.computed
        ? nameOf(property.key)
        : null
    if (name === null) return null
    names.push({ name, node: property.key })
  }
  return names
}

// `{ names, node, source }` when the node reaches one of the two packages,
// else null. `names` lists `{ name, node }`, or is null for a reach of the
// whole module; `node` is the specifier's literal. `ancestors` runs from
// the program down to the node's parent.
const siteOf = ({ ancestors, node }) => {
  switch (node.type) {
    case 'ImportDeclaration': {
      const source = literalOf(node.source)
      if (!isWrappedPackage(source)) return null
      const whole = node.specifiers.some(
        (specifier) => specifier.type === 'ImportNamespaceSpecifier'
      )
      return {
        names: whole
          ? null
          : node.specifiers
              .filter((specifier) => specifier.type === 'ImportSpecifier')
              // A type-only specifier is judged as a value one.
              .map((specifier) => ({
                name: nameOf(specifier.imported),
                node: specifier
              })),
        node: node.source,
        source
      }
    }
    case 'ExportNamedDeclaration': {
      const source = literalOf(node.source)
      if (!isWrappedPackage(source)) return null
      return {
        names: node.specifiers.map((specifier) => ({
          name: nameOf(specifier.local),
          node: specifier
        })),
        node: node.source,
        source
      }
    }
    case 'ExportAllDeclaration': {
      const source = literalOf(node.source)
      return isWrappedPackage(source)
        ? { names: null, node: node.source, source }
        : null
    }
    case 'ImportExpression': {
      const source = literalOf(node.source)
      return isWrappedPackage(source)
        ? {
            names: namesTakenFrom({ ancestors, node }),
            node: node.source,
            source
          }
        : null
    }
    case 'TSImportEqualsDeclaration': {
      if (node.moduleReference?.type !== 'TSExternalModuleReference') {
        return null
      }
      const source = literalOf(node.moduleReference.expression)
      return isWrappedPackage(source)
        ? { names: null, node: node.moduleReference.expression, source }
        : null
    }
    case 'CallExpression': {
      const [first, factory] = node.arguments
      const source = literalOf(first)
      if (!isWrappedPackage(source)) return null
      if (isRequireCall(node)) {
        return {
          names: namesTakenFrom({ ancestors, node }),
          node: first,
          source
        }
      }
      if (isViCall({ helpers: VI_REPLACING_HELPERS, node })) {
        return { names: factoryNames(factory), node: first, source }
      }
      return null
    }
    default:
      return null
  }
}

const childNodes = (node) =>
  Object.entries(node)
    .filter(
      ([key, value]) =>
        key !== 'parent' && value !== null && typeof value === 'object'
    )
    .flatMap(([, value]) => (Array.isArray(value) ? value : [value]))
    .filter((child) => typeof child?.type === 'string')

// Every place the program reaches `react-native` or `expo-router`, in
// source order.
const collectWrappedSites = ({ program }) => {
  const sites = []
  const visit = ({ ancestors, node }) => {
    const site = siteOf({ ancestors, node })
    if (site) sites.push(site)
    childNodes(node).forEach((child) =>
      visit({ ancestors: [...ancestors, node], node: child })
    )
  }
  visit({ ancestors: [], node: program })
  return sites
}

// ---------------------------------------------------------------------------
// The verdict
// ---------------------------------------------------------------------------

const insideAny = ({ folder, paths }) =>
  paths.some((candidate) => candidate.startsWith(`${folder}/`))

const isRouterName = (name) =>
  ROUTER_HOOK_RE.test(name) || name === ROUTER_OBJECT

// A package has no app, so no ui block and no lib/routing of its own: a
// router name there is refused, owned by an app's lib/routing.
const routingFolderOf = ({ appDir }) =>
  appDir ? `${appDir}/${ROUTING_FOLDER}` : null

// The finding for a name the file imports, or null when it passes: a
// react-native name an app block is named after, outside that block; a
// router name of expo-router, outside the app's lib/routing.
const judgeName = ({ appDir, blocks, name, node, paths, source }) => {
  if (source === PRIMITIVE_PACKAGE) {
    if (!blocks.has(name)) return null
    const folder = `${appDir}/${UI_FOLDER}/${name}`
    return insideAny({ folder, paths })
      ? null
      : {
          kind: WRAPPED_FINDING.PRIMITIVE_OUTSIDE_BLOCK,
          name,
          node,
          owner: name,
          source
        }
  }
  if (!isRouterName(name)) return null
  const folder = routingFolderOf({ appDir })
  return folder && insideAny({ folder, paths })
    ? null
    : {
        kind: WRAPPED_FINDING.HOOK_OUTSIDE_ROUTING,
        name,
        node,
        owner: folder ? `${folder}/` : `an app's ${ROUTING_FOLDER}/`,
        source
      }
}

// The finding for a reach of the whole module, or null when it passes:
// react-native in an app that has ui blocks, expo-router outside the app's
// lib/routing.
const judgeWhole = ({ appDir, blocks, node, paths, source }) => {
  if (source === PRIMITIVE_PACKAGE) {
    return blocks.size === 0
      ? null
      : {
          kind: WRAPPED_FINDING.WHOLE_MODULE,
          name: '*',
          node,
          owner: `the ui blocks of ${appDir}`,
          source
        }
  }
  const folder = routingFolderOf({ appDir })
  return folder && insideAny({ folder, paths })
    ? null
    : {
        kind: WRAPPED_FINDING.WHOLE_MODULE,
        name: '*',
        node,
        owner: `the hooks of ${ROUTING_FOLDER}/`,
        source
      }
}

// Every import of the file the rule reports: `{ kind, name, node, owner,
// source }`. A file outside `apps/*` and `packages/*`, or under a
// test-infrastructure glob, has none. `blocksOf(appDir)` gives the ui block
// names of an app. A test is judged as the unit beside it.
export const collectWrappedViolations = ({
  blocksOf,
  path,
  program,
  testInfrastructure = []
}) => {
  if (!isInScope({ path })) return []
  if (testInfrastructure.some((glob) => posix.matchesGlob(path, glob))) {
    return []
  }
  const appDir = APP_RE.exec(path)?.groups?.app ?? null
  const context = {
    appDir,
    blocks: appDir ? blocksOf(appDir) : new Set(),
    paths: [path, ...unitPathsOf({ path })]
  }
  return collectWrappedSites({ program }).flatMap(
    ({ names, node, source }) => {
      if (names === null) {
        const finding = judgeWhole({ ...context, node, source })
        return finding ? [finding] : []
      }
      return names.flatMap(({ name, node: nameNode }) => {
        const finding =
          name === null
            ? null
            : judgeName({ ...context, name, node: nameNode, source })
        return finding ? [finding] : []
      })
    }
  )
}
