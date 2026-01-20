import { test, expect } from '@playwright/test'

test.describe('Admin Panel', () => {
  let uniqueUsername
  let uniqueEmail
  const password = 'TestPassword123!'
  const adminPassword = 'password'

  test.beforeAll(async ({ browser }) => {
    uniqueUsername = `admintest_${Date.now()}`
    uniqueEmail = `admintest_${Date.now()}@example.com`

    const page = await browser.newPage()
    await page.goto('/register')
    await page.getByLabel(/username/i).fill(uniqueUsername)
    await page.getByLabel(/email/i).fill(uniqueEmail)
    await page.getByLabel(/display name/i).fill('Admin Test')
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

  test('should have admin access in settings', async ({ page }) => {
    await page.goto('/settings')

    await expect(page.getByText(/admin/i)).toBeVisible()
  })

  test('should require password to access admin panel', async ({ page }) => {
    await page.goto('/settings')

    const adminButton = page.getByRole('button', { name: /admin/i })
    await adminButton.click()

    // Should prompt for password
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('should reject incorrect admin password', async ({ page }) => {
    await page.goto('/settings')

    const adminButton = page.getByRole('button', { name: /admin/i })
    await adminButton.click()

    await page.getByLabel(/password/i).last().fill('wrongpassword')
    await page.getByRole('button', { name: /access|enter|submit/i }).last().click()

    await expect(page.getByText(/incorrect|wrong|invalid/i)).toBeVisible({ timeout: 5000 })
  })

  test('should access admin panel with correct password', async ({ page }) => {
    await page.goto('/settings')

    const adminButton = page.getByRole('button', { name: /admin/i })
    await adminButton.click()

    await page.getByLabel(/password/i).last().fill(adminPassword)
    await page.getByRole('button', { name: /access|enter|submit/i }).last().click()

    await expect(page).toHaveURL(/admin/, { timeout: 5000 })
  })

  test('should display admin statistics', async ({ page }) => {
    await page.goto('/settings')

    const adminButton = page.getByRole('button', { name: /admin/i })
    await adminButton.click()

    await page.getByLabel(/password/i).last().fill(adminPassword)
    await page.getByRole('button', { name: /access|enter|submit/i }).last().click()

    await expect(page).toHaveURL(/admin/, { timeout: 5000 })

    // Should display statistics
    await expect(page.getByText(/total users|users/i)).toBeVisible()
    await expect(page.getByText(/plays|games/i)).toBeVisible()
  })

  test('should display per-game statistics', async ({ page }) => {
    await page.goto('/settings')

    const adminButton = page.getByRole('button', { name: /admin/i })
    await adminButton.click()

    await page.getByLabel(/password/i).last().fill(adminPassword)
    await page.getByRole('button', { name: /access|enter|submit/i }).last().click()

    await expect(page).toHaveURL(/admin/, { timeout: 5000 })

    // Should display game statistics
    await expect(page.getByText(/wordle/i)).toBeVisible()
    await expect(page.getByText(/connections/i)).toBeVisible()
  })

  test('should not access admin directly without password', async ({ page }) => {
    // Try to access admin page directly
    await page.goto('/admin')

    // Should redirect or show error
    const currentUrl = page.url()
    const hasAdmin = currentUrl.includes('/admin')

    if (hasAdmin) {
      // If on admin page, should show password prompt or empty state
      await expect(page.getByText(/password|access denied|unauthorized/i)).toBeVisible({ timeout: 5000 })
    } else {
      // Should redirect to login or settings
      expect(currentUrl).toMatch(/login|settings|dashboard/)
    }
  })
})
