import { test, expect } from '@playwright/test'

test.describe('Homepage — eigen software propositie', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('toont de kernsecties', async ({ page }) => {
    for (const id of ['#hoe-werkt-het', '#prijs', '#faq', '#contact']) {
      await expect(page.locator(id)).toBeAttached()
    }
  })

  test('noemt de vanaf-prijs', async ({ page }) => {
    await expect(page.locator('#prijs')).toContainText('99')
  })

  test('FAQ-items klappen open', async ({ page }) => {
    // q1 is open by default; use q2
    const question = page.locator('#faq button[aria-expanded]').nth(1)
    await expect(question).toHaveAttribute('aria-expanded', 'false')
    await question.click()
    await expect(question).toHaveAttribute('aria-expanded', 'true')
  })

  test('bevat FAQPage structured data', async ({ page }) => {
    const types = await page.evaluate(() =>
      Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
        (el) => JSON.parse(el.textContent ?? '{}')['@type'],
      ),
    )
    expect(types).toContain('FAQPage')
  })
})

test.describe('Platform-pagina', () => {
  test('rendert met eigen titel', async ({ page }) => {
    await page.goto('/platform')
    await expect(page.locator('h1')).toBeVisible()
    await expect(page).toHaveTitle(/Platform/)
  })
})

test.describe('Partnerpagina', () => {
  test('heeft een afspraak-blok met boekknop', async ({ page }) => {
    await page.goto('/partners')
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('#afspraak button')).toBeVisible()
  })
})

test.describe('Gesprek plannen en besparing', () => {
  test('hero-knop opent direct de Calendly-planner', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Plan je gratis gesprek' }).first().click()
    await expect(
      page.getByRole('dialog', { name: 'Gratis kennismakingsgesprek inplannen' }),
    ).toBeVisible()
  })

  test('prijsknop opent de besparingscalculator', async ({ page }) => {
    await page.goto('/')
    await page.locator('#prijs').getByRole('button', { name: 'Bereken mijn besparing' }).click()
    const dialog = page.getByRole('dialog', { name: 'Bereken je besparing' })
    await expect(dialog).toBeVisible()

    await dialog.getByLabel('CRM').check()
    await dialog.getByLabel('Maandbedrag voor CRM').fill('300')
    await expect(dialog.getByTestId('savings-monthly')).toContainText('201')

    await dialog.getByRole('button', { name: 'Plan gesprek met deze cijfers' }).click()
    await expect(dialog).toBeHidden()
    await expect(
      page.getByRole('dialog', { name: 'Gratis kennismakingsgesprek inplannen' }),
    ).toBeVisible()
  })
})
