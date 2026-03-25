import { test, expect } from '@playwright/test'

test('home page renders hero section', async ({ page }) => {
  await page.goto('/')
  // The hero headline is the first H1 on the page
  const h1 = page.locator('h1').first()
  await expect(h1).toBeVisible()
  const text = await h1.innerText()
  expect(text.length).toBeGreaterThan(0)
})
