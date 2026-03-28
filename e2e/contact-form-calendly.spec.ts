import { test, expect } from '@playwright/test'

test.describe('Contact Form & Calendly section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('section is present on the home page', async ({ page }) => {
    const section = page.locator('#contact')
    await expect(section).toBeVisible()
  })

  test('section has a visible H2 heading', async ({ page }) => {
    const heading = page.locator('#contact h2')
    await expect(heading).toBeVisible()
    const text = await heading.innerText()
    expect(text.length).toBeGreaterThan(0)
  })

  test('section renders the eyebrow label', async ({ page }) => {
    const eyebrow = page.locator('#contact .cc-eyebrow')
    await expect(eyebrow).toBeVisible()
    const text = await eyebrow.innerText()
    expect(text.length).toBeGreaterThan(0)
  })

  test('section renders the subtext paragraph', async ({ page }) => {
    const sub = page.locator('#contact .cc-subtext')
    await expect(sub).toBeVisible()
  })

  test('section renders two columns', async ({ page }) => {
    const columns = page.locator('#contact .cc-column')
    await expect(columns).toHaveCount(2)
  })

  test('Calendly column has its heading', async ({ page }) => {
    const headings = page.locator('#contact .cc-column-heading')
    await expect(headings.first()).toBeVisible()
  })

  test('form column has its heading', async ({ page }) => {
    const headings = page.locator('#contact .cc-column-heading')
    await expect(headings.nth(1)).toBeVisible()
  })

  test('contact form is visible with three fields', async ({ page }) => {
    const form = page.locator('#contact .cc-form')
    await expect(form).toBeVisible()
    await expect(page.locator('#cc-name')).toBeVisible()
    await expect(page.locator('#cc-email')).toBeVisible()
    await expect(page.locator('#cc-message')).toBeVisible()
  })

  test('submit button is visible', async ({ page }) => {
    const btn = page.locator('#contact .cc-btn-primary')
    await expect(btn).toBeVisible()
  })

  test('divider with or-label is visible', async ({ page }) => {
    const divider = page.locator('#contact .cc-divider-or')
    await expect(divider).toBeVisible()
  })

  test('privacy note is visible', async ({ page }) => {
    const privacy = page.locator('#contact .cc-privacy')
    await expect(privacy).toBeVisible()
  })

  test('Calendly widget area is present', async ({ page }) => {
    const widget = page.locator('#contact .cw-root')
    await expect(widget).toBeVisible()
  })

  test('section appears after the Over AIntern section', async ({ page }) => {
    const overSection = page.locator('.oac-section')
    const contactSection = page.locator('#contact')
    const overBox = await overSection.boundingBox()
    const contactBox = await contactSection.boundingBox()
    expect(overBox).not.toBeNull()
    expect(contactBox).not.toBeNull()
    expect(contactBox!.y).toBeGreaterThan(overBox!.y)
  })

  test('label elements are associated with inputs', async ({ page }) => {
    await expect(page.locator('label[for="cc-name"]')).toBeVisible()
    await expect(page.locator('label[for="cc-email"]')).toBeVisible()
    await expect(page.locator('label[for="cc-message"]')).toBeVisible()
  })
})
