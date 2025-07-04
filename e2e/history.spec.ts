import { test, expect } from '@playwright/test';
import { ctrl, cut, paste } from './utils';

test('undo redo for cell writing', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic-simple--sheet&viewMode=story');

  // Test A1 (existing value: "A1")
  const a1 = page.locator("[data-address='A1']");
  const originalA1Value = await a1.locator('.gs-cell-rendered').textContent();

  await a1.click();
  const editor = page.locator('.gs-editor textarea');
  // Clear the editor first
  await editor.fill('');
  await page.keyboard.type('NewValue');
  await page.keyboard.press('Enter');

  // Verify the change
  expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('NewValue');

  // Undo
  await ctrl(page, 'z');
  expect(await a1.locator('.gs-cell-rendered').textContent()).toBe(originalA1Value);

  // Redo
  await ctrl(page, 'z', true);
  expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('NewValue');

  // Test A2 (empty cell: null)
  const a2 = page.locator("[data-address='A2']");
  await a2.click();
  await page.keyboard.type('TestValue');
  await page.keyboard.press('Enter');

  // Verify the change
  expect(await a2.locator('.gs-cell-rendered').textContent()).toBe('TestValue');

  // Undo
  await ctrl(page, 'z');
  expect(await a2.locator('.gs-cell-rendered').textContent()).toBe('');

  // Redo
  await ctrl(page, 'z', true);
  expect(await a2.locator('.gs-cell-rendered').textContent()).toBe('TestValue');
});

test('undo redo for cut and paste', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic-simple--sheet&viewMode=story');

  // Test cut and paste operation
  const a1 = page.locator("[data-address='A1']");
  const a2 = page.locator("[data-address='A2']");
  const c3 = page.locator("[data-address='C3']");

  const originalA1Value = await a1.locator('.gs-cell-rendered').textContent();
  const originalA2Value = await a2.locator('.gs-cell-rendered').textContent();
  const originalC3Value = await c3.locator('.gs-cell-rendered').textContent();

  // Select A1 and cut
  await a1.click();
  await cut(page);

  // Paste to C3
  await c3.click();
  await paste(page);

  // Verify the paste operation and that A1 is now empty (cut completed)
  expect(await c3.locator('.gs-cell-rendered').textContent()).toBe(originalA1Value);
  expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('');

  // Undo paste (should restore A1 and restore C3 to original value)
  await ctrl(page, 'z');
  expect(await c3.locator('.gs-cell-rendered').textContent()).toBe(originalC3Value);
  expect(await a1.locator('.gs-cell-rendered').textContent()).toBe(originalA1Value);

  // Redo paste
  await ctrl(page, 'z', true);
  expect(await c3.locator('.gs-cell-rendered').textContent()).toBe(originalA1Value);
  expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('');
});

test('multiple undo redo operations', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic-simple--sheet&viewMode=story');

  const a1 = page.locator("[data-address='A1']");
  const a2 = page.locator("[data-address='A2']");
  const a3 = page.locator("[data-address='A3']");

  const originalA1Value = await a1.locator('.gs-cell-rendered').textContent();

  // Multiple operations
  await a1.click();
  const editor = page.locator('.gs-editor textarea');
  await editor.fill('');
  await page.keyboard.type('First');
  await page.keyboard.press('Enter');

  await a2.click();
  await page.keyboard.type('Second');
  await page.keyboard.press('Enter');

  await a3.click();
  await page.keyboard.type('Third');
  await page.keyboard.press('Enter');

  // Verify all changes
  expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('First');
  expect(await a2.locator('.gs-cell-rendered').textContent()).toBe('Second');
  expect(await a3.locator('.gs-cell-rendered').textContent()).toBe('Third');

  // Undo all operations
  await ctrl(page, 'z'); // Undo Third
  expect(await a3.locator('.gs-cell-rendered').textContent()).toBe('');

  await ctrl(page, 'z'); // Undo Second
  expect(await a2.locator('.gs-cell-rendered').textContent()).toBe('');

  await ctrl(page, 'z'); // Undo First
  expect(await a1.locator('.gs-cell-rendered').textContent()).toBe(originalA1Value);

  // Redo all operations
  await ctrl(page, 'z', true); // Redo First
  expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('First');

  await ctrl(page, 'z', true); // Redo Second
  expect(await a2.locator('.gs-cell-rendered').textContent()).toBe('Second');

  await ctrl(page, 'z', true); // Redo Third
  expect(await a3.locator('.gs-cell-rendered').textContent()).toBe('Third');
});
