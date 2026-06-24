// Playwright configuration for end-to-end tests.
// Run with: pnpm dlx playwright test
// This file is intentionally excluded from tsconfig and ESLint —
// @playwright/test is a zero-install peer (dlx); it is not a package dep.
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'pnpm --filter @app/web dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
})
