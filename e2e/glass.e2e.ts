import { expect, test } from '@playwright/test'

import {
  GLASS_BACKGROUND_COLOR,
  GLASS_BACKDROP_BLUR,
  GLASS_BORDER_COLOR,
  GLASS_BORDER_STYLE,
  GLASS_BORDER_WIDTH,
  GLASS_SELECTOR,
  GLASS_SHADOW_LAYERS
} from './glass.constant'

// Deterministic replacement for the AI-judged "glass looks right" check.
// Headless Chromium cannot visually paint backdrop-filter, but the COMPUTED
// style is fully deterministic — so we read getComputedStyle on a live
// `.glass-card` and assert the exact recipe. No screenshot baseline involved.
test('glass-card computed style matches the locked recipe', async ({
  page
}) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const glass = page.locator(GLASS_SELECTOR).first()
  await expect(
    glass,
    'home page must render at least one .glass-card surface'
  ).toBeVisible()

  const computed = await glass.evaluate((node) => {
    const style = window.getComputedStyle(node)
    return {
      backdropFilter: style.getPropertyValue('backdrop-filter'),
      backgroundColor: style.backgroundColor,
      borderTopWidth: style.borderTopWidth,
      borderTopStyle: style.borderTopStyle,
      borderTopColor: style.borderTopColor,
      boxShadow: style.boxShadow
    }
  })

  expect(
    computed.backdropFilter,
    `backdrop-filter must contain ${GLASS_BACKDROP_BLUR}`
  ).toContain(GLASS_BACKDROP_BLUR)

  // Chromium collapses -webkit-backdrop-filter into the standard property
  // both in getComputedStyle and in CSSOM re-serialization, so neither can
  // observe the prefixed declaration. Its presence is a build-output concern,
  // so we fetch the RAW bytes of every linked stylesheet (what the browser
  // actually received) and assert the toolchain still emitted the -webkit-
  // fallback for Safari. This is the deterministic guard against the
  // Lightning CSS minifier dropping the prefix.
  const stylesheetHrefs = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
    ).map((link) => link.href)
  )

  let rawCss = ''
  for (const href of stylesheetHrefs) {
    const response = await page.request.get(href)
    rawCss += await response.text()
  }

  expect(
    rawCss,
    `served stylesheet must keep the -webkit-backdrop-filter ${GLASS_BACKDROP_BLUR} fallback`
  ).toContain(`-webkit-backdrop-filter:${GLASS_BACKDROP_BLUR}`)

  expect(
    computed.backgroundColor,
    'glass fill background color drifted'
  ).toBe(GLASS_BACKGROUND_COLOR)

  expect(computed.borderTopWidth, 'glass stroke width drifted').toBe(
    GLASS_BORDER_WIDTH
  )
  expect(computed.borderTopStyle, 'glass stroke style drifted').toBe(
    GLASS_BORDER_STYLE
  )
  expect(computed.borderTopColor, 'glass stroke color drifted').toBe(
    GLASS_BORDER_COLOR
  )

  for (const layer of GLASS_SHADOW_LAYERS) {
    expect(
      computed.boxShadow,
      `box-shadow must contain layer "${layer}"`
    ).toContain(layer)
  }
})
