import { expect, test } from '@playwright/test'

test('account: no-email signup → save ID → enroll → review → sign out → sign in', async ({ page }) => {
  const password = 'correct horse battery'
  await page.goto('/account')
  await page.locator('.account-actions').getByRole('button', { name: 'Create account' }).click()
  await page.locator('input[autocomplete="new-password"]').nth(0).fill(password)
  await page.locator('input[autocomplete="new-password"]').nth(1).fill(password)
  await page.getByRole('button', { name: 'Create account & get my ID' }).click()
  const id = (await page.locator('.id-box code').textContent())!.trim()
  expect(id).toMatch(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/)
  const cont = page.getByRole('button', { name: 'Continue', exact: true })
  await expect(cont).toBeDisabled()
  await page.getByLabel('I have saved my account ID somewhere safe.').check()
  await cont.click()
  await expect(page.getByRole('heading', { name: 'Your account' })).toBeVisible()

  await page.goto('/explore/jp')
  await page.getByRole('button', { name: 'Add to reviews' }).click()
  await page.locator('.enroll').getByRole('button', { name: 'Add', exact: true }).click()
  await page.goto('/reviews')
  await expect(page.getByText('2 cards are due.')).toBeVisible()
  await page.getByRole('link', { name: 'Start review' }).click()
  for (let i = 0; i < 2; i++) {
    await expect(page.locator('.answer:not([aria-disabled])').first()).toBeVisible()
    await page.keyboard.press('1')
    await page.locator('.notes .btn.primary').click()
  }
  await expect(page.getByText('Review complete')).toBeVisible()

  await page.goto('/account')
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.locator('.account-actions').getByRole('button', { name: 'Sign in' }).click()
  await page.locator('input[autocomplete=username]').fill(id.toLowerCase())
  await page.locator('input[autocomplete=current-password]').fill(password)
  await page.locator('dialog form').getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Your account' })).toBeVisible()
})
