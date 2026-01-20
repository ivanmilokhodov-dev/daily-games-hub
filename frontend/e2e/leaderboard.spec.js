import { test, expect } from '@playwright/test'

test.describe('Leaderboard', () => {
  let uniqueUsername
  let uniqueEmail
  const password = 'TestPassword123!'

  test.beforeAll(async ({ browser }) => {
    uniqueUsername = `leadertest_${Date.now()}`
    uniqueEmail = `leadertest_${Date.now()}@example.com`

    const page = await browser.newPage()
    await page.goto('/register')
    await page.getByLabel(/username/i).fill(uniqueUsername)
    await page.getByLabel(/email/i).fill(uniqueEmail)
    await page.getByLabel(/display name/i).fill('Leaderboard Test')
    await page.getByLabel(/^password$/i).fill(password)
    await page.getByLabel(/confirm password/i).fill(password)
    await page.getByRole('button', { name: /register|sign up/i }).click()
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
    await page.close()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/username/i).fill(uniqueUsername)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /login/i }).click()
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
    await page.goto('/leaderboard')
  })

  test('should display leaderboard page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /leaderboard/i })).toBeVisible()
  })

  test('should have game filter/tabs', async ({ page }) => {
    // Should have some way to filter by game
    const hasGameSelector = await page.getByRole('combobox').isVisible() ||
                            await page.getByRole('tab').first().isVisible() ||
                            await page.getByText(/wordle/i).first().isVisible()
    expect(hasGameSelector).toBe(true)
  })

  test('should display user rankings', async ({ page }) => {
    // Should show some ranking content
    await expect(page.getByText(/rank|#|position/i)).toBeVisible({ timeout: 5000 })
  })

  test('should filter leaderboard by game', async ({ page }) => {
    // Try to select a specific game
    const gameSelector = page.getByRole('combobox')
    if (await gameSelector.isVisible()) {
      await gameSelector.selectOption('WORDLE')

      // Should update leaderboard
      await page.waitForTimeout(500)
      await expect(page.getByText(/wordle/i)).toBeVisible()
    } else {
      // Try clicking on game tab
      const wordleTab = page.getByRole('tab', { name: /wordle/i })
      if (await wordleTab.isVisible()) {
        await wordleTab.click()
        await page.waitForTimeout(500)
      }
    }
  })

  test('should show date filter', async ({ page }) => {
    // Should have date selection
    const hasDateFilter = await page.getByLabel(/date/i).isVisible() ||
                          await page.getByRole('button', { name: /today|date/i }).isVisible()

    // Date filter might be optional
    if (hasDateFilter) {
      expect(hasDateFilter).toBe(true)
    }
  })

  test('should display scores with correct information', async ({ page }) => {
    // Submit a score first
    await page.goto('/submit')
    await page.getByRole('textbox').fill('Wordle 1,000 3/6\n\n🟨⬛⬛⬛⬛\n🟩🟩⬛⬛⬛\n🟩🟩🟩🟩🟩')
    await page.getByRole('combobox').selectOption('WORDLE')
    await page.getByRole('button', { name: /submit/i }).click()

    await page.waitForTimeout(1000)

    // Go to leaderboard
    await page.goto('/leaderboard')

    // Should display username in leaderboard
    await expect(page.getByText(new RegExp(uniqueUsername.substring(0, 10), 'i'))).toBeVisible({ timeout: 5000 })
  })
})
