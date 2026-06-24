import { readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const DIST_DIR = join(process.cwd(), 'apps', 'mobile', 'dist')
const PLATFORMS = ['ios', 'android']
const BUNDLE_EXTENSIONS = ['.hbc', '.bundle']

const findBundlesForPlatform = (platform) => {
  const results = []

  const scan = (dir) => {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        scan(fullPath)
      } else if (BUNDLE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
        results.push(fullPath)
      }
    }
  }

  scan(join(DIST_DIR, '_expo', 'static', 'js', platform))
  return results
}

let failed = false

for (const platform of PLATFORMS) {
  const bundles = findBundlesForPlatform(platform)
  if (bundles.length === 0) {
    console.error(
      `[assert-expo-export] FAIL: no .hbc or .bundle found for platform "${platform}" under ${join(DIST_DIR, '_expo', 'static', 'js', platform)}`
    )
    failed = true
  } else {
    console.log(
      `[assert-expo-export] OK: ${platform} — ${bundles.length} bundle file(s) found`
    )
    for (const b of bundles) {
      console.log(`  ${b}`)
    }
  }
}

if (failed) {
  process.exit(1)
}
