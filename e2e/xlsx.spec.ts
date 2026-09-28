import { test, expect } from '@playwright/test';
import { go } from './utils';

test('imports a sample xlsx and re-evaluates formulas', async ({ page }) => {
  await go(page, 'io-xlsx--converter');
  await page.getByTestId('load-sample').click();

  const a1 = page.locator("[data-address='A1']");
  const d2 = page.locator("[data-address='D2']");
  const d5 = page.locator("[data-address='D5']");

  // Header string survived the toXlsx → fromXlsx round trip.
  expect(await a1.locator('.gs-cell-rendered').textContent()).toContain('Product');
  // Formulas round-tripped as text and re-evaluate in GridSheet: =B2*C2 → 4.5, =SUM(D2:D4) → 17.
  expect(await d2.locator('.gs-cell-rendered').textContent()).toContain('4.5');
  expect(await d5.locator('.gs-cell-rendered').textContent()).toContain('17');
});
