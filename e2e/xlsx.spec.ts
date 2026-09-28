import { test, expect } from '@playwright/test';
import { go } from './utils';

test('imports a complex styled xlsx and re-evaluates cross-sheet formulas', async ({ page }) => {
  await go(page, 'io-xlsx--converter');
  await page.getByTestId('load-sample').click();

  const sales = page.getByTestId('sheet-Sales');
  const summary = page.getByTestId('sheet-Summary');

  // Styled + merged Sales sheet: merged title's value survives (top-left), own formula re-evaluates.
  expect(await sales.locator("[data-address='A1'] .gs-cell-rendered").textContent()).toContain('Q3 Sales Report');
  expect(await sales.locator("[data-address='D3'] .gs-cell-rendered").textContent()).toContain('4.5');

  // Summary sheet references other sheets; sharing a book, they resolve live:
  // B2 = SUM(Sales!D3:D5) → 17.
  expect(await summary.locator("[data-address='B2'] .gs-cell-rendered").textContent()).toContain('17');
});
