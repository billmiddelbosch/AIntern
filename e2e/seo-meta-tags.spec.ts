import { test, expect } from '@playwright/test'

test.describe('L-06 SEO & Meta Tags', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('page title is set and contains AIntern', async ({ page }) => {
    const title = await page.title()
    expect(title).toContain('AIntern')
    expect(title.length).toBeGreaterThan(10)
  })

  test('meta description is present and non-empty', async ({ page }) => {
    const content = await page
      .locator('meta[name="description"]')
      .getAttribute('content')
    expect(content).toBeTruthy()
    expect(content!.length).toBeGreaterThan(20)
  })

  test('meta robots is "index, follow"', async ({ page }) => {
    const content = await page
      .locator('meta[name="robots"]')
      .getAttribute('content')
    expect(content).toBe('index, follow')
  })

  test('og:title meta tag is present', async ({ page }) => {
    const content = await page
      .locator('meta[property="og:title"]')
      .getAttribute('content')
    expect(content).toBeTruthy()
    expect(content).toContain('AIntern')
  })

  test('og:description meta tag is present', async ({ page }) => {
    const content = await page
      .locator('meta[property="og:description"]')
      .getAttribute('content')
    expect(content).toBeTruthy()
    expect(content!.length).toBeGreaterThan(20)
  })

  test('og:type is "website"', async ({ page }) => {
    const content = await page
      .locator('meta[property="og:type"]')
      .getAttribute('content')
    expect(content).toBe('website')
  })

  test('og:url meta tag is present', async ({ page }) => {
    const content = await page
      .locator('meta[property="og:url"]')
      .getAttribute('content')
    expect(content).toBeTruthy()
    expect(content).toContain('http')
  })

  test('og:image meta tag points to og-image.png', async ({ page }) => {
    const content = await page
      .locator('meta[property="og:image"]')
      .getAttribute('content')
    expect(content).toBeTruthy()
    expect(content).toContain('og-image.png')
  })

  test('twitter:card is "summary_large_image"', async ({ page }) => {
    const content = await page
      .locator('meta[name="twitter:card"]')
      .getAttribute('content')
    expect(content).toBe('summary_large_image')
  })

  test('twitter:title meta tag is present', async ({ page }) => {
    const content = await page
      .locator('meta[name="twitter:title"]')
      .getAttribute('content')
    expect(content).toBeTruthy()
    expect(content).toContain('AIntern')
  })

  test('canonical link is present with absolute URL', async ({ page }) => {
    const href = await page
      .locator('link[rel="canonical"]')
      .getAttribute('href')
    expect(href).toBeTruthy()
    expect(href).toContain('http')
  })

  test('html lang attribute reflects the active locale', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang')
    // Default locale is NL
    expect(lang).toBe('nl')
  })

  test('JSON-LD Organization schema is present in head', async ({ page }) => {
    const ldJson = await page.evaluate(() => {
      const el = document.querySelector('script[type="application/ld+json"]')
      return el ? el.textContent : null
    })
    expect(ldJson).toBeTruthy()
    const schema = JSON.parse(ldJson!)
    expect(schema['@type']).toBe('Organization')
    expect(schema.name).toBe('AIntern')
  })
})
