import { test, expect } from '@playwright/test'

test.describe('Resultaten & Cases section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('section is present on the home page', async ({ page }) => {
    const section = page.locator('#resultaten-cases')
    await expect(section).toBeVisible()
  })

  test('section has a visible H2 heading', async ({ page }) => {
    const heading = page.locator('#resultaten-cases h2')
    await expect(heading).toBeVisible()
    const text = await heading.innerText()
    expect(text.length).toBeGreaterThan(0)
  })

  test('section renders exactly four result cards', async ({ page }) => {
    const cards = page.locator('#resultaten-cases .rc-card')
    await expect(cards).toHaveCount(4)
  })

  test('each card contains a metric value', async ({ page }) => {
    const metrics = page.locator('#resultaten-cases .rc-card__metric-value')
    await expect(metrics).toHaveCount(4)
  })

  test('each card renders a tag badge', async ({ page }) => {
    const tags = page.locator('#resultaten-cases .rc-card__tag')
    await expect(tags).toHaveCount(4)
  })

  test('each card renders an SVG icon', async ({ page }) => {
    const cards = page.locator('#resultaten-cases .rc-card')
    const count = await cards.count()
    for (let i = 0; i < count; i++) {
      const svg = cards.nth(i).locator('.rc-card__icon-wrap svg')
      await expect(svg).toBeVisible()
    }
  })

  test('each card renders a title and description', async ({ page }) => {
    const titles = page.locator('#resultaten-cases .rc-card__title')
    const descs = page.locator('#resultaten-cases .rc-card__description')
    await expect(titles).toHaveCount(4)
    await expect(descs).toHaveCount(4)
  })

  test('cards have distinct colour variant classes', async ({ page }) => {
    await expect(page.locator('#resultaten-cases .rc-card--tijdsbesparing')).toHaveCount(1)
    await expect(page.locator('#resultaten-cases .rc-card--kostenbesparing')).toHaveCount(1)
    await expect(page.locator('#resultaten-cases .rc-card--groei')).toHaveCount(1)
    await expect(page.locator('#resultaten-cases .rc-card--kwaliteit')).toHaveCount(1)
  })

  test('eyebrow label is visible', async ({ page }) => {
    const eyebrow = page.locator('#resultaten-cases .rc-eyebrow')
    await expect(eyebrow).toBeVisible()
    const text = await eyebrow.innerText()
    expect(text.length).toBeGreaterThan(0)
  })

  test('section appears after the ProbleemOplossing section', async ({ page }) => {
    const pos = page.locator('#problemen-oplossingen')
    const rc = page.locator('#resultaten-cases')
    const posBox = await pos.boundingBox()
    const rcBox = await rc.boundingBox()
    expect(posBox).not.toBeNull()
    expect(rcBox).not.toBeNull()
    expect(rcBox!.y).toBeGreaterThan(posBox!.y)
  })
})
