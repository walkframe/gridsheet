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
  test('insert row in Sheet2, undo from Sheet1 restores references correctly', async ({ page }) => {
    await page.goto(STORY_URL);
    await page.waitForTimeout(500);

    const s1 = sheet(page, 'Sheet1');
    const s2 = sheet(page, 'Sheet2');

    // ---- Check initial state of Sheet1 ----
    // A1 = =Sheet2!A1+100 = 50+100 = 150
    await expect(s1.locator("[data-address='A1']").locator('.gs-cell-rendered')).toHaveText('150');
    // A2 = =SUM(Sheet2!B2:B4) = 1200+30+0 = 1230
    await expect(s1.locator("[data-address='A2']").locator('.gs-cell-rendered')).toHaveText('1230');
    // C1 = 333
    await expect(s1.locator("[data-address='C1']").locator('.gs-cell-rendered')).toHaveText('333');
    // C2 = $C$1+100 = 433
    await expect(s1.locator("[data-address='C2']").locator('.gs-cell-rendered')).toHaveText('433');
    // C3 = C2+200 = 633
    await expect(s1.locator("[data-address='C3']").locator('.gs-cell-rendered')).toHaveText('633');

    // ---- Check initial state of Sheet2 ----
    // A1 = 50
    await expect(s2.locator("[data-address='A1']").locator('.gs-cell-rendered')).toHaveText('50');
    // A2 = =Sheet1!C3 = 633
    await expect(s2.locator("[data-address='A2']").locator('.gs-cell-rendered')).toHaveText('633');
    // B1 = 999
    await expect(s2.locator("[data-address='B1']").locator('.gs-cell-rendered')).toHaveText('999');
    // B2 = 1200
    await expect(s2.locator("[data-address='B2']").locator('.gs-cell-rendered')).toHaveText('1200');
    // B3 = 30
    await expect(s2.locator("[data-address='B3']").locator('.gs-cell-rendered')).toHaveText('30');

    // ---- Insert a row above row 2 in Sheet2 ----
    await clickRowMenuItem(page, 'Sheet2', 2, 'Insert 1 row above');

    // After inserting a row above row 2 in Sheet2:
    // Sheet2 row 2 is now empty, original row 2 shifted to row 3
    await expect(s2.locator("[data-address='A1']").locator('.gs-cell-rendered')).toHaveText('50');
    await expect(s2.locator("[data-address='A2']").locator('.gs-cell-rendered')).toHaveText('');
    // A3 should now be the old A2 (=Sheet1!C3 = 633)
    await expect(s2.locator("[data-address='A3']").locator('.gs-cell-rendered')).toHaveText('633');
    // B2 should be empty (new row)
    await expect(s2.locator("[data-address='B2']").locator('.gs-cell-rendered')).toHaveText('');
    // B3 should be the old B2 = 1200
    await expect(s2.locator("[data-address='B3']").locator('.gs-cell-rendered')).toHaveText('1200');
    // B4 should be the old B3 = 30
    await expect(s2.locator("[data-address='B4']").locator('.gs-cell-rendered')).toHaveText('30');

    // Sheet1 references should still be correct after insert (SUM range shifted)
    // A1 = =Sheet2!A1+100 = 150 (unchanged, row 1 not affected)
    await expect(s1.locator("[data-address='A1']").locator('.gs-cell-rendered')).toHaveText('150');

    // ---- Now undo from Sheet1 ----
    await s1.locator("[data-address='A1']").click();
    await ctrl(page, 'z');
    await page.waitForTimeout(300);

    // ---- Verify Sheet2 is restored (row removed, back to original) ----
    await expect(s2.locator("[data-address='A1']").locator('.gs-cell-rendered')).toHaveText('50');
    await expect(s2.locator("[data-address='A2']").locator('.gs-cell-rendered')).toHaveText('633');
    await expect(s2.locator("[data-address='B1']").locator('.gs-cell-rendered')).toHaveText('999');
    await expect(s2.locator("[data-address='B2']").locator('.gs-cell-rendered')).toHaveText('1200');
    await expect(s2.locator("[data-address='B3']").locator('.gs-cell-rendered')).toHaveText('30');

    // ---- Verify Sheet1 references are restored ----
    await expect(s1.locator("[data-address='A1']").locator('.gs-cell-rendered')).toHaveText('150');
    await expect(s1.locator("[data-address='A2']").locator('.gs-cell-rendered')).toHaveText('1230');
    await expect(s1.locator("[data-address='C3']").locator('.gs-cell-rendered')).toHaveText('633');
  });

  test('insert row in Sheet2, undo from Sheet1 removes inserted row visually', async ({ page }) => {
    await page.goto(STORY_URL);
    await page.waitForTimeout(500);

    const s2 = sheet(page, 'Sheet2');
    const s1 = sheet(page, 'Sheet1');

    // Sheet2 initially has 5 rows
    const initialRowCount = await s2.locator('.gs-th-left[data-y]').count();

    // ---- Insert a row above row 2 in Sheet2 ----
    await clickRowMenuItem(page, 'Sheet2', 2, 'Insert 1 row above');

    // Sheet2 should now have one more row
    const afterInsertRowCount = await s2.locator('.gs-th-left[data-y]').count();
    expect(afterInsertRowCount).toBe(initialRowCount + 1);

    // ---- Undo from Sheet1 ----
    await s1.locator("[data-address='A1']").click();
    await ctrl(page, 'z');
    await page.waitForTimeout(300);

    // Sheet2 should be back to original row count (without needing to scroll)
    const afterUndoRowCount = await s2.locator('.gs-th-left[data-y]').count();
    expect(afterUndoRowCount).toBe(initialRowCount);
  });

  test('redo from Sheet1 re-applies insert row in Sheet2', async ({ page }) => {
    await page.goto(STORY_URL);
    await page.waitForTimeout(500);

    const s1 = sheet(page, 'Sheet1');
    const s2 = sheet(page, 'Sheet2');

    const initialRowCount = await s2.locator('.gs-th-left[data-y]').count();

    // ---- Insert a row above row 2 in Sheet2 ----
    await clickRowMenuItem(page, 'Sheet2', 2, 'Insert 1 row above');
    await page.waitForTimeout(100);

    // ---- Undo from Sheet1 ----
    await s1.locator("[data-address='A1']").click();
    await ctrl(page, 'z');
    await page.waitForTimeout(300);

    // Verify undo worked
    await expect(s2.locator("[data-address='A2']").locator('.gs-cell-rendered')).toHaveText('633');
    const afterUndoRowCount = await s2.locator('.gs-th-left[data-y]').count();
    expect(afterUndoRowCount).toBe(initialRowCount);

    // ---- Redo from Sheet1 ----
    await ctrl(page, 'z', true);
    await page.waitForTimeout(300);

    // Sheet2 should have the row re-inserted
    const afterRedoRowCount = await s2.locator('.gs-th-left[data-y]').count();
    expect(afterRedoRowCount).toBe(initialRowCount + 1);

    // Verify row 2 is empty again (inserted row)
    await expect(s2.locator("[data-address='A2']").locator('.gs-cell-rendered')).toHaveText('');
    // Original A2 shifted back to A3
    await expect(s2.locator("[data-address='A3']").locator('.gs-cell-rendered')).toHaveText('633');
  });
});
