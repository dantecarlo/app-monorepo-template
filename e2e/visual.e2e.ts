import { expect, test } from '@playwright/test'

import {
  VISUAL_BREAKPOINTS,
  VISUAL_KEY_PAGES,
  VISUAL_MAX_DIFF_PIXEL_RATIO,
  VISUAL_PIXEL_THRESHOLD
} from './visual.constant'

// Opt-in visual-regression suite. Runs only under the `visual` Playwright
// project so font-render portability never blocks the always-on glass + axe
// gates. Generate or refresh baselines with:
//   pnpm exec playwright test --project=visual --update-snapshots
test.describe('visual regression', () => {
  for (const path of VISUAL_KEY_PAGES) {
    for (const breakpoint of VISUAL_BREAKPOINTS) {
      test(`${path} @ ${breakpoint.name}`, async ({ page }) => {
        await page.setViewportSize({
          height: breakpoint.height,
          width: breakpoint.width
        })
        await page.goto(path)
        await page.waitForLoadState('networkidle')

        const slug = path === '/' ? 'home' : path.replace(/\//g, '-')

        await expect(page).toHaveScreenshot(
          `${slug}-${breakpoint.name}.png`,
          {
            fullPage: true,
            maxDiffPixelRatio: VISUAL_MAX_DIFF_PIXEL_RATIO,
            threshold: VISUAL_PIXEL_THRESHOLD
          }
        )
      })
    }
  }
})
