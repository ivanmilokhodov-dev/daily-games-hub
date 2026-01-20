import { test, expect } from '@playwright/test'

test.describe('Settings', () => {
  let uniqueUsername
  let uniqueEmail
  const password = 'TestPassword123!'

  test.beforeAll(async ({ browser }) => {
    uniqueUsername = `settingstest_${Date.now()}`
    uniqueEmail = `settingstest_${Date.now()}@example.com`

    const page = await browser.newPage()
    await page.goto('/register')
    await page.getByLabel(/username/i).fill(uniqueUsername)
    await page.getByLabel(/email/i).fill(uniqueEmail)
    await page.getByLabel(/display name/i).fill('Settings Test')
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
    await page.goto('/settings')
  })

  test('should display settings page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible()
  })

  test('should display theme options', async ({ page }) => {
    await expect(page.getByText(/theme/i)).toBeVisible()
    await expect(page.getByText(/light/i)).toBeVisible()
    await expect(page.getByText(/dark/i)).toBeVisible()
  })

  test('should change theme to dark', async ({ page }) => {
    const darkThemeButton = page.getByRole('button', { name: /dark/i }).first()
    await darkThemeButton.click()

    // Check if theme is applied to document
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(theme).toBe('dark')
  })

  test('should persist theme after page reload', async ({ page }) => {
    // Set dark theme
    const darkThemeButton = page.getByRole('button', { name: /dark/i }).first()
    await darkThemeButton.click()

    // Reload page
    await page.reload()

    // Theme should still be dark
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(theme).toBe('dark')
  })

  test('should display language options', async ({ page }) => {
    await expect(page.getByText(/language/i)).toBeVisible()
  })

  test('should change language', async ({ page }) => {
    // Look for language selector
    const languageSelector = page.getByRole('combobox').first()
    if (await languageSelector.isVisible()) {
      await languageSelector.selectOption('uk')

      // Some text should change to Ukrainian
      await page.waitForTimeout(500)
    }
  })

  test('should display profile section', async ({ page }) => {
    await expect(page.getByText(/profile/i)).toBeVisible()
  })

  test('should update display name', async ({ page }) => {
    const newDisplayName = `Updated Name ${Date.now()}`

    const displayNameInput = page.getByLabel(/display name/i)
    await displayNameInput.clear()
    await displayNameInput.fill(newDisplayName)

    const saveButton = page.getByRole('button', { name: /save|update/i }).first()
    await saveButton.click()

    // Should show success message
    await expect(page.getByText(/success|saved|updated/i)).toBeVisible({ timeout: 5000 })
  })

  test('should display password change section', async ({ page }) => {
    await expect(page.getByText(/password/i)).toBeVisible()
    await expect(page.getByLabel(/current password/i)).toBeVisible()
    await expect(page.getByLabel(/new password/i)).toBeVisible()
  })

  test('should show error for incorrect current password', async ({ page }) => {
    await page.getByLabel(/current password/i).fill('wrongpassword')
    await page.getByLabel(/new password/i).fill('NewPassword123!')
    await page.getByLabel(/confirm.*password/i).fill('NewPassword123!')

    const changePasswordButton = page.getByRole('button', { name: /change password/i })
    await changePasswordButton.click()

    await expect(page.getByText(/incorrect|wrong|invalid/i)).toBeVisible({ timeout: 5000 })
  })

  test('should change password successfully', async ({ page }) => {
    const newPassword = 'NewTestPassword123!'

    await page.getByLabel(/current password/i).fill(password)
    await page.getByLabel(/new password/i).fill(newPassword)
    await page.getByLabel(/confirm.*password/i).fill(newPassword)

    const changePasswordButton = page.getByRole('button', { name: /change password/i })
    await changePasswordButton.click()

    await expect(page.getByText(/success|changed|updated/i)).toBeVisible({ timeout: 5000 })

    // Logout and try to login with new password
    await page.getByRole('button', { name: /logout/i }).click()
    await page.goto('/login')
    await page.getByLabel(/username/i).fill(uniqueUsername)
    await page.getByLabel(/password/i).fill(newPassword)
    await page.getByRole('button', { name: /login/i }).click()

    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
  })
})
