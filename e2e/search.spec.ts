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

  const a200 = page.locator("[data-address='A200']");
  expect(await a200.getAttribute('class')).toContain('gs-choosing');

  await page.keyboard.press('Enter');
  expect(await progress.textContent()).toBe('2 / 9');
  const b200 = page.locator("[data-address='B200']");
  expect(await b200.getAttribute('class')).toContain('gs-choosing');

  await page.keyboard.press('Enter');
  expect(await progress.textContent()).toBe('3 / 9');
  const g200 = page.locator("[data-address='G200']");
  expect(await g200.getAttribute('class')).toContain('gs-choosing');

  const a2000 = page.locator("[data-address='A2000']");
  // update the keyword to '2000'
  await page.keyboard.type('0');
  expect(await progress.textContent()).toBe('1 / 3');
  expect(await a2000.getAttribute('class')).toContain('gs-choosing');

  const b2000 = page.locator("[data-address='B2000']");
  await page.keyboard.press('Enter');
  expect(await progress.textContent()).toBe('2 / 3');
  expect(await b2000.getAttribute('class')).toContain('gs-choosing');

  const g2000 = page.locator("[data-address='G2000']");
  await page.keyboard.press('Enter');
  expect(await progress.textContent()).toBe('3 / 3');
  expect(await g2000.getAttribute('class')).toContain('gs-choosing');

  // back to the first result
  await page.keyboard.press('Enter');
  expect(await progress.textContent()).toBe('1 / 3');
  expect(await a2000.getAttribute('class')).toContain('gs-choosing');

  await page.keyboard.press('Escape');
  expect(await searchBar.count()).toBe(0);
});
