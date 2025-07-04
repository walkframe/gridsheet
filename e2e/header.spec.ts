import { test, expect } from '@playwright/test';

test.describe('Header Customization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5233/iframe.html?id=basic-header--header');
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
