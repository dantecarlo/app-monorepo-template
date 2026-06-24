// Metro bundler config — monorepo + NativeWind v4
// Expo's getDefaultConfig already detects the workspace root and wires
// watchFolders and nodeModulesPaths for the pnpm workspace. Hierarchical
// lookup stays enabled so Metro walks the pnpm store for nested transitive
// dependencies.

const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const projectRoot = __dirname

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot)

module.exports = withNativeWind(config, { input: './global.css' })
