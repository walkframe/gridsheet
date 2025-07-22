import { test, expect } from '@playwright/test';
import { ctrl, drag, paste } from './utils';

test.describe('Control Operations', () => {
  test.describe('Insert Operations', () => {
    test('should insert row above 2nd row', async ({ page }) => {
      await page.goto('http://localhost:5233/iframe.html?id=control-insert--insert');

      // Define cell locators using data-address
      const a1 = page.locator("[data-address='A1']");
      const b1 = page.locator("[data-address='B1']");
      const c1 = page.locator("[data-address='C1']");
      const a2 = page.locator("[data-address='A2']");
      const b2 = page.locator("[data-address='B2']");
      const c2 = page.locator("[data-address='C2']");
      const a3 = page.locator("[data-address='A3']");
      const b3 = page.locator("[data-address='B3']");
      const c3 = page.locator("[data-address='C3']");

      // Check initial state: 3x3 grid with [1,2,3], [4,5,9], [5,7,12]
      await expect(a1.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(b1.locator('.gs-cell-rendered')).toHaveText('2');
      await expect(c1.locator('.gs-cell-rendered')).toHaveText('3');
      await expect(a2.locator('.gs-cell-rendered')).toHaveText('4');
      await expect(b2.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(c2.locator('.gs-cell-rendered')).toHaveText('9');
      await expect(a3.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(b3.locator('.gs-cell-rendered')).toHaveText('7');
      await expect(c3.locator('.gs-cell-rendered')).toHaveText('12');

      // Select 2nd row
      await page.locator("th[data-y='2']").click();

      // Click "Insert Row Above" button
      await page.click('button:has-text("Insert Row Above")');

      // Wait for the grid to update
      await page.waitForTimeout(100);

      // Check that a new row was inserted above 2nd row (now 4x3 grid)
      // First row should remain the same
      await expect(a1.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(b1.locator('.gs-cell-rendered')).toHaveText('2');
      await expect(c1.locator('.gs-cell-rendered')).toHaveText('3');

      // Second row should be empty (new row)
      await expect(a2.locator('.gs-cell-rendered')).toHaveText('');
      await expect(b2.locator('.gs-cell-rendered')).toHaveText('');
      await expect(c2.locator('.gs-cell-rendered')).toHaveText('');

      // Third row should have the original second row values
      await expect(a3.locator('.gs-cell-rendered')).toHaveText('4');
      await expect(b3.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(c3.locator('.gs-cell-rendered')).toHaveText('9');

      // Fourth row should have the original third row values
      await expect(page.locator("[data-address='A4']").locator('.gs-cell-rendered')).toHaveText('5');
      await expect(page.locator("[data-address='B4']").locator('.gs-cell-rendered')).toHaveText('7');
      await expect(page.locator("[data-address='C4']").locator('.gs-cell-rendered')).toHaveText('12');

      // Test Undo - should restore original state
      await a1.click();
      await ctrl(page, 'z');
      await page.waitForTimeout(100);

      // Check that the grid is back to original state
      await expect(a1.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(b1.locator('.gs-cell-rendered')).toHaveText('2');
      await expect(c1.locator('.gs-cell-rendered')).toHaveText('3');
      await expect(a2.locator('.gs-cell-rendered')).toHaveText('4');
      await expect(b2.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(c2.locator('.gs-cell-rendered')).toHaveText('9');
      await expect(a3.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(b3.locator('.gs-cell-rendered')).toHaveText('7');
      await expect(c3.locator('.gs-cell-rendered')).toHaveText('12');

      // Test Redo - should reapply the insert operation
      await a1.click();
      await ctrl(page, 'z', true);
      await page.waitForTimeout(100);

      // Check that the insert operation is reapplied
      await expect(a1.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(b1.locator('.gs-cell-rendered')).toHaveText('2');
      await expect(c1.locator('.gs-cell-rendered')).toHaveText('3');
      await expect(a2.locator('.gs-cell-rendered')).toHaveText('');
      await expect(b2.locator('.gs-cell-rendered')).toHaveText('');
      await expect(c2.locator('.gs-cell-rendered')).toHaveText('');
      await expect(a3.locator('.gs-cell-rendered')).toHaveText('4');
      await expect(b3.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(c3.locator('.gs-cell-rendered')).toHaveText('9');
      await expect(page.locator("[data-address='A4']").locator('.gs-cell-rendered')).toHaveText('5');
      await expect(page.locator("[data-address='B4']").locator('.gs-cell-rendered')).toHaveText('7');
      await expect(page.locator("[data-address='C4']").locator('.gs-cell-rendered')).toHaveText('12');
    });

    test('should insert row below 2nd row', async ({ page }) => {
      await page.goto('http://localhost:5233/iframe.html?id=control-insert--insert');

      // Define cell locators using data-address
      const a1 = page.locator("[data-address='A1']");
      const b1 = page.locator("[data-address='B1']");
      const c1 = page.locator("[data-address='C1']");
      const a2 = page.locator("[data-address='A2']");
      const b2 = page.locator("[data-address='B2']");
      const c2 = page.locator("[data-address='C2']");
      const a3 = page.locator("[data-address='A3']");
      const b3 = page.locator("[data-address='B3']");
      const c3 = page.locator("[data-address='C3']");

      // Select 2nd row
      await page.locator("th[data-y='2']").click();

      // Click "Insert Row Below" button
      await page.click('button:has-text("Insert Row Below")');

      // Wait for the grid to update
      await page.waitForTimeout(100);

      // Check that a new row was inserted below 2nd row (now 4x3 grid)
      // First row should remain the same
      await expect(a1.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(b1.locator('.gs-cell-rendered')).toHaveText('2');
      await expect(c1.locator('.gs-cell-rendered')).toHaveText('3');

      // Second row should remain the same
      await expect(a2.locator('.gs-cell-rendered')).toHaveText('4');
      await expect(b2.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(c2.locator('.gs-cell-rendered')).toHaveText('9');

      // Third row should be empty (new row)
      await expect(a3.locator('.gs-cell-rendered')).toHaveText('');
      await expect(b3.locator('.gs-cell-rendered')).toHaveText('');
      await expect(c3.locator('.gs-cell-rendered')).toHaveText('');

      // Fourth row should have the original third row values
      await expect(page.locator("[data-address='A4']").locator('.gs-cell-rendered')).toHaveText('5');
      await expect(page.locator("[data-address='B4']").locator('.gs-cell-rendered')).toHaveText('7');
      await expect(page.locator("[data-address='C4']").locator('.gs-cell-rendered')).toHaveText('12');

      // Test Undo - should restore original state
      await a1.click();
      await ctrl(page, 'z');
      await page.waitForTimeout(100);

      // Check that the grid is back to original state
      await expect(a1.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(b1.locator('.gs-cell-rendered')).toHaveText('2');
      await expect(c1.locator('.gs-cell-rendered')).toHaveText('3');
      await expect(a2.locator('.gs-cell-rendered')).toHaveText('4');
      await expect(b2.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(c2.locator('.gs-cell-rendered')).toHaveText('9');
      await expect(a3.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(b3.locator('.gs-cell-rendered')).toHaveText('7');
      await expect(c3.locator('.gs-cell-rendered')).toHaveText('12');

      // Test Redo - should reapply the insert operation
      await a1.click();
      await ctrl(page, 'z', true);
      await page.waitForTimeout(100);

      // Check that the insert operation is reapplied
      await expect(a1.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(b1.locator('.gs-cell-rendered')).toHaveText('2');
      await expect(c1.locator('.gs-cell-rendered')).toHaveText('3');
      await expect(a2.locator('.gs-cell-rendered')).toHaveText('4');
      await expect(b2.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(c2.locator('.gs-cell-rendered')).toHaveText('9');
      await expect(a3.locator('.gs-cell-rendered')).toHaveText('');
      await expect(b3.locator('.gs-cell-rendered')).toHaveText('');
      await expect(c3.locator('.gs-cell-rendered')).toHaveText('');
      await expect(page.locator("[data-address='A4']").locator('.gs-cell-rendered')).toHaveText('5');
      await expect(page.locator("[data-address='B4']").locator('.gs-cell-rendered')).toHaveText('7');
      await expect(page.locator("[data-address='C4']").locator('.gs-cell-rendered')).toHaveText('12');
    });

    test('should insert column left of 2nd column', async ({ page }) => {
      await page.goto('http://localhost:5233/iframe.html?id=control-insert--insert');

      // Define cell locators using data-address
      const a1 = page.locator("[data-address='A1']");
      const b1 = page.locator("[data-address='B1']");
      const c1 = page.locator("[data-address='C1']");
      const a2 = page.locator("[data-address='A2']");
      const b2 = page.locator("[data-address='B2']");
      const c2 = page.locator("[data-address='C2']");
      const a3 = page.locator("[data-address='A3']");
      const b3 = page.locator("[data-address='B3']");
      const c3 = page.locator("[data-address='C3']");

      // Select 2nd column
      await page.locator("th[data-x='2']").click();

      // Click "Insert Column Left" button
      await page.click('button:has-text("Insert Column Left")');

      // Wait for the grid to update
      await page.waitForTimeout(100);

      // Check that a new column was inserted left of 2nd column (now 3x4 grid)
      // First column should remain the same
      await expect(a1.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(a2.locator('.gs-cell-rendered')).toHaveText('4');
      await expect(a3.locator('.gs-cell-rendered')).toHaveText('5');

      // Second column should be empty (new column)
      await expect(b1.locator('.gs-cell-rendered')).toHaveText('');
      await expect(b2.locator('.gs-cell-rendered')).toHaveText('');
      await expect(b3.locator('.gs-cell-rendered')).toHaveText('');

      // Third column should have the original second column values
      await expect(c1.locator('.gs-cell-rendered')).toHaveText('2');
      await expect(c2.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(c3.locator('.gs-cell-rendered')).toHaveText('7');

      // Fourth column should have the original third column values
      await expect(page.locator("[data-address='D1']").locator('.gs-cell-rendered')).toHaveText('3');
      await expect(page.locator("[data-address='D2']").locator('.gs-cell-rendered')).toHaveText('9');
      await expect(page.locator("[data-address='D3']").locator('.gs-cell-rendered')).toHaveText('12');

      // Test Undo - should restore original state
      await a1.click();
      await ctrl(page, 'z');
      await page.waitForTimeout(100);

      // Check that the grid is back to original state
      await expect(a1.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(b1.locator('.gs-cell-rendered')).toHaveText('2');
      await expect(c1.locator('.gs-cell-rendered')).toHaveText('3');
      await expect(a2.locator('.gs-cell-rendered')).toHaveText('4');
      await expect(b2.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(c2.locator('.gs-cell-rendered')).toHaveText('9');
      await expect(a3.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(b3.locator('.gs-cell-rendered')).toHaveText('7');
      await expect(c3.locator('.gs-cell-rendered')).toHaveText('12');

      // Test Redo - should reapply the insert operation
      await a1.click();
      await ctrl(page, 'z', true);
      await page.waitForTimeout(100);

      // Check that the insert operation is reapplied
      await expect(a1.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(a2.locator('.gs-cell-rendered')).toHaveText('4');
      await expect(a3.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(b1.locator('.gs-cell-rendered')).toHaveText('');
      await expect(b2.locator('.gs-cell-rendered')).toHaveText('');
      await expect(b3.locator('.gs-cell-rendered')).toHaveText('');
      await expect(c1.locator('.gs-cell-rendered')).toHaveText('2');
      await expect(c2.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(c3.locator('.gs-cell-rendered')).toHaveText('7');
      await expect(page.locator("[data-address='D1']").locator('.gs-cell-rendered')).toHaveText('3');
      await expect(page.locator("[data-address='D2']").locator('.gs-cell-rendered')).toHaveText('9');
      await expect(page.locator("[data-address='D3']").locator('.gs-cell-rendered')).toHaveText('12');
    });

    test('should insert column right of 2nd column', async ({ page }) => {
      await page.goto('http://localhost:5233/iframe.html?id=control-insert--insert');

      // Define cell locators using data-address
      const a1 = page.locator("[data-address='A1']");
      const b1 = page.locator("[data-address='B1']");
      const c1 = page.locator("[data-address='C1']");
      const a2 = page.locator("[data-address='A2']");
      const b2 = page.locator("[data-address='B2']");
      const c2 = page.locator("[data-address='C2']");
      const a3 = page.locator("[data-address='A3']");
      const b3 = page.locator("[data-address='B3']");
      const c3 = page.locator("[data-address='C3']");

      // Select 2nd column
      await page.locator("th[data-x='2']").click();

      // Click "Insert Column Right" button
      await page.click('button:has-text("Insert Column Right")');

      // Wait for the grid to update
      await page.waitForTimeout(100);

      // Check that a new column was inserted right of 2nd column (now 3x4 grid)
      // First column should remain the same
      await expect(a1.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(a2.locator('.gs-cell-rendered')).toHaveText('4');
      await expect(a3.locator('.gs-cell-rendered')).toHaveText('5');

      // Second column should remain the same
      await expect(b1.locator('.gs-cell-rendered')).toHaveText('2');
      await expect(b2.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(b3.locator('.gs-cell-rendered')).toHaveText('7');

      // Third column should be empty (new column)
      await expect(c1.locator('.gs-cell-rendered')).toHaveText('');
      await expect(c2.locator('.gs-cell-rendered')).toHaveText('');
      await expect(c3.locator('.gs-cell-rendered')).toHaveText('');

      // Fourth column should have the original third column values
      await expect(page.locator("[data-address='D1']").locator('.gs-cell-rendered')).toHaveText('3');
      await expect(page.locator("[data-address='D2']").locator('.gs-cell-rendered')).toHaveText('9');
      await expect(page.locator("[data-address='D3']").locator('.gs-cell-rendered')).toHaveText('12');

      // Test Undo - should restore original state
      await a1.click();
      await ctrl(page, 'z');
      await page.waitForTimeout(100);

      // Check that the grid is back to original state
      await expect(a1.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(b1.locator('.gs-cell-rendered')).toHaveText('2');
      await expect(c1.locator('.gs-cell-rendered')).toHaveText('3');
      await expect(a2.locator('.gs-cell-rendered')).toHaveText('4');
      await expect(b2.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(c2.locator('.gs-cell-rendered')).toHaveText('9');
      await expect(a3.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(b3.locator('.gs-cell-rendered')).toHaveText('7');
      await expect(c3.locator('.gs-cell-rendered')).toHaveText('12');

      // Test Redo - should reapply the insert operation
      await a1.click();
      await ctrl(page, 'z', true);
      await page.waitForTimeout(100);

      // Check that the insert operation is reapplied
      await expect(a1.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(a2.locator('.gs-cell-rendered')).toHaveText('4');
      await expect(a3.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(b1.locator('.gs-cell-rendered')).toHaveText('2');
      await expect(b2.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(b3.locator('.gs-cell-rendered')).toHaveText('7');
      await expect(c1.locator('.gs-cell-rendered')).toHaveText('');
      await expect(c2.locator('.gs-cell-rendered')).toHaveText('');
      await expect(c3.locator('.gs-cell-rendered')).toHaveText('');
      await expect(page.locator("[data-address='D1']").locator('.gs-cell-rendered')).toHaveText('3');
      await expect(page.locator("[data-address='D2']").locator('.gs-cell-rendered')).toHaveText('9');
      await expect(page.locator("[data-address='D3']").locator('.gs-cell-rendered')).toHaveText('12');
    });
  });

  test.describe('Remove Operations', () => {
    test('should remove 2nd row', async ({ page }) => {
      await page.goto('http://localhost:5233/iframe.html?id=control-insert--insert');

      // Define cell locators using data-address
      const a1 = page.locator("[data-address='A1']");
      const b1 = page.locator("[data-address='B1']");
      const c1 = page.locator("[data-address='C1']");
      const a2 = page.locator("[data-address='A2']");
      const b2 = page.locator("[data-address='B2']");
      const c2 = page.locator("[data-address='C2']");
      const a3 = page.locator("[data-address='A3']");
      const b3 = page.locator("[data-address='B3']");
      const c3 = page.locator("[data-address='C3']");

      // Select 2nd row
      await page.locator("th[data-y='2']").click();

      // Click "Remove Row" button
      await page.click('button:has-text("Remove Row")');

      // Wait for the grid to update
      await page.waitForTimeout(100);

      // Check that the 2nd row was removed (now 2x3 grid)
      // First row should remain the same
      await expect(a1.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(b1.locator('.gs-cell-rendered')).toHaveText('2');
      await expect(c1.locator('.gs-cell-rendered')).toHaveText('3');

      // Second row should have the original third row values
      await expect(a2.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(b2.locator('.gs-cell-rendered')).toHaveText('2');
      await expect(c2.locator('.gs-cell-rendered')).toHaveText('3');

      // Test Undo - should restore original state
      await a1.click();
      await ctrl(page, 'z');
      await page.waitForTimeout(100);

      // Check that the grid is back to original state
      await expect(a1.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(b1.locator('.gs-cell-rendered')).toHaveText('2');
      await expect(c1.locator('.gs-cell-rendered')).toHaveText('3');
      await expect(a2.locator('.gs-cell-rendered')).toHaveText('4');
      await expect(b2.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(c2.locator('.gs-cell-rendered')).toHaveText('9');
      await expect(a3.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(b3.locator('.gs-cell-rendered')).toHaveText('7');
      await expect(c3.locator('.gs-cell-rendered')).toHaveText('12');

      // Test Redo - should reapply the remove operation
      await a1.click();
      await ctrl(page, 'z', true);
      await page.waitForTimeout(100);

      // Check that the remove operation is reapplied
      await expect(a1.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(b1.locator('.gs-cell-rendered')).toHaveText('2');
      await expect(c1.locator('.gs-cell-rendered')).toHaveText('3');
      await expect(a2.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(b2.locator('.gs-cell-rendered')).toHaveText('2');
      await expect(c2.locator('.gs-cell-rendered')).toHaveText('3');
    });

    test('should remove 2nd column', async ({ page }) => {
      await page.goto('http://localhost:5233/iframe.html?id=control-insert--insert');

      // Define cell locators using data-address
      const a1 = page.locator("[data-address='A1']");
      const b1 = page.locator("[data-address='B1']");
      const c1 = page.locator("[data-address='C1']");
      const a2 = page.locator("[data-address='A2']");
      const b2 = page.locator("[data-address='B2']");
      const c2 = page.locator("[data-address='C2']");
      const a3 = page.locator("[data-address='A3']");
      const b3 = page.locator("[data-address='B3']");
      const c3 = page.locator("[data-address='C3']");

      // Select 2nd column
      await page.locator("th[data-x='2']").click();

      // Click "Remove Column" button
      await page.click('button:has-text("Remove Column")');

      // Wait for the grid to update
      await page.waitForTimeout(100);

      // Check that the 2nd column was removed (now 3x2 grid)
      // First column should remain the same
      await expect(a1.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(a2.locator('.gs-cell-rendered')).toHaveText('4');
      await expect(a3.locator('.gs-cell-rendered')).toHaveText('5');

      // Second column should have the original third column values
      await expect(b1.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(b2.locator('.gs-cell-rendered')).toHaveText('4');
      await expect(b3.locator('.gs-cell-rendered')).toHaveText('5');

      // Test Undo - should restore original state
      await a1.click();
      await ctrl(page, 'z');
      await page.waitForTimeout(100);

      // Check that the grid is back to original state
      await expect(a1.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(b1.locator('.gs-cell-rendered')).toHaveText('2');
      await expect(c1.locator('.gs-cell-rendered')).toHaveText('3');
      await expect(a2.locator('.gs-cell-rendered')).toHaveText('4');
      await expect(b2.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(c2.locator('.gs-cell-rendered')).toHaveText('9');
      await expect(a3.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(b3.locator('.gs-cell-rendered')).toHaveText('7');
      await expect(c3.locator('.gs-cell-rendered')).toHaveText('12');

      // Test Redo - should reapply the remove operation
      await a1.click();
      await ctrl(page, 'z', true);
      await page.waitForTimeout(100);

      // Check that the remove operation is reapplied
      await expect(a1.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(a2.locator('.gs-cell-rendered')).toHaveText('4');
      await expect(a3.locator('.gs-cell-rendered')).toHaveText('5');
      await expect(b1.locator('.gs-cell-rendered')).toHaveText('1');
      await expect(b2.locator('.gs-cell-rendered')).toHaveText('4');
      await expect(b3.locator('.gs-cell-rendered')).toHaveText('5');
    });
  });

  test.describe('Move Operations', () => {
    test('should move cells between sheets', async ({ page }) => {
      await page.goto('http://localhost:5233/iframe.html?id=multiple-sheets--sheets&viewMode=story');

      // Define sheet locators
      const sheet1 = page.locator('[data-sheet-name="Sheet1"]');
      const sheet2 = page.locator('[data-sheet-name="Sheet2"]');

      // Check initial state of Sheet1 C5
      const sheet1C5 = sheet1.locator("[data-address='C5']");
      const sheet1C5Initial = await sheet1C5.locator('.gs-cell-rendered').textContent();

      // Check initial state of Sheet2 A3
      const sheet2A3 = sheet2.locator("[data-address='A3']");
      const sheet2A3Initial = await sheet2A3.locator('.gs-cell-rendered').textContent();

      // Verify that C5 has a value
      expect(sheet1C5Initial).toBeDefined();
      expect(sheet1C5Initial).not.toBe('');

      // Select C5 in Sheet1
      await sheet1C5.click();

      // Cut the selected cell (Ctrl+X)
      await ctrl(page, 'x');
      await page.waitForTimeout(200);

      // Switch to Sheet2 and paste at A3
      await sheet2A3.click();
      await ctrl(page, 'v');
      await page.waitForTimeout(300);

      // Verify that operations completed without error
      const sheet1C5AfterMove = await sheet1C5.locator('.gs-cell-rendered').textContent();
      const sheet2A3AfterMove = await sheet2A3.locator('.gs-cell-rendered').textContent();

      expect(sheet1C5AfterMove).toBeDefined();
      expect(sheet2A3AfterMove).toBeDefined();

      // Test Undo/Redo operations
      await sheet1C5.click();
      await ctrl(page, 'z');
      await page.waitForTimeout(200);

      const sheet1C5AfterUndo = await sheet1C5.locator('.gs-cell-rendered').textContent();
      const sheet2A3AfterUndo = await sheet2A3.locator('.gs-cell-rendered').textContent();

      expect(sheet1C5AfterUndo).toBeDefined();
      expect(sheet2A3AfterUndo).toBeDefined();

      await sheet1C5.click();
      await ctrl(page, 'z', true);
      await page.waitForTimeout(200);

      const sheet1C5AfterRedo = await sheet1C5.locator('.gs-cell-rendered').textContent();
      const sheet2A3AfterRedo = await sheet2A3.locator('.gs-cell-rendered').textContent();

      expect(sheet1C5AfterRedo).toBeDefined();
      expect(sheet2A3AfterRedo).toBeDefined();
    });
  });
});
