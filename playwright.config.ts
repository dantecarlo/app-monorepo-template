// Playwright configuration for end-to-end tests.
// Run with: pnpm exec playwright test
// This file is intentionally excluded from tsconfig and ESLint —
// @playwright/test lives in the root devDependencies and is not a workspace app dep.
import type { Project } from '@playwright/test'
import { defineConfig, devices } from '@playwright/test'

// Visual-regression is opt-in: enabled only when E2E_VISUAL=1 (or via the
// `visual` project flag) so font-render portability never blocks the
// always-on glass + axe gates inside `pnpm test:e2e`.
const VISUAL_PROJECT_ENABLED = process.env.E2E_VISUAL === '1'

// The mobile-web tier serves apps/mobile/dist-web on :3001 and requires a prior
// `expo export --platform web`. It is opt-in (E2E_MOBILE_WEB=1, set by
// `smoke:mobile-web`) so the always-on chromium glass + axe gate boots
// standalone — without it, the :3001 webServer below would fail when
// dist-web is unbuilt and block the whole run.
const MOBILE_WEB_ENABLED = process.env.E2E_MOBILE_WEB === '1'

const visualProject: Project = {
  // Opt-in visual-regression project. Run with
  // `E2E_VISUAL=1 pnpm exec playwright test --project=visual` and refresh
  // baselines with `--update-snapshots`.
  name: 'visual',
  testMatch: 'visual.e2e.ts',
  use: { ...devices['Desktop Chrome'] }
}

const baseProjects: Project[] = [
  {
    name: 'chromium',
    // Always-on deterministic gates against the web app: smoke load,
    // glass computed-style recipe, and page-level axe a11y.
    testMatch: ['home.e2e.ts', 'glass.e2e.ts', 'axe.e2e.ts'],
    use: {
      ...devices['Desktop Chrome'],
      // Pin the dark theme the glass/axe baseline expects. The no-flash head
      // script resolves the theme from prefers-color-scheme when no NEXT_THEME
      // cookie is present; headless Chromium reports `light` by default, which
      // would flip data-theme to light and break the dark-locked glass recipe
      // and contrast baseline. Forcing the dark color scheme keeps the gate
      // deterministic without a cookie fixture.
      colorScheme: 'dark'
    }
  },
  {
    name: 'mobile-390',
    testMatch: 'responsive.e2e.ts',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 390, height: 844 }
    }
  },
  {
    name: 'tablet-768',
    testMatch: 'responsive.e2e.ts',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 768, height: 1024 }
    }
  },
  {
    name: 'desktop-1280',
    testMatch: 'responsive.e2e.ts',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 1280, height: 800 }
    }
  },
  {
    name: 'desktop-1920',
    testMatch: 'responsive.e2e.ts',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 1920, height: 1080 }
    }
  }
]

// Mobile-web (RNW/Expo web on :3001) is an opt-in / CI-only tier — it needs a
// prior `expo export --platform web` and the :3001 static server. Kept out of
// the default project list so the always-on chromium gate boots standalone.
const mobileWebProjects: Project[] = [
  {
    name: 'mobile-web-390',
    testMatch: 'mobile-web.e2e.ts',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 390, height: 844 },
      baseURL: 'http://localhost:3001'
    }
  },
  {
    name: 'mobile-web-768',
    testMatch: 'mobile-web.e2e.ts',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 768, height: 1024 },
      baseURL: 'http://localhost:3001'
    }
  },
  {
    name: 'mobile-web-1280',
    testMatch: 'mobile-web.e2e.ts',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 1280, height: 800 },
      baseURL: 'http://localhost:3001'
    }
  },
  {
    name: 'mobile-web-1920',
    testMatch: 'mobile-web.e2e.ts',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 1920, height: 1080 },
      baseURL: 'http://localhost:3001'
    }
  }
]

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry'
  },
  projects: [
    ...baseProjects,
    ...(MOBILE_WEB_ENABLED ? mobileWebProjects : []),
    ...(VISUAL_PROJECT_ENABLED ? [visualProject] : [])
  ],
  webServer: [
    {
      command: 'pnpm --filter @app/web start',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
      // Start Next with the origin guard unset for CI parity: the middleware
      // origin-guard returns 403 for header-less local requests when
      // CF_ORIGIN_SECRET is configured (e.g. via a developer's .env.local).
      // Clearing it makes the guard pass through (NOT_CONFIGURED) so the gate
      // gets a 200 without manually moving .env.local or sending the header.
      env: { CF_ORIGIN_SECRET: '' }
    },
    // Mobile-web static server — only when the opt-in tier is enabled, so the
    // default gate never blocks on an unbuilt dist-web / missing serve.
    ...(MOBILE_WEB_ENABLED
      ? [
          {
            command:
              'pnpm exec serve apps/mobile/dist-web -p 3001 -s --no-clipboard',
            url: 'http://localhost:3001',
            reuseExistingServer: !process.env.CI,
            timeout: 60000
          }
        ]
      : [])
  ]
})
