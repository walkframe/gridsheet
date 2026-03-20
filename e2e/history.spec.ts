import { test, expect } from '@playwright/test';
import { ctrl, cut, go, paste } from './utils';

test('undo redo for cell writing', async ({ page }) => {
  await go(page, 'basic-simple--sheet');

  // Test A1 (existing value: "A1")
  const a1 = page.locator("[data-address='A1']");
  const originalA1Value = await a1.locator('.gs-cell-rendered').textContent();

  await a1.click();
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
  await go(page, 'basic-simple--sheet');

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
  await go(page, 'basic-simple--sheet');

  const a1 = page.locator("[data-address='A1']");
  const a2 = page.locator("[data-address='A2']");
  const a3 = page.locator("[data-address='A3']");

  const originalA1Value = await a1.locator('.gs-cell-rendered').textContent();

  // Multiple operations
  await a1.click();
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

test('undo redo for column width resize', async ({ page }) => {
  await go(page, 'basic-simple--sheet');

  // Column A header (<th data-x="1">)
  const colAHeader = page.locator('th.gs-th-top[data-x="1"]');
  const resizer = colAHeader.locator('.gs-resizer');

  // Get initial width
  const initialBox = await colAHeader.boundingBox();
  const initialWidth = initialBox!.width;

  // Drag the resizer 60px to the right
  const resizerBox = await resizer.boundingBox();
  const resizerX = resizerBox!.x + resizerBox!.width / 2;
  const resizerY = resizerBox!.y + resizerBox!.height / 2;

  await page.mouse.move(resizerX, resizerY);
  await page.mouse.down();
  await page.mouse.move(resizerX + 60, resizerY, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(200);

  // Verify the width increased
  const resizedBox = await colAHeader.boundingBox();
  const resizedWidth = resizedBox!.width;
  expect(resizedWidth).toBeGreaterThan(initialWidth);

  // Undo — width should return to original
  await ctrl(page, 'z');
  await page.waitForTimeout(100);
  const afterUndoBox = await colAHeader.boundingBox();
  expect(afterUndoBox!.width).toBeCloseTo(initialWidth, 0);

  // Redo — width should increase again
  await ctrl(page, 'z', true);
  await page.waitForTimeout(300);

  const afterRedoBox = await colAHeader.boundingBox();
  expect(afterRedoBox!.width).toBeGreaterThan(initialWidth);
});
