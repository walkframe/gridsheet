import { test, expect } from '@playwright/test';
import { go } from './utils';

test('time arithmetic and DD MMM [YYYY] input', async ({ page }) => {
  await go(page, 'basic-simple--sheet');

  const a4 = page.locator("[data-address='A4']");
  const b4 = page.locator("[data-address='B4']");
  const c4 = page.locator("[data-address='C4']");
  const a5 = page.locator("[data-address='A5']");

  expect(await a4.locator('.gs-cell-rendered').textContent()).toBe('2022-03-05 12:34:56');
  expect(await b4.locator('.gs-cell-rendered').textContent()).toBe('11:11:11');
  expect(await c4.locator('.gs-cell-rendered').textContent()).toBe('2022-03-05 23:46:07');
  expect(await a5.locator('.gs-cell-rendered').textContent()).toBe('2022-03-04 23:34:56');

  const b5 = page.locator("[data-address='B5']");
  await b5.click();
  await page.keyboard.type('30 Nov');
  await page.keyboard.press('Enter');
  expect(await b5.locator('.gs-cell-rendered').textContent()).toBe('2001-11-29 15:00:00');

  const c5 = page.locator("[data-address='C5']");
  await c5.click();
  await page.keyboard.type('30 Nov 2024');
  await page.keyboard.press('Enter');
  expect(await c5.locator('.gs-cell-rendered').textContent()).toBe('2024-11-29 15:00:00');
});
