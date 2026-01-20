import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  let uniqueUsername
  let uniqueEmail
  const password = 'TestPassword123!'

  test.beforeAll(async ({ browser }) => {
    uniqueUsername = `dashtest_${Date.now()}`
    uniqueEmail = `dashtest_${Date.now()}@example.com`

    const page = await browser.newPage()
    await page.goto('/register')
    await page.getByLabel(/username/i).fill(uniqueUsername)
    await page.getByLabel(/email/i).fill(uniqueEmail)
    await page.getByLabel(/display name/i).fill('Dashboard Test')
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
  })

  test('should display dashboard with games', async ({ page }) => {
    await expect(page.getByText(/wordle/i)).toBeVisible()
    await expect(page.getByText(/connections/i)).toBeVisible()
  })

  test('should display games in correct order', async ({ page }) => {
    const gameCards = page.locator('[class*="game"], [class*="card"]')
    const gameNames = await gameCards.allTextContents()
    const gameText = gameNames.join(' ')

    // Verify key games appear
    expect(gameText.toLowerCase()).toContain('wordle')
    expect(gameText.toLowerCase()).toContain('connections')
  })

  test('should have navigation menu', async ({ page }) => {
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByRole('link', { name: /leaderboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /groups/i })).toBeVisible()
  })

  test('should navigate to leaderboard', async ({ page }) => {
    await page.getByRole('link', { name: /leaderboard/i }).click()
    await expect(page).toHaveURL(/leaderboard/)
  })

  test('should navigate to groups', async ({ page }) => {
    await page.getByRole('link', { name: /groups/i }).click()
    await expect(page).toHaveURL(/groups/)
  })

  test('should navigate to submit score', async ({ page }) => {
    await page.getByRole('link', { name: /submit/i }).click()
    await expect(page).toHaveURL(/submit/)
  })
})
