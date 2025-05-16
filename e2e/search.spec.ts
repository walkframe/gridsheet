import { test, expect } from '@playwright/test';

test('search and next', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic--large&viewMode=story');

  const searchBar = page.locator('.gs-search-bar');
  const progress = page.locator('.gs-search-progress');
  expect(await searchBar.count()).toBe(0);

  await page.keyboard.down('Control');
  await page.keyboard.press('f');
  await page.waitForSelector('.gs-search-bar', { timeout: 3000 });

  expect(await searchBar.count()).toBe(1);
  expect(await progress.textContent()).toBe('0 / 0');

  await page.keyboard.up('Control');
  await page.keyboard.type('aa');
  expect(await progress.textContent()).toBe('1 / 3');

  const a500 = page.locator("[data-address='A500']");
  expect(await a500.getAttribute('class')).toContain('gs-choosing');

  await page.keyboard.press('Enter');
  expect(await progress.textContent()).toBe('2 / 3');
  const a1000 = page.locator("[data-address='A1000']");
  expect(await a1000.getAttribute('class')).toContain('gs-choosing');

  await page.keyboard.press('Enter');
  expect(await progress.textContent()).toBe('3 / 3');
  const cv1000 = page.locator("[data-address='CV1000']");
  expect(await cv1000.getAttribute('class')).toContain('gs-choosing');

  // update the keyword to 'aaa'
  await page.keyboard.type('a');
  expect(await progress.textContent()).toBe('1 / 2');
  expect(await a1000.getAttribute('class')).toContain('gs-choosing');

  await page.keyboard.press('Enter');
  expect(await progress.textContent()).toBe('2 / 2');
  expect(await cv1000.getAttribute('class')).toContain('gs-choosing');

  await page.keyboard.press('Enter');
  expect(await progress.textContent()).toBe('1 / 2');
  expect(await a1000.getAttribute('class')).toContain('gs-choosing');

  await page.keyboard.press('Escape');
  expect(await searchBar.count()).toBe(0);
});
