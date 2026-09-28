import { test, expect } from '@playwright/test';
import { go } from './utils';

test('imports a complex styled xlsx and re-evaluates formulas', async ({ page }) => {
  await go(page, 'io-xlsx--converter');
  await page.getByTestId('load-sample').click();

  const a1 = page.locator("[data-address='A1']");
  const d3 = page.locator("[data-address='D3']");
  const d6 = page.locator("[data-address='D6']");

  // The sample is a styled, merged, multi-sheet workbook. Styling/merges are dropped,
  // but the merged title's value (top-left) and the data survive.
  expect(await a1.locator('.gs-cell-rendered').textContent()).toContain('Q3 Sales Report');
  // Formulas imported as text and re-evaluate in GridSheet: =B3*C3 → 4.5, =SUM(D3:D5) → 17.
  expect(await d3.locator('.gs-cell-rendered').textContent()).toContain('4.5');
  expect(await d6.locator('.gs-cell-rendered').textContent()).toContain('17');
});
