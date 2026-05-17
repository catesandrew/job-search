import { test, expect } from '@playwright/test'

const EMAIL = 'admin@localhost'
const PASSWORD = 'changeme123'

test.describe('Happy Path', () => {
  test('login and create application', async ({ page }) => {
    // 1. Navigate to app (should redirect to /login)
    await page.goto('/')
    await expect(page).toHaveURL(/login/)

    // 2. Login
    await page.fill('input[name="email"]', EMAIL)
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    // 3. Should redirect to /applications
    await expect(page).toHaveURL(/applications/, { timeout: 10000 })

    // 4. Click "New Application"
    await page.click('text=New Application')
    await expect(page).toHaveURL(/applications\/new/)

    // 5. Fill in application form
    await page.fill('input[placeholder="Company name"]', 'Acme Corp')
    await page.fill('input[placeholder="Job title"]', 'Senior Software Engineer')

    // 6. Submit
    await page.click('button[type="submit"]')

    // 7. Should return to /applications with new card visible
    await expect(page).toHaveURL(/applications/, { timeout: 10000 })
    await expect(page.locator('text=Acme Corp')).toBeVisible()
    await expect(page.locator('text=Senior Software Engineer')).toBeVisible()
  })

  test('navigate to resumes page', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[name="email"]', EMAIL)
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/applications/, { timeout: 10000 })

    // Navigate to Resumes
    await page.click('a[href="/resumes"]')
    await expect(page).toHaveURL(/resumes/)

    // Should see seeded base resume
    await expect(page.locator('text=Andrew Cates').first()).toBeVisible({ timeout: 5000 })
  })

  test('navigate to settings page', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', EMAIL)
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/applications/, { timeout: 10000 })

    await page.goto('/settings')
    await expect(page.locator('h1, h2').filter({ hasText: /settings/i })).toBeVisible()
  })
})
