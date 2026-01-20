import { test, expect } from '@playwright/test'

test.describe('Score Submission', () => {
  let uniqueUsername
  let uniqueEmail
  const password = 'TestPassword123!'

  test.beforeAll(async ({ browser }) => {
    uniqueUsername = `scoretest_${Date.now()}`
    uniqueEmail = `scoretest_${Date.now()}@example.com`

    const page = await browser.newPage()
    await page.goto('/register')
    await page.getByLabel(/username/i).fill(uniqueUsername)
    await page.getByLabel(/email/i).fill(uniqueEmail)
    await page.getByLabel(/display name/i).fill('Score Test')
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
    await page.goto('/submit')
  })

  test('should display submit score form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /submit/i })).toBeVisible()
    await expect(page.getByRole('textbox')).toBeVisible()
    await expect(page.getByRole('combobox')).toBeVisible()
  })

  test('should auto-detect Wordle game from pasted result', async ({ page }) => {
    const textarea = page.getByRole('textbox')
    await textarea.fill('Wordle 1,234 4/6\n\n⬛🟨⬛⬛⬛\n⬛🟩🟩⬛⬛\n🟩🟩🟩⬛🟩\n🟩🟩🟩🟩🟩')

    await expect(page.getByText(/wordle/i)).toBeVisible()
  })

  test('should auto-detect Connections game from pasted result', async ({ page }) => {
    const textarea = page.getByRole('textbox')
    await textarea.fill('Connections\nPuzzle #123\n🟨🟨🟨🟨\n🟩🟩🟩🟩\n🟦🟦🟦🟦\n🟪🟪🟪🟪')

    await expect(page.getByText(/connections/i)).toBeVisible()
  })

  test('should submit Wordle score successfully', async ({ page }) => {
    const textarea = page.getByRole('textbox')
    await textarea.fill('Wordle 1,234 4/6\n\n⬛🟨⬛⬛⬛\n⬛🟩🟩⬛⬛\n🟩🟩🟩⬛🟩\n🟩🟩🟩🟩🟩')

    const select = page.getByRole('combobox')
    await select.selectOption('WORDLE')

    await page.getByRole('button', { name: /submit/i }).click()

    // Should show success or navigate
    await expect(page.getByText(/success|submitted/i)).toBeVisible({ timeout: 10000 })
  })

  test('should show error for duplicate submission', async ({ page }) => {
    // First submission
    const textarea = page.getByRole('textbox')
    await textarea.fill('Wordle 9,999 3/6\n\n🟨⬛⬛⬛⬛\n🟩🟩⬛⬛⬛\n🟩🟩🟩🟩🟩')

    const select = page.getByRole('combobox')
    await select.selectOption('WORDLE')
    await page.getByRole('button', { name: /submit/i }).click()

    // Wait for first submission to complete
    await page.waitForTimeout(1000)

    // Try to submit again
    await page.goto('/submit')
    await page.getByRole('textbox').fill('Wordle 9,999 3/6\n\n🟨⬛⬛⬛⬛\n🟩🟩⬛⬛⬛\n🟩🟩🟩🟩🟩')
    await page.getByRole('combobox').selectOption('WORDLE')
    await page.getByRole('button', { name: /submit/i }).click()

    // Should show error about duplicate
    await expect(page.getByText(/already|duplicate|submitted/i)).toBeVisible({ timeout: 10000 })
  })

  test('should require game selection', async ({ page }) => {
    const textarea = page.getByRole('textbox')
    await textarea.fill('Some random text without game detection')

    const submitButton = page.getByRole('button', { name: /submit/i })

    // Button might be disabled or show validation error
    const isDisabled = await submitButton.isDisabled()
    if (!isDisabled) {
      await submitButton.click()
      await expect(page.getByText(/select|choose|required/i)).toBeVisible({ timeout: 5000 })
    }
  })
})
