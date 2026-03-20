import { test, expect } from '@playwright/test';
import { go } from './utils';

test.describe('Async Formula', () => {
  test('should render, cache, propagate pending, and show #ASYNC! for async formulas', async ({ page }) => {
    await go(page, 'formula-asyncchain--async-chain');

    // =================== inflight = off ===================
    const sheet1 = page.locator('[data-sheet-name="AsyncChain"]');
    const a1 = sheet1.locator("[data-address='A1']");
    const a2 = sheet1.locator("[data-address='A2']");
    const a3 = sheet1.locator("[data-address='A3']");
    const a4 = sheet1.locator("[data-address='A4']");
    const a5 = sheet1.locator("[data-address='A5']");
    const a6 = sheet1.locator("[data-address='A6']");
    const a7 = sheet1.locator("[data-address='A7']");
    const a8 = sheet1.locator("[data-address='A8']");
    const a9 = sheet1.locator("[data-address='A9']");
    const b1 = sheet1.locator("[data-address='B1']");

    // Before waiting: cells should be pending / empty
    expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('');
    expect(await a4.locator('.gs-cell-rendered').textContent()).toBe('');

    // Wait for the slowest cell in the chain (A4) to resolve
    await expect(a4.locator('.gs-cell-rendered')).toHaveText('360', { timeout: 8000 });

    expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('30');
    expect(await a2.locator('.gs-cell-rendered').textContent()).toBe('130');
    expect(await a3.locator('.gs-cell-rendered').textContent()).toBe('330');
    expect(await a4.locator('.gs-cell-rendered').textContent()).toBe('360');
    expect(await a5.locator('.gs-cell-rendered').textContent()).toBe('60');
    expect(await a6.locator('.gs-cell-rendered').textContent()).toBe('100');
    expect(await a7.locator('.gs-cell-rendered').textContent()).toBe('100');
    expect(await a9.locator('.gs-cell-rendered').textContent()).toBe('160');

    // A8 has no args → should produce #ASYNC! error
    await expect(a8.locator('.gs-cell-rendered')).not.toHaveText('', { timeout: 3000 });
    expect((await a8.locator('.gs-cell-rendered').textContent())?.trim()).toBe('#ASYNC!');

    // Cache hit: clicking another cell must not invalidate A1
    await b1.click();
    expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('30');

    // =================== inflight = on ===================
    const sheet2 = page.locator('[data-sheet-name="AsyncChainInflight"]');
    {
      const ia1 = sheet2.locator("[data-address='A1']");
      const ia4 = sheet2.locator("[data-address='A4']");
      const ia5 = sheet2.locator("[data-address='A5']");
      const ia6 = sheet2.locator("[data-address='A6']");
      const ia7 = sheet2.locator("[data-address='A7']");
      const ia9 = sheet2.locator("[data-address='A9']");

      expect(await ia1.locator('.gs-cell-rendered').textContent()).toBe('30');
      expect(await ia4.locator('.gs-cell-rendered').textContent()).toBe('360');
      expect(await ia5.locator('.gs-cell-rendered').textContent()).toBe('60');
      expect(await ia6.locator('.gs-cell-rendered').textContent()).toBe('100');
      expect(await ia7.locator('.gs-cell-rendered').textContent()).toBe('100');
      expect(await ia9.locator('.gs-cell-rendered').textContent()).toBe('160');
    }
  });

  test('should invalidate async cache when inputs change', async ({ page }) => {
    await go(page, 'formula-asyncchain--async-chain');

    const sheet = page.locator('[data-sheet-name="AsyncChain"]');
    const a1 = sheet.locator("[data-address='A1']");
    const a2 = sheet.locator("[data-address='A2']");

    // Wait for first async computation: A1 (1s) → A2 (1s)
    await expect(a2.locator('.gs-cell-rendered')).toHaveText('130', { timeout: 5000 });

    // Change A1 value by clicking and typing into the formula bar to ensure replacement
    await a1.click();
    const formulaBar = sheet.locator('.gs-formula-bar textarea');
    await formulaBar.fill('=SUM_DELAY(40, 50)');
    await formulaBar.press('Enter');

    // Wait for re-computation: A1 takes 1s, then A2 depends on new A1 (another 1s)
    await expect(a1.locator('.gs-cell-rendered')).toHaveText('90', { timeout: 5000 });

    // A1 should now be 90 (40 + 50)
    const a1NewContent = await a1.locator('.gs-cell-rendered').textContent();
    expect(a1NewContent).toBe('90');

    // A2 should be updated to SUM_DELAY(90, 100) = 190
    await expect(a2.locator('.gs-cell-rendered')).toHaveText('190', { timeout: 5000 });
  });

  test('IFNA with delayed #N/A should show caught value in B2', async ({ page }) => {
    await go(page, 'formula-conditional--ifna-delay-na');

    const b2 = page.locator("[data-address='B2']");
    await expect(b2.locator('.gs-cell-rendered')).toHaveText('caught #N/A (inline)', { timeout: 8000 });
  });
});
