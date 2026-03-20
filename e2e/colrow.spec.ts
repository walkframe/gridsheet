import { test, expect } from '@playwright/test';
import { go } from './utils';

test('ROW() and COLUMN() return correct values', async ({ page }) => {
  await go(page, 'formula-colrow--col-row');

  // ROW() examples (columns A-C)
  // A1: =ROW() → 1
  expect(await page.locator('[data-address="A1"] .gs-cell-rendered').textContent()).toBe('1');
  // A2: =ROW() → 2
  expect(await page.locator('[data-address="A2"] .gs-cell-rendered').textContent()).toBe('2');
  // B1: =ROW() → 1
  expect(await page.locator('[data-address="B1"] .gs-cell-rendered').textContent()).toBe('1');
  // C5: =ROW() → 5
  expect(await page.locator('[data-address="C5"] .gs-cell-rendered').textContent()).toBe('5');
  // C6: =ROW(A3) → 3
  expect(await page.locator('[data-address="C6"] .gs-cell-rendered').textContent()).toBe('3');

  // COLUMN() examples (columns E-H)
  // E1: =COLUMN() → 5 (column E = 5)
  expect(await page.locator('[data-address="E1"] .gs-cell-rendered').textContent()).toBe('5');
  // E2: =COLUMN() → 5
  expect(await page.locator('[data-address="E2"] .gs-cell-rendered').textContent()).toBe('5');
  // F1: =COLUMN() → 6 (column F = 6)
  expect(await page.locator('[data-address="F1"] .gs-cell-rendered').textContent()).toBe('6');
  // G5: =COLUMN() → 7 (column G = 7)
  expect(await page.locator('[data-address="G5"] .gs-cell-rendered').textContent()).toBe('7');
  // G6: =COLUMN(A3) → 1 (column A = 1)
  expect(await page.locator('[data-address="G6"] .gs-cell-rendered').textContent()).toBe('1');
  // H2: =ARRAYFORMULA(ROW(B1:D3)) → spills 1, 2, 3 down H2, H3, H4
  expect(await page.locator('[data-address="H2"] .gs-cell-rendered').textContent()).toBe('1');
  expect(await page.locator('[data-address="H3"] .gs-cell-rendered').textContent()).toBe('2');
  expect(await page.locator('[data-address="H4"] .gs-cell-rendered').textContent()).toBe('3');
  // H6: =ARRAYFORMULA(COLUMN(B1:D3)) → spills 2, 3, 4 across H6, I6, J6
  expect(await page.locator('[data-address="H6"] .gs-cell-rendered').textContent()).toBe('2');
  expect(await page.locator('[data-address="I6"] .gs-cell-rendered').textContent()).toBe('3');
  expect(await page.locator('[data-address="J6"] .gs-cell-rendered').textContent()).toBe('4');
});
