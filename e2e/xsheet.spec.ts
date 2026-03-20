import { test, expect } from '@playwright/test';
import { ctrl } from './utils';

const STORY_URL = 'http://localhost:5233/iframe.html?id=multiple-sheets--sheets&viewMode=story';

/**
 * Helper to scope locators to a specific sheet by data-sheet-name.
 */
const sheet = (page: any, name: string) => {
  return page.locator(`[data-sheet-name='${name}']`);
};

/**
 * Open the row menu on a given sheet and row, then click an item.
 * The ⋮ button has class gs-row-menu-btn inside the header cell th[data-y].
 */
const clickRowMenuItem = async (page: any, sheetName: string, y: number, menuText: string) => {
  const s = sheet(page, sheetName);
  const rowHeader = s.locator(`th[data-y='${y}']`);
  // Click on the row header first to select the row
  await rowHeader.click();
  // Then click the ⋮ button to open the menu
  const menuBtn = rowHeader.locator('.gs-row-menu-btn');
  await menuBtn.click();
  await page.waitForTimeout(100);
  // Click the menu item (menu is portaled to document.body, so use page.getByText)
  await page.getByText(menuText, { exact: true }).click();
  await page.waitForTimeout(200);
};

test.describe('Cross-sheet undo/redo', () => {
  test('insert row in Sheet2, undo/redo from Sheet1 restores references and row count', async ({ page }) => {
    await page.goto(STORY_URL);
    await page.waitForTimeout(500);

    const s1 = sheet(page, 'Sheet1');
    const s2 = sheet(page, 'Sheet2');

    // ---- Check initial state of Sheet1 ----
    await expect(s1.locator("[data-address='A1']").locator('.gs-cell-rendered')).toHaveText('150');
    await expect(s1.locator("[data-address='A2']").locator('.gs-cell-rendered')).toHaveText('1230');
    await expect(s1.locator("[data-address='C1']").locator('.gs-cell-rendered')).toHaveText('333');
    await expect(s1.locator("[data-address='C2']").locator('.gs-cell-rendered')).toHaveText('433');
    await expect(s1.locator("[data-address='C3']").locator('.gs-cell-rendered')).toHaveText('633');

    // ---- Check initial state of Sheet2 ----
    await expect(s2.locator("[data-address='A1']").locator('.gs-cell-rendered')).toHaveText('50');
    await expect(s2.locator("[data-address='A2']").locator('.gs-cell-rendered')).toHaveText('633');
    await expect(s2.locator("[data-address='B1']").locator('.gs-cell-rendered')).toHaveText('999');
    await expect(s2.locator("[data-address='B2']").locator('.gs-cell-rendered')).toHaveText('1200');
    await expect(s2.locator("[data-address='B3']").locator('.gs-cell-rendered')).toHaveText('30');

    const initialRowCount = parseInt((await s2.getAttribute('data-rows')) ?? '0');

    // ---- Insert a row above row 2 in Sheet2 ----
    await clickRowMenuItem(page, 'Sheet2', 2, 'Insert 1 row above');

    // Sheet2 row 2 is now empty, original row 2 shifted to row 3
    await expect(s2.locator("[data-address='A2']").locator('.gs-cell-rendered')).toHaveText('');
    await expect(s2.locator("[data-address='A3']").locator('.gs-cell-rendered')).toHaveText('633');
    await expect(s2.locator("[data-address='B2']").locator('.gs-cell-rendered')).toHaveText('');
    await expect(s2.locator("[data-address='B3']").locator('.gs-cell-rendered')).toHaveText('1200');
    await expect(s2.locator("[data-address='B4']").locator('.gs-cell-rendered')).toHaveText('30');
    await expect(s1.locator("[data-address='A1']").locator('.gs-cell-rendered')).toHaveText('150');
    const afterInsertRowCount = parseInt((await s2.getAttribute('data-rows')) ?? '0');
    expect(afterInsertRowCount).toBe(initialRowCount + 1);

    // ---- Undo from Sheet1 ----
    await s1.locator("[data-address='A1']").click();
    await ctrl(page, 'z');
    await page.waitForTimeout(300);

    // Sheet2 restored (row removed, back to original)
    await expect(s2.locator("[data-address='A1']").locator('.gs-cell-rendered')).toHaveText('50');
    await expect(s2.locator("[data-address='A2']").locator('.gs-cell-rendered')).toHaveText('633');
    await expect(s2.locator("[data-address='B2']").locator('.gs-cell-rendered')).toHaveText('1200');
    await expect(s2.locator("[data-address='B3']").locator('.gs-cell-rendered')).toHaveText('30');
    // Sheet1 references restored
    await expect(s1.locator("[data-address='A1']").locator('.gs-cell-rendered')).toHaveText('150');
    await expect(s1.locator("[data-address='A2']").locator('.gs-cell-rendered')).toHaveText('1230');
    await expect(s1.locator("[data-address='C3']").locator('.gs-cell-rendered')).toHaveText('633');
    const afterUndoRowCount = parseInt((await s2.getAttribute('data-rows')) ?? '0');
    expect(afterUndoRowCount).toBe(initialRowCount);

    // ---- Redo from Sheet1 re-applies insert row ----
    await ctrl(page, 'z', true);
    await page.waitForTimeout(300);

    const afterRedoRowCount = parseInt((await s2.getAttribute('data-rows')) ?? '0');
    expect(afterRedoRowCount).toBe(initialRowCount + 1);
    await expect(s2.locator("[data-address='A2']").locator('.gs-cell-rendered')).toHaveText('');
    await expect(s2.locator("[data-address='A3']").locator('.gs-cell-rendered')).toHaveText('633');
  });
});
