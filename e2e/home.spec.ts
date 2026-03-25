import { test, expect } from '@playwright/test'

test('home page renders and counter works', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('AIntern')
  await page.getByRole('button', { name: '+' }).click()
  await expect(page.locator('text=Double: 2')).toBeVisible()
})
