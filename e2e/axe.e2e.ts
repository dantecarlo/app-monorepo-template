import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import {
  AXE_KEY_PAGES,
  AXE_REQUIRED_RULES,
  AXE_RULE_TAGS
} from './axe.constant'

// Deterministic page-level a11y gate. vitest-axe already covers components in
// isolation (~30%); this runs the real axe engine against each fully rendered
// page and asserts zero violations, with color-contrast and aria-roles called
// out as the load-bearing rules for the dark glass surface.
for (const path of AXE_KEY_PAGES) {
  test(`axe finds no a11y violations on ${path}`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')

    const results = await new AxeBuilder({ page })
      .withTags([...AXE_RULE_TAGS])
      .analyze()

    const summary = results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length
    }))

    expect(
      results.violations,
      `axe violations on ${path}: ${JSON.stringify(summary, null, 2)}`
    ).toEqual([])

    const triggeredRequiredRules = results.violations
      .map((violation) => violation.id)
      .filter((id) =>
        (AXE_REQUIRED_RULES as readonly string[]).includes(id)
      )

    expect(
      triggeredRequiredRules,
      `required a11y rules must pass on ${path}`
    ).toEqual([])
  })
}
