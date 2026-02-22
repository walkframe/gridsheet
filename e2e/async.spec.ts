import { test, expect } from '@playwright/test';

test.describe('Async Formula', () => {
  test('should render async formula result after delay', async ({ page }) => {
    await page.goto('http://localhost:5233/iframe.html?id=formula-asyncchain--async-chain&viewMode=story');

    const sheet = page.locator('[data-sheet-name="AsyncChain"]');
    const a1 = sheet.locator("[data-address='A1']");
    const a2 = sheet.locator("[data-address='A2']");
    const a3 = sheet.locator("[data-address='A3']");
    const a4 = sheet.locator("[data-address='A4']");
    const a5 = sheet.locator("[data-address='A5']");

    // Before waiting, cells should be empty or show pending state
    const a1InitialContent = await a1.locator('.gs-cell-rendered').textContent();
    expect(a1InitialContent).toBe('');
    
    const a4InitialContent = await a4.locator('.gs-cell-rendered').textContent();
    expect(a4InitialContent).toBe('');

    // Wait for async results to resolve
    // A1 takes 1s, A2 depends on A1 (1s), A3 on A2 (1s), A4 on A3 (1s) = up to 4s
    // Adding buffer for render time
    await page.waitForTimeout(5000);

    // A1: SUM_DELAY(10, 20) = 30
    const a1Content = await a1.locator('.gs-cell-rendered').textContent();
    expect(a1Content).toBe('30');

    // A2: SUM_DELAY(A1, 100) = SUM_DELAY(30, 100) = 130
    const a2Content = await a2.locator('.gs-cell-rendered').textContent();
    expect(a2Content).toBe('130');

    // A3: SUM_DELAY(A2, 200) = SUM_DELAY(130, 200) = 330
    const a3Content = await a3.locator('.gs-cell-rendered').textContent();
    expect(a3Content).toBe('330');

    // A4: SUM_DELAY(A3, A1) = SUM_DELAY(330, 30) = 360
    const a4Content = await a4.locator('.gs-cell-rendered').textContent();
    expect(a4Content).toBe('360');

    // A5: SUM(A1:A4) = 30 + 130 + 330 + 360 = 850
    const a5Content = await a5.locator('.gs-cell-rendered').textContent();
    expect(a5Content).toBe('850');
  });

  test('should cache async formula result within TTL', async ({ page }) => {
    await page.goto('http://localhost:5233/iframe.html?id=formula-asyncchain--async-chain&viewMode=story');

    const sheet = page.locator('[data-sheet-name="AsyncChain"]');
    const a1 = sheet.locator("[data-address='A1']");
    const b1 = sheet.locator("[data-address='B1']");

    // Initially, A1 should be empty
    const a1InitialContent = await a1.locator('.gs-cell-rendered').textContent();
    expect(a1InitialContent).toBe('');

    // Wait for first async computation (A1 takes 1 second + render time)
    await page.waitForTimeout(1500);

    // A1 should have computed result
    let a1Content = await a1.locator('.gs-cell-rendered').textContent();
    expect(a1Content).toBe('30');

    // Click on another cell to trigger re-render without changing A1
    await b1.click();

    // A1 should still show the cached result (no additional wait needed)
    a1Content = await a1.locator('.gs-cell-rendered').textContent();
    expect(a1Content).toBe('30');
  });

  test('should invalidate async cache when inputs change', async ({ page }) => {
    await page.goto('http://localhost:5233/iframe.html?id=formula-asyncchain--async-chain&viewMode=story');

    const sheet = page.locator('[data-sheet-name="AsyncChain"]');
    const a1 = sheet.locator("[data-address='A1']");
    const a2 = sheet.locator("[data-address='A2']");

    // Wait for first async computation
    // A1 takes 1s, then A2 depends on A1 (another 1s) = 2s + buffer
    await page.waitForTimeout(2500);

    // A2 should depend on A1, initial value: SUM_DELAY(30, 100) = 130
    let a2Content = await a2.locator('.gs-cell-rendered').textContent();
    expect(a2Content).toBe('130');

    // Change A1 value by double-clicking to enter edit mode
    await a1.click();
    await page.keyboard.type('=SUM_DELAY(40, 50)');
    await page.keyboard.press('Enter');

    // Wait for re-computation: A1 takes 1s, then A2 depends on new A1 (another 1s) = 2s + buffer
    await page.waitForTimeout(2500);

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
    const a6 = sheet.locator("[data-address='A6']");

    // A6 contains =SUM_DELAY() with no arguments, which should throw an error
    const a6Rendered = a6.locator('.gs-cell-rendered');
    const a6Content = await a6Rendered.textContent();
    
    // Verify that the error code is displayed
    expect(a6Content?.trim()).toBe('#ASYNC!');
  });
});
