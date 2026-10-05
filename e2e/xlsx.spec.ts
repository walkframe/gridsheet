import { test, expect } from '@playwright/test';
import { go } from './utils';

test('imports a complex styled xlsx and re-evaluates cross-sheet formulas', async ({ page }) => {
  await go(page, 'io-xlsx--converter');
  await page.getByTestId('load-sample').click();

  const sales = page.getByTestId('sheet-Sales');
  const summary = page.getByTestId('sheet-Summary');

  // Styled + merged Sales sheet: merged title's value lives in its top-left, own formula re-evaluates.
  const title = sales.locator("[data-address='A1']");
  expect(await title.locator('.gs-cell-rendered').textContent()).toContain('Q3 Sales Report');
  expect(await sales.locator("[data-address='D3'] .gs-cell-rendered").textContent()).toContain('4.5');

  // The title's A1:D1 merge is imported: A1 hosts a merged range.
  await expect(title).toHaveClass(/gs-merged-host/);

  // Imported cell styles render: dark fill (a merged host paints it on the stretched
  // .gs-cell-inner, not the td), white bold text inside.
  expect(
    await title.locator('.gs-cell-inner').evaluate((el) => getComputedStyle(el as HTMLElement).backgroundColor),
  ).toBe('rgb(32, 56, 100)');
  const titleText = title.locator('.gs-cell-rendered');
  expect(await titleText.evaluate((el) => getComputedStyle(el as HTMLElement).color)).toBe('rgb(255, 255, 255)');
  expect(await titleText.evaluate((el) => getComputedStyle(el as HTMLElement).fontWeight)).toBe('700');

  // Imported column widths render: the wide Product column (A) is clearly wider than
  // the narrow Qty column (B).
  const colA = await sales.locator("[data-address='A3']").boundingBox();
  const colB = await sales.locator("[data-address='B3']").boundingBox();
  expect(colA!.width).toBeGreaterThan(colB!.width + 40);

  // Summary sheet references other sheets; sharing a book, they resolve live:
  // B2 = SUM(Sales!D3:D5) → 17.
  expect(await summary.locator("[data-address='B2'] .gs-cell-rendered").textContent()).toContain('17');
});
