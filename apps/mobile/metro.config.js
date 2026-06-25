// Metro bundler config — monorepo + NativeWind v4
// Expo's getDefaultConfig already detects the workspace root and wires
// watchFolders and nodeModulesPaths for the pnpm workspace. Hierarchical
// lookup stays enabled so Metro walks the pnpm store for nested transitive
// dependencies.

const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot)

// Explicit watchFolders so Metro picks up workspace package changes in
// monorepo mode even when the pnpm hoist heuristic misses the root.
config.watchFolders = [workspaceRoot]

// nodeModulesPaths ensures Metro resolves packages from both the workspace
// root and the pnpm virtual store, preventing duplicate-module splits.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules/.pnpm/node_modules')
]

module.exports = withNativeWind(config, { input: './global.css' })
