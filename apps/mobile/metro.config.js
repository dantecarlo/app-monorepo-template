// Metro bundler config — monorepo + NativeWind v4
// CRITICAL: watchFolders must include the workspace root so Metro can resolve
// packages/* symlinks. nodeModulesPaths ensures the root node_modules is searched
// in addition to the project's own node_modules.

const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const workspaceRoot = path.resolve(__dirname, '../..')
const projectRoot = __dirname

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot)

// --- Monorepo support ---
config.watchFolders = [workspaceRoot]

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules')
]

// Ensure Metro resolves symlinked workspace packages
config.resolver.disableHierarchicalLookup = true

module.exports = withNativeWind(config, { input: './global.css' })
