import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login page', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible()
    await expect(page.getByLabel(/username/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /login/i })).toBeVisible()
  })

  test('should display register page', async ({ page }) => {
    await page.goto('/register')

    await expect(page.getByRole('heading', { name: /register|sign up/i })).toBeVisible()
    await expect(page.getByLabel(/username/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/^password$/i)).toBeVisible()
  })

  test('should navigate from login to register', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('link', { name: /sign up/i }).click()

    await expect(page).toHaveURL(/register/)
  })

  test('should navigate from register to login', async ({ page }) => {
    await page.goto('/register')

    await page.getByRole('link', { name: /login|sign in/i }).click()

    await expect(page).toHaveURL(/login/)
  })

  test('should show error on invalid login', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/username/i).fill('nonexistentuser')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /login/i }).click()

    await expect(page.getByText(/invalid|error|incorrect/i)).toBeVisible({ timeout: 10000 })
  })

  test('should register a new user successfully', async ({ page }) => {
    await page.goto('/register')

    const uniqueUsername = `testuser_${Date.now()}`
    const uniqueEmail = `test_${Date.now()}@example.com`

    await page.getByLabel(/username/i).fill(uniqueUsername)
    await page.getByLabel(/email/i).fill(uniqueEmail)
    await page.getByLabel(/display name/i).fill('Test User')
    await page.getByLabel(/^password$/i).fill('TestPassword123!')
    await page.getByLabel(/confirm password/i).fill('TestPassword123!')

    await page.getByRole('button', { name: /register|sign up/i }).click()

    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
  })

  test('should login with valid credentials after registration', async ({ page }) => {
    const uniqueUsername = `logintest_${Date.now()}`
    const uniqueEmail = `logintest_${Date.now()}@example.com`
    const password = 'TestPassword123!'

    // First register
    await page.goto('/register')
    await page.getByLabel(/username/i).fill(uniqueUsername)
    await page.getByLabel(/email/i).fill(uniqueEmail)
    await page.getByLabel(/display name/i).fill('Login Test')
    await page.getByLabel(/^password$/i).fill(password)
    await page.getByLabel(/confirm password/i).fill(password)
    await page.getByRole('button', { name: /register|sign up/i }).click()

    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })

    // Logout
    await page.getByRole('button', { name: /logout/i }).click()

    // Login again
    await page.goto('/login')
    await page.getByLabel(/username/i).fill(uniqueUsername)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /login/i }).click()

    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
  })
})
