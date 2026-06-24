// Playwright configuration for end-to-end tests.
// Run with: pnpm exec playwright test
// This file is intentionally excluded from tsconfig and ESLint —
// @playwright/test lives in the root devDependencies and is not a workspace app dep.
import { defineConfig, devices } from '@playwright/test'

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
    {
      name: 'chromium',
      testMatch: 'home.e2e.ts',
      use: { ...devices['Desktop Chrome'] }
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
    },
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
  ],
  webServer: [
    {
      command: 'pnpm --filter @app/web start',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 30000
    },
    {
      command:
        'pnpm exec serve apps/mobile/dist-web -p 3001 -s --no-clipboard',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 60000
    }
  ]
})
