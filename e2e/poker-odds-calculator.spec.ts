import { test, expect } from '@playwright/test'

/**
 * E2E coverage for the single-player Poker Odds Calculator PoC
 * (/poker-odds-calculator).
 *
 * The app's default runtime locale is Dutch (see src/lib/i18n.ts), so — per
 * this project's established convention (see analytics-cookie-consent.spec.ts,
 * home.spec.ts, seo-meta-tags.spec.ts) — these tests avoid asserting against
 * hardcoded translated copy. Instead they rely on:
 *   - the `data-testid` attributes added specifically to this feature's
 *     components (CardPickerGrid, CardSlotRow, EquityResultBar,
 *     OpponentCountStepper, the New Game button) — a narrow, justified
 *     exception to the project's "no data-testid" norm, since the picker
 *     grid alone has 52 near-identical, locale-labeled buttons; and
 *   - structural checks (element counts, disabled state, numeric patterns).
 */

const WIN_PCT_PATTERN = /^\d{1,3}%$/

test.describe('Poker Odds Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/poker-odds-calculator')
  })

  test('page loads with a headline and the full 52-card picker grid', async ({ page }) => {
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
    expect((await h1.innerText()).length).toBeGreaterThan(0)

    // 13 ranks x 4 suits
    await expect(page.locator('[data-testid^="card-picker-"]')).toHaveCount(52)
  })

  test('shows the empty state before any hole cards are picked', async ({ page }) => {
    await expect(page.getByTestId('equity-empty-state')).toBeVisible()
  })

  test('selecting two hole cards fills the hand row and shows a win probability', async ({ page }) => {
    await page.getByTestId('card-picker-A-spades').click()
    await page.getByTestId('card-picker-K-spades').click()

    // Hole card row now has 2 filled slots.
    const holeButtons = page.getByTestId('hole-cards-row').locator('button')
    await expect(holeButtons).toHaveCount(2)
    await expect(holeButtons.nth(0)).toContainText('A')
    await expect(holeButtons.nth(1)).toContainText('K')

    const winPct = page.getByTestId('equity-win-pct')
    await expect(winPct).toBeVisible()
    await expect(winPct).toHaveText(WIN_PCT_PATTERN)
  })

  test('prevents picking the same card twice', async ({ page }) => {
    const aceOfSpades = page.getByTestId('card-picker-A-spades')
    await aceOfSpades.click()
    await expect(aceOfSpades).toBeDisabled()
  })

  test('progresses through flop, turn and river, recalculating equity after each street', async ({
    page,
  }) => {
    // Hole cards
    await page.getByTestId('card-picker-A-spades').click()
    await page.getByTestId('card-picker-K-spades').click()
    await expect(page.getByTestId('equity-win-pct')).toHaveText(WIN_PCT_PATTERN)

    // Flop (3 cards)
    await page.getByTestId('card-picker-Q-spades').click()
    await page.getByTestId('card-picker-J-spades').click()
    await page.getByTestId('card-picker-T-spades').click()
    await expect(page.getByTestId('board-cards-row').locator('button').nth(0)).toContainText('Q')
    await expect(page.getByTestId('board-cards-row').locator('button').nth(2)).toContainText('T')
    await expect(page.getByTestId('equity-win-pct')).toHaveText(WIN_PCT_PATTERN)

    // Turn (1 card)
    await page.getByTestId('card-picker-2-hearts').click()
    await expect(page.getByTestId('board-cards-row').locator('button').nth(3)).toContainText('2')
    await expect(page.getByTestId('equity-win-pct')).toHaveText(WIN_PCT_PATTERN)

    // River (1 card) — hand is now complete
    await page.getByTestId('card-picker-3-hearts').click()
    await expect(page.getByTestId('board-cards-row').locator('button').nth(4)).toContainText('3')
    await expect(page.getByTestId('equity-win-pct')).toHaveText(WIN_PCT_PATTERN)

    // Picker grid is hidden once the hand is complete.
    await expect(page.locator('[data-testid^="card-picker-"]')).toHaveCount(0)
  })

  test('opponent count stepper stays within 1-8 bounds', async ({ page }) => {
    const count = page.getByTestId('opponent-count')
    const decrement = page.getByTestId('opponent-decrement')
    const increment = page.getByTestId('opponent-increment')

    await expect(count).toHaveText('1')
    await expect(decrement).toBeDisabled()

    for (let i = 0; i < 7; i++) {
      await increment.click()
    }
    await expect(count).toHaveText('8')
    await expect(increment).toBeDisabled()

    for (let i = 0; i < 7; i++) {
      await decrement.click()
    }
    await expect(count).toHaveText('1')
    await expect(decrement).toBeDisabled()
  })

  test('keyboard shortcuts adjust the opponent count (° up, / down), clamped', async ({
    page,
  }) => {
    // "°" isn't reliably typeable across keyboard layouts, so dispatch the
    // keydown directly (the app listens for event.key on window).
    const pressKey = (key: string) =>
      page.evaluate(
        (k) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })),
        key,
      )

    const count = page.getByTestId('opponent-count')
    await expect(count).toHaveText('1')

    // "/" at the minimum is a no-op.
    await pressKey('/')
    await expect(count).toHaveText('1')

    // "°" raises the count by 1.
    await pressKey('°')
    await expect(count).toHaveText('2')
    await pressKey('°')
    await expect(count).toHaveText('3')

    // "/" lowers it by 1.
    await pressKey('/')
    await expect(count).toHaveText('2')
  })

  test('New Game resets hole cards and the equity result', async ({ page }) => {
    await page.getByTestId('card-picker-A-spades').click()
    await page.getByTestId('card-picker-K-spades').click()
    await expect(page.getByTestId('equity-win-pct')).toHaveText(WIN_PCT_PATTERN)

    await page.getByTestId('new-game-button').click()

    await expect(page.getByTestId('equity-empty-state')).toBeVisible()
    const holeButtons = page.getByTestId('hole-cards-row').locator('button')
    await expect(holeButtons.nth(0)).toHaveText('')
    await expect(holeButtons.nth(1)).toHaveText('')

    // The previously-used card is selectable again.
    await expect(page.getByTestId('card-picker-A-spades')).toBeEnabled()
  })

  test('New Game preserves the opponent count', async ({ page }) => {
    const count = page.getByTestId('opponent-count')
    const increment = page.getByTestId('opponent-increment')

    await increment.click()
    await increment.click()
    await expect(count).toHaveText('3')

    await page.getByTestId('card-picker-A-spades').click()
    await page.getByTestId('card-picker-K-spades').click()
    await expect(page.getByTestId('equity-win-pct')).toHaveText(WIN_PCT_PATTERN)

    await page.getByTestId('new-game-button').click()

    // Cards reset, but the opponent count carries over to the next hand.
    await expect(page.getByTestId('equity-empty-state')).toBeVisible()
    await expect(count).toHaveText('3')
  })

  test('lets the player re-select an already-picked card', async ({ page }) => {
    // Play a full hand so the picker grid is hidden.
    await page.getByTestId('card-picker-A-spades').click()
    await page.getByTestId('card-picker-K-spades').click()
    await page.getByTestId('card-picker-Q-spades').click()
    await page.getByTestId('card-picker-J-spades').click()
    await page.getByTestId('card-picker-T-spades').click()
    await page.getByTestId('card-picker-2-hearts').click()
    await page.getByTestId('card-picker-3-hearts').click()
    await expect(page.locator('[data-testid^="card-picker-"]')).toHaveCount(0)

    // Click the river slot (board index 4) to re-select it.
    const boardButtons = page.getByTestId('board-cards-row').locator('button')
    await expect(boardButtons.nth(4)).toContainText('3')
    await boardButtons.nth(4).click()

    // The picker grid reappears and the card being replaced is selectable again.
    await expect(page.locator('[data-testid^="card-picker-"]')).toHaveCount(52)
    await expect(page.getByTestId('card-picker-3-hearts')).toBeEnabled()

    // Pick a replacement — the river slot updates and the picker hides again.
    await page.getByTestId('card-picker-4-hearts').click()
    await expect(boardButtons.nth(4)).toContainText('4')
    await expect(page.locator('[data-testid^="card-picker-"]')).toHaveCount(0)
    await expect(page.getByTestId('equity-win-pct')).toHaveText(WIN_PCT_PATTERN)
  })
})
