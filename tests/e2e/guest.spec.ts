import { expect, test } from '@playwright/test'

test('guest: quick practice → results → practise mistakes', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Start practice' }).click()
  await expect(page).toHaveURL(/\/practice\/session\//)
  for (let i = 0; i < 10; i++) {
    await expect(page.locator('.answer').first()).toBeVisible()
    // flag options must not reveal the country before answering
    if (i === 0) await expect(page.locator('.prompt-flag img')).not.toHaveAttribute('alt', /Flag of/)
    await page.keyboard.press('1')
    if (await page.locator('.retry-row').isVisible()) await page.getByRole('button', { name: 'Show answer' }).click()
    await page.locator('.notes .btn.primary').click()
  }
  await expect(page).toHaveURL(/\/results\//)
  await expect(page.getByText('first-try accuracy')).toBeVisible()
  await expect(page.locator('.recap li')).toHaveCount(10)
})

test('guest: setup offers 6×6 fields (incl. map) and disables answering with the prompt field', async ({ page }) => {
  await page.goto('/practice')
  await expect(page.locator('input[name=prompt]')).toHaveCount(6)
  await expect(page.locator('input[name=answer]')).toHaveCount(6)
  await page.locator('label.field-opt', { hasText: 'Capital city' }).first().click()
  await expect(page.locator('input[name=answer][value=capital]')).toBeDisabled()
})

test('guest: atlas search is accent-insensitive and filters persist in the URL', async ({ page }) => {
  await page.goto('/explore')
  await page.getByRole('searchbox').fill('reykjavik')
  await expect(page.locator('.specimen')).toHaveCount(1)
  await expect(page).toHaveURL(/q=reykjavik/)
  await page.getByRole('searchbox').fill('+49')
  await expect(page.locator('.specimen')).toHaveCount(1)
  await page.locator('.specimen').first().click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Germany')
  await page.goBack()
  await expect(page).toHaveURL(/q=%2B49|q=\+49/)
})

test('guest: country drill asks the same country in different directions', async ({ page }) => {
  await page.goto('/explore/tr')
  await page.getByRole('button', { name: /Learn this country/ }).click()
  const seen = new Set<string>()
  while (!page.url().includes('/results/')) {
    await expect(page.locator('.question .q-title')).toBeVisible()
    await page.waitForTimeout(150)
    seen.add((await page.locator('.question .eyebrow').textContent())!)
    if (await page.locator('.clickmap').isVisible()) await page.getByRole('button', { name: 'Show me where' }).click()
    else await page.keyboard.press('1')
    if (await page.locator('.retry-row').isVisible()) await page.getByRole('button', { name: 'Show answer' }).click()
    await page.locator('.notes .btn.primary').click()
    await page.waitForTimeout(100)
  }
  expect(seen.size).toBeGreaterThanOrEqual(8)
  expect([...seen].some((x) => x.includes('Location on map'))).toBe(true)
})

test('guest: look-alike difficulty runs flag questions', async ({ page }) => {
  await page.goto('/practice')
  await page.getByRole('button', { name: /Look-alikes/ }).click()
  await expect(page.getByText('Similar flags', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Begin journey' }).click()
  await expect(page).toHaveURL(/\/practice\/session\//)
  await expect(page.getByText(/look-alikes/)).toBeVisible()
  await expect(page.locator('.answer')).toHaveCount(4)
})

const currentTarget = (page: import('@playwright/test').Page) =>
  page.evaluate(async () => {
    const id = location.pathname.split('/').pop()!
    const db = await new Promise<IDBDatabase>((r) => {
      const q = indexedDB.open('countrybox', 1)
      q.onsuccess = () => r(q.result)
    })
    const s = await new Promise<{ index: number; questions: { targetId: string }[] }>((r) => {
      const q = db.transaction('sessions').objectStore('sessions').get(id)
      q.onsuccess = () => r(q.result)
    })
    return s.questions[s.index].targetId
  })

for (const style of ['Border + capital', 'Border only', 'Capital only']) {
  test(`map: map as the question (${style})`, async ({ page }) => {
    await page.goto('/practice')
    await page.locator('label.field-opt', { hasText: 'Location on map' }).first().click()
    await page.locator('.map-style-opt', { hasText: style }).click()
    await page.getByRole('button', { name: 'Begin journey' }).click()
    await expect(page).toHaveURL(/\/practice\/session\//)
    await expect(page.locator('.question .map-prompt > svg')).toBeVisible()
    await expect(page.locator('.answer')).toHaveCount(4)
    await page.keyboard.press('1')
    if (await page.locator('.retry-row').isVisible()) await page.getByRole('button', { name: 'Show answer' }).click()
    await expect(page.locator('.verdict')).toBeVisible()
  })
}

for (const [mode, label] of [
  ['borders', 'With borders'],
  ['silhouette', 'Without borders'],
] as const) {
  test(`map: click the country (${mode})`, async ({ page }) => {
    await page.goto('/practice')
    await page
      .locator('fieldset.field-picker')
      .nth(1)
      .locator('label.field-opt', { hasText: 'Location on map' })
      .click()
    await page.locator('.map-style-opt', { hasText: label }).click()
    await page.getByRole('button', { name: 'Begin journey' }).click()
    await expect(page).toHaveURL(/\/practice\/session\//)
    await expect(page.locator(`.clickmap.is-${mode} > svg.worldmap`)).toBeVisible()
    const target = await currentTarget(page)
    const wrong = target === 'pl' ? 'de' : 'pl'
    const click = async (id: string) => {
      const b = (await page.locator(`.clickmap path[data-id="${id}"]`).boundingBox())!
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2)
    }
    await click(wrong)
    await expect(page.locator('.retry-row')).toContainText('2 tries left')
    if (mode === 'borders') await expect(page.locator('.retry-row')).toContainText('You clicked')
    else await expect(page.locator('.retry-row')).not.toContainText('You clicked')
    await page.getByRole('button', { name: 'Show answer' }).click()
    await expect(page.locator('.clickmap.is-resolved')).toBeVisible()
    await expect(page.locator(`.clickmap path[data-id="${target}"]`)).toHaveClass(/ok/)
  })
}

test('guest: German locale switch', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Deutsch', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Übung starten' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  // plural + interpolated messages render in German too
  await page.goto('/explore')
  await expect(page.locator('.count-line')).toHaveText(/^\d+ Länder$/)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Neugier') // locale survives reload (prefs)
})
