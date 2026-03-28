import { test, expect } from '@playwright/test';
import { go } from './utils';

test.describe('Header Customization', () => {
  test.beforeEach(async ({ page }) => {
    await go(page, 'basic-header--header');
    await page.waitForSelector('.gs-root1');
  });

  test('should change header height when input value changes', async ({ page }) => {
    // Get initial header height
    const initialHeaderHeight = await page.locator('.gs-root1 .gs-th').first().boundingBox();
    const initialHeight = initialHeaderHeight?.height || 0;

    // Change header height input
    const heightInput = page.locator('input[name="header-height"]');
    await heightInput.clear();
    await heightInput.fill('80');

    // Wait for the change to take effect
    await page.waitForTimeout(100);

    // Check if header height changed
    const newHeaderHeight = await page.locator('.gs-root1 .gs-th').first().boundingBox();
    const newHeight = newHeaderHeight?.height || 0;

    expect(newHeight).toBeGreaterThan(initialHeight);
  });

  test('should change header width when input value changes', async ({ page }) => {
    // Get initial header width
    const initialHeaderWidth = await page.locator('.gs-root1 .gs-th').first().boundingBox();
    const initialWidth = initialHeaderWidth?.width || 0;

    // Change header width input
    const widthInput = page.locator('input[name="header-width"]');
    await widthInput.clear();
    await widthInput.fill('100');

    // Wait for the change to take effect
    await page.waitForTimeout(100);

    // Check if header width changed
    const newHeaderWidth = await page.locator('.gs-root1 .gs-th').first().boundingBox();
    const newWidth = newHeaderWidth?.width || 0;

    expect(newWidth).toBeGreaterThan(initialWidth);
  });
});

const getBg = (el: Element) => getComputedStyle(el).backgroundColor;

test.describe('Col/Row style address syntax', () => {
  test.beforeEach(async ({ page }) => {
    await go(page, 'basic-header--header');
  });

  test('A applies to column A data cells, not to the column header', async ({ page }) => {
    for (const addr of ['A2', 'A3', 'A4']) {
      const bg = await page.locator(`[data-address='${addr}']`).evaluate(getBg);
      expect(bg, `${addr} should have A: style`).toBe('rgb(200, 200, 255)');
    }
    const colHeaderBg = await page.locator(".gs-th-top[data-x='1']").evaluate(getBg);
    expect(colHeaderBg, 'A column header should not have A: style').not.toBe('rgb(200, 200, 255)');
  });

  test('A0 applies to column A header cell only', async ({ page }) => {
    const colHeaderBg = await page.locator(".gs-th-top[data-x='1']").evaluate(getBg);
    expect(colHeaderBg, 'A column header should have A0 style').toBe('rgb(255, 200, 200)');

    const a2Bg = await page.locator("[data-address='A2']").evaluate(getBg);
    expect(a2Bg, 'A2 data cell should not have A0 style').not.toBe('rgb(255, 200, 200)');
  });

  test('1 applies to row 1 data cells, not to the row header', async ({ page }) => {
    // B1 has only row-1 style (no column override). C1-E1 are overridden by C:E column range.
    const bg = await page.locator("[data-address='B1']").evaluate(getBg);
    expect(bg, 'B1 should have 1: style').toBe('rgb(255, 255, 180)');
    const rowHeaderBg = await page.locator(".gs-th-left[data-y='1']").evaluate(getBg);
    expect(rowHeaderBg, 'Row 1 header should not have 1: style').not.toBe('rgb(255, 255, 180)');
  });

  test('01 applies to row 1 header cell only', async ({ page }) => {
    const rowHeaderBg = await page.locator(".gs-th-left[data-y='1']").evaluate(getBg);
    expect(rowHeaderBg, 'Row 1 header should have 01 style').toBe('rgb(200, 255, 200)');

    const b1Bg = await page.locator("[data-address='B1']").evaluate(getBg);
    expect(b1Bg, 'B1 data cell should not have 01 style').not.toBe('rgb(200, 255, 200)');
  });

  test('C:E range applies to columns C-E data cells only', async ({ page }) => {
    for (const addr of ['C2', 'D2', 'E2']) {
      const bg = await page.locator(`[data-address='${addr}']`).evaluate(getBg);
      expect(bg, `${addr} should have C:E style`).toBe('rgb(220, 200, 255)');
    }
    const b2Bg = await page.locator("[data-address='B2']").evaluate(getBg);
    expect(b2Bg, 'B2 should not have C:E style').not.toBe('rgb(220, 200, 255)');
  });

  test('A1 gets A: style (col default overrides row default)', async ({ page }) => {
    // Stacking order: common < rowDefault(1:) < colDefault(A:) < cell
    const bg = await page.locator("[data-address='A1']").evaluate(getBg);
    expect(bg, 'A1 should have A: style (col wins over row)').toBe('rgb(200, 200, 255)');
  });

  test('F0:G0 range applies blue text color to F and G column headers only', async ({ page }) => {
    for (const x of [6, 7]) {
      const color = await page.locator(`.gs-th-top[data-x='${x}']`).evaluate((el) => getComputedStyle(el).color);
      expect(color, `column header x=${x} should be blue`).toBe('rgb(0, 0, 255)');
    }
    const eColor = await page.locator(".gs-th-top[data-x='5']").evaluate((el) => getComputedStyle(el).color);
    expect(eColor, 'E column header should not be blue').not.toBe('rgb(0, 0, 255)');
  });
});
