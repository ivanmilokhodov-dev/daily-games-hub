import { test as base } from '@playwright/test'

// Extend base test with authentication fixtures
export const test = base.extend({
  // Authenticated page fixture
  authenticatedPage: async ({ browser }, use) => {
    const page = await browser.newPage()
    const uniqueUsername = `fixture_${Date.now()}`
    const uniqueEmail = `fixture_${Date.now()}@example.com`
    const password = 'TestPassword123!'

    // Register a new user
    await page.goto('/register')
    await page.getByLabel(/username/i).fill(uniqueUsername)
    await page.getByLabel(/email/i).fill(uniqueEmail)
    await page.getByLabel(/display name/i).fill('Fixture User')
    await page.getByLabel(/^password$/i).fill(password)
    await page.getByLabel(/confirm password/i).fill(password)
    await page.getByRole('button', { name: /register|sign up/i }).click()

    // Wait for dashboard
    await page.waitForURL(/dashboard/, { timeout: 10000 })

    // Provide the page to the test
    await use(page)

    // Cleanup
    await page.close()
  },

  // User credentials fixture
  testUser: async ({}, use) => {
    const user = {
      username: `testuser_${Date.now()}`,
      email: `testuser_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      displayName: 'Test User'
    }
    await use(user)
  }
})

export { expect } from '@playwright/test'
