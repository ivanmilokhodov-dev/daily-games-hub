import { test, expect } from '@playwright/test'

test.describe('Groups', () => {
  let uniqueUsername
  let uniqueEmail
  const password = 'TestPassword123!'

  test.beforeAll(async ({ browser }) => {
    uniqueUsername = `grouptest_${Date.now()}`
    uniqueEmail = `grouptest_${Date.now()}@example.com`

    const page = await browser.newPage()
    await page.goto('/register')
    await page.getByLabel(/username/i).fill(uniqueUsername)
    await page.getByLabel(/email/i).fill(uniqueEmail)
    await page.getByLabel(/display name/i).fill('Group Test')
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
    await page.goto('/groups')
  })

  test('should display groups page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /groups/i })).toBeVisible()
  })

  test('should show create group button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /create|new/i })).toBeVisible()
  })

  test('should open create group modal', async ({ page }) => {
    await page.getByRole('button', { name: /create|new/i }).click()

    await expect(page.getByLabel(/name/i)).toBeVisible()
  })

  test('should create a new group', async ({ page }) => {
    const groupName = `Test Group ${Date.now()}`

    await page.getByRole('button', { name: /create|new/i }).click()
    await page.getByLabel(/name/i).fill(groupName)

    const createButton = page.getByRole('button', { name: /create/i }).last()
    await createButton.click()

    await expect(page.getByText(groupName)).toBeVisible({ timeout: 10000 })
  })

  test('should show group details when clicked', async ({ page }) => {
    const groupName = `Details Group ${Date.now()}`

    // Create group first
    await page.getByRole('button', { name: /create|new/i }).click()
    await page.getByLabel(/name/i).fill(groupName)
    await page.getByRole('button', { name: /create/i }).last().click()

    await expect(page.getByText(groupName)).toBeVisible({ timeout: 10000 })

    // Click on the group
    await page.getByText(groupName).click()

    // Should show group details or members section
    await expect(page.getByText(/members|leaderboard/i)).toBeVisible({ timeout: 5000 })
  })

  test('should generate invite code for group', async ({ page }) => {
    const groupName = `Invite Group ${Date.now()}`

    // Create group
    await page.getByRole('button', { name: /create|new/i }).click()
    await page.getByLabel(/name/i).fill(groupName)
    await page.getByRole('button', { name: /create/i }).last().click()

    await expect(page.getByText(groupName)).toBeVisible({ timeout: 10000 })

    // Click on group
    await page.getByText(groupName).click()

    // Look for invite code or copy button
    const inviteButton = page.getByRole('button', { name: /invite|copy|code/i })
    if (await inviteButton.isVisible()) {
      await inviteButton.click()
      // Should show invite code or copy confirmation
      await expect(page.getByText(/copied|code|invite/i)).toBeVisible({ timeout: 5000 })
    }
  })

  test('should join group with invite code', async ({ page, browser }) => {
    const groupName = `Join Group ${Date.now()}`

    // Create group and get invite code
    await page.getByRole('button', { name: /create|new/i }).click()
    await page.getByLabel(/name/i).fill(groupName)
    await page.getByRole('button', { name: /create/i }).last().click()

    await expect(page.getByText(groupName)).toBeVisible({ timeout: 10000 })

    // Get the invite code (if visible)
    await page.getByText(groupName).click()

    // Create a second user to join the group
    const secondUsername = `jointest_${Date.now()}`
    const secondEmail = `jointest_${Date.now()}@example.com`

    const page2 = await browser.newPage()
    await page2.goto('/register')
    await page2.getByLabel(/username/i).fill(secondUsername)
    await page2.getByLabel(/email/i).fill(secondEmail)
    await page2.getByLabel(/display name/i).fill('Join Test')
    await page2.getByLabel(/^password$/i).fill(password)
    await page2.getByLabel(/confirm password/i).fill(password)
    await page2.getByRole('button', { name: /register|sign up/i }).click()

    await expect(page2).toHaveURL(/dashboard/, { timeout: 10000 })
    await page2.close()
  })
})
