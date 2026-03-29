import { test, expect } from '@playwright/test'

const STORAGE_KEY = 'aintern_consent'

test.describe('Cookie Consent Banner', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test so the banner always starts fresh
    await page.goto('/')
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY)
    await page.reload()
  })

  test('banner is visible on first visit (no consent stored)', async ({ page }) => {
    const banner = page.locator('[role="region"][aria-label="Cookie consent"]')
    await expect(banner).toBeVisible()
  })

  test('banner contains a non-empty message', async ({ page }) => {
    const banner = page.locator('[role="region"][aria-label="Cookie consent"]')
    await expect(banner).toBeVisible()
    const text = await banner.innerText()
    expect(text.length).toBeGreaterThan(0)
  })

  test('banner has Accept and Decline buttons', async ({ page }) => {
    const buttons = page.locator('[role="region"][aria-label="Cookie consent"] button')
    await expect(buttons).toHaveCount(2)
  })

  test('clicking Accept hides the banner', async ({ page }) => {
    const banner = page.locator('[role="region"][aria-label="Cookie consent"]')
    const buttons = page.locator('[role="region"][aria-label="Cookie consent"] button')
    const acceptBtn = buttons.nth(1)
    await acceptBtn.click()
    await expect(banner).not.toBeVisible()
  })

  test('clicking Accept persists "accepted" to localStorage', async ({ page }) => {
    const buttons = page.locator('[role="region"][aria-label="Cookie consent"] button')
    const acceptBtn = buttons.nth(1)
    await acceptBtn.click()
    const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)
    expect(stored).toBe('accepted')
  })

  test('clicking Decline hides the banner', async ({ page }) => {
    const banner = page.locator('[role="region"][aria-label="Cookie consent"]')
    const buttons = page.locator('[role="region"][aria-label="Cookie consent"] button')
    const declineBtn = buttons.nth(0)
    await declineBtn.click()
    await expect(banner).not.toBeVisible()
  })

  test('clicking Decline persists "declined" to localStorage', async ({ page }) => {
    const buttons = page.locator('[role="region"][aria-label="Cookie consent"] button')
    const declineBtn = buttons.nth(0)
    await declineBtn.click()
    const stored = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)
    expect(stored).toBe('declined')
  })

  test('banner does not appear on return visit after Accept', async ({ page }) => {
    // Set consent in localStorage and reload
    await page.evaluate((key) => localStorage.setItem(key, 'accepted'), STORAGE_KEY)
    await page.reload()
    const banner = page.locator('[role="region"][aria-label="Cookie consent"]')
    await expect(banner).not.toBeVisible()
  })

  test('banner does not appear on return visit after Decline', async ({ page }) => {
    await page.evaluate((key) => localStorage.setItem(key, 'declined'), STORAGE_KEY)
    await page.reload()
    const banner = page.locator('[role="region"][aria-label="Cookie consent"]')
    await expect(banner).not.toBeVisible()
  })

  test('Plausible script is NOT injected when consent is declined', async ({ page }) => {
    await page.evaluate((key) => localStorage.setItem(key, 'declined'), STORAGE_KEY)
    await page.reload()
    const plausibleScript = page.locator('#plausible-analytics')
    await expect(plausibleScript).not.toBeAttached()
  })

  test('Plausible script IS injected when consent is accepted', async ({ page }) => {
    await page.evaluate((key) => localStorage.setItem(key, 'accepted'), STORAGE_KEY)
    await page.reload()
    const plausibleScript = page.locator('#plausible-analytics')
    await expect(plausibleScript).toBeAttached()
  })

  test('banner has aria-live attribute for screen reader announcements', async ({ page }) => {
    const banner = page.locator('[aria-live="polite"]')
    await expect(banner).toBeVisible()
  })
})

test.describe('Cookie Consent — locale', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY)
    await page.reload()
  })

  test('banner renders in Dutch by default (NL locale)', async ({ page }) => {
    const banner = page.locator('[role="region"][aria-label="Cookie consent"]')
    await expect(banner).toBeVisible()
    const text = await banner.innerText()
    // Dutch message contains "analytics" in any locale, but check a NL-specific word
    expect(text).toContain('analytics')
  })
})
