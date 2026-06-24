import { expect, test } from '@playwright/test'

test('no horizontal overflow and interactive controls within viewport', async ({
  page
}) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const tolerance = 1

  const viewport = page.viewportSize()
  if (!viewport) throw new Error('viewport is null')
  const viewportWidth = viewport.width

  const overflowResult = await page.evaluate(() => {
    const clientWidth = document.documentElement.clientWidth
    const docScrollWidth = document.documentElement.scrollWidth
    const bodyScrollWidth = document.body.scrollWidth
    return { clientWidth, docScrollWidth, bodyScrollWidth }
  })

  expect(
    overflowResult.docScrollWidth,
    `document.documentElement.scrollWidth (${overflowResult.docScrollWidth}) exceeds clientWidth (${overflowResult.clientWidth}) at viewport ${viewportWidth}px`
  ).toBeLessThanOrEqual(overflowResult.clientWidth + tolerance)

  expect(
    overflowResult.bodyScrollWidth,
    `document.body.scrollWidth (${overflowResult.bodyScrollWidth}) exceeds clientWidth (${overflowResult.clientWidth}) at viewport ${viewportWidth}px`
  ).toBeLessThanOrEqual(overflowResult.clientWidth + tolerance)

  const outOfBoundsControls = await page.evaluate(
    ({ tol }) => {
      const clientWidth = document.documentElement.clientWidth
      const controls = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[role="button"], button, a[href]'
        )
      )
      const violations: string[] = []

      for (const el of controls) {
        const style = window.getComputedStyle(el)
        if (style.position === 'fixed' || style.position === 'sticky')
          continue

        const rect = el.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) continue

        if (rect.right > clientWidth + tol || rect.left < -tol) {
          violations.push(
            `${el.tagName.toLowerCase()}[${el.getAttribute('role') ?? ''}] "${el.textContent?.trim().slice(0, 40)}" rect=(left:${rect.left.toFixed(1)},right:${rect.right.toFixed(1)}) clientWidth=${clientWidth}`
          )
        }
      }

      return violations
    },
    { tol: tolerance }
  )

  expect(
    outOfBoundsControls,
    `Interactive controls outside viewport at width ${viewportWidth}px`
  ).toHaveLength(0)

  const rootContent = await page.evaluate(() => {
    const root =
      document.querySelector('#root') ?? document.body.firstElementChild
    if (!root) return { exists: false, width: 0, height: 0 }
    const rect = root.getBoundingClientRect()
    return { exists: true, width: rect.width, height: rect.height }
  })

  expect(rootContent.exists, 'Root content must exist').toBe(true)
  expect(
    rootContent.width,
    'Root content must have non-zero width'
  ).toBeGreaterThan(0)
})
