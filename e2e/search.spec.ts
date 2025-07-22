import { test, expect } from '@playwright/test';
import { ctrl } from './utils';

test('search and next', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic-large--sheet&viewMode=story');
  const a1 = page.locator("[data-address='A1']");
  await a1.click();

  const searchBar = page.locator('.gs-search-bar');
  const progress = page.locator('.gs-search-progress');
  expect(await searchBar.count()).toBe(0);

  await ctrl(page, 'f');
  await page.waitForSelector('.gs-search-bar', { timeout: 3000 });

  expect(await searchBar.count()).toBe(1);
  expect(await progress.textContent()).toBe('0 / 0');

  await page.keyboard.up('Control');
  await page.keyboard.type('200');
  expect(await progress.textContent()).toBe('1 / 9');

  const a201 = page.locator("[data-address='A201']");
  expect(await a201.getAttribute('class')).toContain('gs-choosing');

  await page.keyboard.press('Enter');
  expect(await progress.textContent()).toBe('2 / 9');
  const b201 = page.locator("[data-address='B201']");
  expect(await b201.getAttribute('class')).toContain('gs-choosing');

  await page.keyboard.press('Enter');
  expect(await progress.textContent()).toBe('3 / 9');
  const g201 = page.locator("[data-address='G201']");
  expect(await g201.getAttribute('class')).toContain('gs-choosing');

  const a2001 = page.locator("[data-address='A2001']");
  // update the keyword to '2000'
  await page.keyboard.type('0');
  expect(await progress.textContent()).toBe('1 / 3');
  expect(await a2001.getAttribute('class')).toContain('gs-choosing');

  const b2001 = page.locator("[data-address='B2001']");
  await page.keyboard.press('Enter');
  expect(await progress.textContent()).toBe('2 / 3');
  expect(await b2001.getAttribute('class')).toContain('gs-choosing');

  const g2001 = page.locator("[data-address='G2001']");
  await page.keyboard.press('Enter');
  expect(await progress.textContent()).toBe('3 / 3');
  expect(await g2001.getAttribute('class')).toContain('gs-choosing');

  // back to the first result
  await page.keyboard.press('Enter');
  expect(await progress.textContent()).toBe('1 / 3');
  expect(await a2001.getAttribute('class')).toContain('gs-choosing');

  await page.keyboard.press('Escape');
  expect(await searchBar.count()).toBe(0);
});
