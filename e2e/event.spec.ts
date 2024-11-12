import { test, expect } from '@playwright/test';
import { jsonMinify, jsonQuery } from './utils';

test('show the diff', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=table-operations--sheet-on-change&viewMode=story');
  const b2 = page.locator("[data-address='B2']");
  await b2.dblclick();
  await page.keyboard.type('777');
  await page.keyboard.press('Enter');

  const diff = page.locator('#diff');
  expect(jsonMinify(await diff.inputValue())).toContain('{"B2":7777}');
});

test('1 operation makes 1 diff history', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=table-operations--sheet-on-change&viewMode=story');
  const histories = page.locator('.histories li');
  
  const b4 = page.locator("[data-address='B4']");
  await b4.click();
  await page.keyboard.type('4444');
  await page.keyboard.press('Enter');

  expect(await histories.count()).toBe(1);
  
  const c1 = page.locator("[data-address='C1']");
  await c1.click();
  await page.keyboard.press('Backspace');

  expect(await histories.count()).toBe(2);

  const firstJSON = await histories.nth(0).locator('pre').textContent();
  expect(jsonQuery(firstJSON!, ['B4', 'value'])).toBe(4444);

  const secondJSON = await histories.nth(1).locator('pre').textContent();
  expect(jsonQuery(secondJSON!, ['C1', 'value'])).toBe(null);
});

test('escape key should cancel the editing', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=table-operations--sheet-on-change&viewMode=story');
  
  const histories = page.locator('.histories li');

  const b2 = page.locator("[data-address='B2']");
  await b2.click();
  await page.keyboard.type('7777777');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Enter');

  expect(await histories.count()).toBe(0);
  expect(await b2.locator('.gs-cell-rendered').textContent()).toBe('7');
});

test('edit on enter', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic--small&viewMode=story');
  const address = page.locator('.gs-selecting-address');
  const editor = page.locator('.gs-editor');
  const b2 = page.locator("[data-address='B2']");
  await b2.click();

  expect(await address.textContent()).toBe('B2');
  expect(await editor.getAttribute('class')).not.toContain('gs-editing');
  await page.keyboard.press('Enter');
  expect(await address.textContent()).toBe('B2');
  expect(await editor.getAttribute('class')).toContain('gs-editing');
  await page.keyboard.press('Enter');
  expect(await address.textContent()).toBe('B3');
  expect(await editor.getAttribute('class')).not.toContain('gs-editing');
  await page.keyboard.press('Enter');
  expect(await address.textContent()).toBe('B3');
  expect(await editor.getAttribute('class')).toContain('gs-editing');
});
