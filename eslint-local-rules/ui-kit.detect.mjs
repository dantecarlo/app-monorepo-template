// @ts-check
// ---------------------------------------------------------------------------
// ui-kit.detect — the UI kit sits behind components/ui.
//
// Shared by the ESLint rule local/ui-kit-boundary (./index.mjs). A UI kit is a
// component library, its headless primitives and the class helpers it brings
// (shadcn's class-variance-authority and tailwind-merge, the
// tailwind-variants the template uses), on web and on React Native. Only a
// block under an app's src/components/ui/ may import one, so swapping the kit
// rewrites components/ui and nothing else: the look and the kit live in one
// replaceable layer.
//
// A scoped entry ending in `/*` names every package of the scope. A subpath
// of a listed package (`@mui/material/Button`) is the package.
// ---------------------------------------------------------------------------

export const UI_KIT_PACKAGES = Object.freeze([
  // Web component kits, headless primitives and their class helpers.
  '@ark-ui/*',
  '@chakra-ui/*',
  '@emotion/*',
  '@headlessui/*',
  '@mantine/*',
  '@mui/*',
  '@radix-ui/*',
  'antd',
  'class-variance-authority',
  'clsx',
  'cmdk',
  'lucide-react',
  'react-aria',
  'react-aria-components',
  'sonner',
  'tailwind-merge',
  'tailwind-variants',
  'vaul',
  // React Native component kits and the drawing primitives the ui blocks wrap.
  '@gluestack-ui/*',
  '@rneui/*',
  '@shopify/restyle',
  '@tamagui/*',
  'expo-blur',
  'expo-linear-gradient',
  'react-native-paper',
  'react-native-svg',
  'tamagui'
])

const packageOf = (source) => {
  const parts = source.split('/')
  return source.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

export const isUiKitSource = (source) => {
  const name = packageOf(String(source))
  return UI_KIT_PACKAGES.some((entry) =>
    entry.endsWith('/*')
      ? name.startsWith(entry.slice(0, -1))
      : name === entry
  )
}

const APP_SOURCE_RE = /(?:^|\/)(apps\/[^/]+\/src\/.+)$/
const TEST_PATH_RE =
  /(?:^|\/)(?:__tests__|__mocks__)\/|\.(?:test|spec)\.[cm]?[jt]sx?$|^apps\/[^/]+\/src\/test\//
const UI_BLOCK_RE = /^apps\/[^/]+\/src\/components\/ui\//

// True when the file may not import a UI kit: an app source file outside
// components/ui, tests and test infrastructure excepted.
export const isOutsideUiKit = (filename) => {
  const match = APP_SOURCE_RE.exec(String(filename).replaceAll('\\', '/'))
  if (!match) return false
  const path = match[1]
  return !TEST_PATH_RE.test(path) && !UI_BLOCK_RE.test(path)
}
