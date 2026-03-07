import { test, expect } from '@playwright/test';

test.describe('Async Formula', () => {
  test('should render async formula result after delay (inflight=off, inflight=on)', async ({ page }) => {
    
    await page.goto('http://localhost:5233/iframe.html?id=formula-asyncchain--async-chain&viewMode=story');

    // =================== inflight = off ===================
    {
      const sheet1 = page.locator('[data-sheet-name="AsyncChain"]');
      const a1 = sheet1.locator("[data-address='A1']");
      const a2 = sheet1.locator("[data-address='A2']");
      const a3 = sheet1.locator("[data-address='A3']");
      const a4 = sheet1.locator("[data-address='A4']");
      const a5 = sheet1.locator("[data-address='A5']");
      const a6 = sheet1.locator("[data-address='A6']");
      const a7 = sheet1.locator("[data-address='A7']");

      // Before waiting, cells should be empty or show pending state
      expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('');

      // Wait for async results to resolve
      // Chain: A1 (750ms) → A2 (750ms) → A3 (750ms) → A4 (750ms) = ~3s
      // A5, A6, A7 use literal args so they resolve in first cycle (~750ms)
      // Adding buffer for render time
      await page.waitForTimeout(5000);

      // A1: SUM_DELAY(10, 20) = 30
      expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('30');

      // A2: SUM_DELAY(30, 100) = 130
      expect(await a2.locator('.gs-cell-rendered').textContent()).toBe('130');

      // A3: SUM_DELAY(130, 200) = 330
      expect(await a3.locator('.gs-cell-rendered').textContent()).toBe('330');

      // A4: SUM_DELAY(330, 30) = 360
      expect(await a4.locator('.gs-cell-rendered').textContent()).toBe('360');

      // A5: SUM_DELAY(10,20) + SUM_DELAY(10,20) = 30 + 30 = 60 (same args ×2 in one cell)
      expect(await a5.locator('.gs-cell-rendered').textContent()).toBe('60');

      // A6: SUM_DELAY(10,20) + SUM_DELAY(30,40) = 30 + 70 = 100 (diff args ×2 in one cell)
      expect(await a6.locator('.gs-cell-rendered').textContent()).toBe('100');

      // A7: SUM(SUM_DELAY(10,20), SUM_DELAY(30,40)) = SUM(30, 70) = 100 (sync wrapping async)
      expect(await a7.locator('.gs-cell-rendered').textContent()).toBe('100');
    }

    // =================== inflight = on ===================
    const sheet2 = page.locator('[data-sheet-name="AsyncChainInflight"]');
    {
      const a1 = sheet2.locator("[data-address='A1']");
      const a4 = sheet2.locator("[data-address='A4']");
      const a5 = sheet2.locator("[data-address='A5']");
      const a6 = sheet2.locator("[data-address='A6']");
      const a7 = sheet2.locator("[data-address='A7']");

      expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('30');
      expect(await a4.locator('.gs-cell-rendered').textContent()).toBe('360');

      // Same patterns as inflight=off — results should be identical
      expect(await a5.locator('.gs-cell-rendered').textContent()).toBe('60');
      expect(await a6.locator('.gs-cell-rendered').textContent()).toBe('100');
      expect(await a7.locator('.gs-cell-rendered').textContent()).toBe('100');
    }
  });

  test('should cache async formula result within TTL', async ({ page }) => {
    
    await page.goto('http://localhost:5233/iframe.html?id=formula-asyncchain--async-chain&viewMode=story');

    const sheet = page.locator('[data-sheet-name="AsyncChain"]');
    const a1 = sheet.locator("[data-address='A1']");
    const b1 = sheet.locator("[data-address='B1']");

    // Initially, A1 should be empty
    expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('');

    // Wait for first async computation (A1 takes 1 second + render time)
    await page.waitForTimeout(1500);

    // A1 should have computed result
    expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('30');

    // Click on another cell to trigger re-render without changing A1
    await b1.click();

    // A1 should still show the cached result (no additional wait needed)
    expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('30');
  });

  test('should invalidate async cache when inputs change', async ({ page }) => {
    
    await page.goto('http://localhost:5233/iframe.html?id=formula-asyncchain--async-chain&viewMode=story');

    const sheet = page.locator('[data-sheet-name="AsyncChain"]');
    const a1 = sheet.locator("[data-address='A1']");
    const a2 = sheet.locator("[data-address='A2']");

    // Wait for first async computation
    // A1 takes 1s, then A2 depends on A1 (another 1s) = 2s + buffer
    await page.waitForTimeout(3000);

    // A2 should depend on A1, initial value: SUM_DELAY(30, 100) = 130
    let a2Content = await a2.locator('.gs-cell-rendered').textContent();
    expect(a2Content).toBe('130');

    // Change A1 value by double-clicking to enter edit mode
    // Change A1 value by clicking and typing into the formula bar to ensure replacement
    await a1.click();
    const formulaBar = sheet.locator('.gs-formula-bar textarea');
    await formulaBar.fill('=SUM_DELAY(40, 50)');
    await formulaBar.press('Enter');

    // Wait for re-computation: A1 takes 1s, then A2 depends on new A1 (another 1s) = 2s + buffer
    await page.waitForTimeout(3000);

    // A1 should now be 90 (40 + 50)
    const a1NewContent = await a1.locator('.gs-cell-rendered').textContent();
    expect(a1NewContent).toBe('90');

    // A2 should be updated to SUM_DELAY(90, 100) = 190
    const a2NewContent = await a2.locator('.gs-cell-rendered').textContent();
    expect(a2NewContent).toBe('190');
  });

  test('should propagate pending through async dependency chain', async ({ page }) => {
    
    await page.goto('http://localhost:5233/iframe.html?id=formula-asyncchain--async-chain&viewMode=story');

    const sheet = page.locator('[data-sheet-name="AsyncChain"]');
    const a1 = sheet.locator("[data-address='A1']");
    const a4 = sheet.locator("[data-address='A4']");

    // Before waiting, cells should be empty
    const a1InitialContent = await a1.locator('.gs-cell-rendered').textContent();
    expect(a1InitialContent).toBe('');

    const a4InitialContent = await a4.locator('.gs-cell-rendered').textContent();
    expect(a4InitialContent).toBe('');

    // Wait for async dependency chain to resolve
    // A1 (1s) → A2 (1s) → A3 (1s) → A4 (1s) = 4s + buffer
    await page.waitForTimeout(5000);

    const a1Content = await a1.locator('.gs-cell-rendered').textContent();
    expect(a1Content).toBe('30');

    const a4Content = await a4.locator('.gs-cell-rendered').textContent();
    expect(a4Content).toBe('360');
  });

  test('should display async error code #ASYNC! when async function throws', async ({ page }) => {
    
    await page.goto('http://localhost:5233/iframe.html?id=formula-asyncchain--async-chain&viewMode=story');

    const sheet = page.locator('[data-sheet-name="AsyncChain"]');
    const a8 = sheet.locator("[data-address='A8']");

    // A8 contains =SUM_DELAY() with no arguments, which should throw an error
    const a8Rendered = a8.locator('.gs-cell-rendered');
    // Verify that the error code is displayed after a short wait for React render
    await page.waitForTimeout(500);
    const a8Content = await a8Rendered.textContent();
    expect(a8Content?.trim()).toBe('#ASYNC!');
  });
});
