import { test, expect } from '@playwright/test'

test.describe('Problemen & Oplossingen section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('section is present on the home page', async ({ page }) => {
    const section = page.locator('#problemen-oplossingen')
    await expect(section).toBeVisible()
  })

  test('section renders three problem-solution pairs', async ({ page }) => {
    const pairs = page.locator('#problemen-oplossingen .poc-pair')
    await expect(pairs).toHaveCount(3)
  })

  test('each pair has a problem card and a solution card', async ({ page }) => {
    const problemCards = page.locator('#problemen-oplossingen .poc-card--problem')
    const solutionCards = page.locator('#problemen-oplossingen .poc-card--solution')
    await expect(problemCards).toHaveCount(3)
    await expect(solutionCards).toHaveCount(3)
  })

  test('section has a visible H2 heading', async ({ page }) => {
    const heading = page.locator('#problemen-oplossingen h2')
    await expect(heading).toBeVisible()
    const text = await heading.innerText()
    expect(text.length).toBeGreaterThan(0)
  })

  test('second pair has reversed layout class', async ({ page }) => {
    const pairs = page.locator('#problemen-oplossingen .poc-pair')
    const secondPair = pairs.nth(1)
    await expect(secondPair).toHaveClass(/poc-pair--reversed/)
  })

  test('first pair does not have reversed layout class', async ({ page }) => {
    const firstPair = page.locator('#problemen-oplossingen .poc-pair').first()
    const classList = await firstPair.getAttribute('class')
    expect(classList).not.toContain('poc-pair--reversed')
  })

  test('each card renders an SVG icon', async ({ page }) => {
    const cards = page.locator('#problemen-oplossingen .poc-card')
    const count = await cards.count()
    for (let i = 0; i < count; i++) {
      const svg = cards.nth(i).locator('svg')
      await expect(svg).toBeVisible()
    }
  })

  test('connector arrows are visible between cards', async ({ page }) => {
    const dividers = page.locator('#problemen-oplossingen .poc-pair__divider')
    await expect(dividers).toHaveCount(3)
  })
})
