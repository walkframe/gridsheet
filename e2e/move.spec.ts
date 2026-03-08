import { test, expect } from '@playwright/test';
import { ctrl, drag, cut, go, paste } from './utils';

const STORY_ID = 'control-onedit--on-edit';

const getSheet1HistoryData = async (page: any, index: number) => {
  const panel = page.locator('[data-testid="edit-history-sheet1"]');
  const text = await panel.locator('[data-testid="history-data"]').nth(index).inputValue();
  return JSON.parse(text);
};

const getSheet2HistoryData = async (page: any, index: number) => {
  const panel = page.locator('[data-testid="edit-history-sheet2"]');
  const text = await panel.locator('[data-testid="history-data"]').nth(index).inputValue();
  return JSON.parse(text);
};

const getSheet1Addresses = async (page: any, index: number) => {
  const data = await getSheet1HistoryData(page, index);
  return Object.keys(data).sort();
};

const getSheet2Addresses = async (page: any, index: number) => {
  const data = await getSheet2HistoryData(page, index);
  return Object.keys(data).sort();
};

test.describe('Move (cut & paste) with lastChangedAddresses', () => {
  test('same sheet move records both src and dst in edit history', async ({ page }) => {
    await go(page, STORY_ID);
    await page.waitForSelector("[data-address='A1']", { timeout: 5000 });

    // Cut A2 in Sheet1
    const sheet1 = page.locator('.gs-table').first();
    const a2 = sheet1.locator("[data-address='A2']");
    await a2.click();
    await cut(page);

    // Paste to B2 in Sheet1
    const b2 = sheet1.locator("[data-address='B2']");
    await b2.click();
    await paste(page);
    await page.waitForTimeout(300);

    // Verify the latest entry in Sheet1 history (same-sheet move → only Sheet1 onChange fired)
    const data = await getSheet1HistoryData(page, 0);
    // Both src (A2) and dst (B2) are included in lastChangedAddresses
    expect(data).toHaveProperty('A2');
    expect(data).toHaveProperty('B2');
    // A2 should be cleared
    expect(data['A2'].value).toBeNull();
    // B2 should have the original value of A2 (Apple)
    expect(data['B2'].value).toBe('Apple');
  });

  test('cross sheet move records src and dst in separate edit histories', async ({ page }) => {
    await go(page, STORY_ID);
    await page.waitForSelector("[data-address='A1']", { timeout: 5000 });

    // Cut A2 in Sheet1
    const sheet1 = page.locator('.gs-table').first();
    const a2sheet1 = sheet1.locator("[data-address='A2']");
    await a2sheet1.click();
    await cut(page);

    // Paste to B2 in Sheet2
    const sheet2 = page.locator('.gs-table').nth(1);
    const b2sheet2 = sheet2.locator("[data-address='B2']");
    await b2sheet2.click();
    await paste(page);
    await page.waitForTimeout(300);

    // Sheet1 panel: A2 should be cleared
    const sheet1Data = await getSheet1HistoryData(page, 0);
    expect(sheet1Data).toHaveProperty('A2');
    expect(sheet1Data['A2'].value).toBeNull();

    // Sheet2 panel: B2 should have Apple
    const sheet2Data = await getSheet2HistoryData(page, 0);
    expect(sheet2Data).toHaveProperty('B2');
    expect(sheet2Data['B2'].value).toBe('Apple');
  });
});

test.describe('lastChangedAddresses accuracy across write, range-delete, and cross-sheet move with undo/redo', () => {
  test('only actually changed addresses appear in each onChange', async ({ page }) => {
    await go(page, STORY_ID);
    await page.waitForSelector("[data-address='A1']", { timeout: 5000 });

    const sheet1 = page.locator('.gs-table').first();
    const sheet2 = page.locator('.gs-table').nth(1);

    // =====================================================
    // 1. Write → undo → redo
    // =====================================================
    // Write "Hello" into B3 (Sheet1, originally 80)
    const b3 = sheet1.locator("[data-address='B3']");
    await b3.click();
    await page.keyboard.type('Hello');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // onChange: only B3 should appear in Sheet1 panel
    expect(await getSheet1Addresses(page, 0)).toEqual(['B3']);

    // Undo the write
    await ctrl(page, 'z');
    await page.waitForTimeout(300);
    expect(await getSheet1Addresses(page, 0)).toEqual(['B3']);

    // Redo the write
    await ctrl(page, 'z', true);
    await page.waitForTimeout(300);
    expect(await getSheet1Addresses(page, 0)).toEqual(['B3']);

    // =====================================================
    // 2. Range delete → undo → redo
    // =====================================================
    // Select B2:C3 on Sheet1 and delete
    await sheet1.locator("[data-address='B2']").click();
    await page.keyboard.down('Shift');
    await sheet1.locator("[data-address='C3']").click();
    await page.keyboard.up('Shift');
    await page.keyboard.press('Delete');
    await page.waitForTimeout(300);

    // onChange: B2, B3, C2, C3 (2×2 range) in Sheet1 panel
    expect(await getSheet1Addresses(page, 0)).toEqual(['B2', 'B3', 'C2', 'C3']);

    // Undo the delete
    await ctrl(page, 'z');
    await page.waitForTimeout(300);
    expect(await getSheet1Addresses(page, 0)).toEqual(['B2', 'B3', 'C2', 'C3']);

    // Redo the delete
    await ctrl(page, 'z', true);
    await page.waitForTimeout(300);
    expect(await getSheet1Addresses(page, 0)).toEqual(['B2', 'B3', 'C2', 'C3']);

    // =====================================================
    // 3. Cross-sheet move → undo → redo
    // =====================================================
    // Cut A2 from Sheet1 (Apple), paste into B2 of Sheet2
    const a2sheet1 = sheet1.locator("[data-address='A2']");
    await a2sheet1.click();
    await cut(page);

    const b2sheet2 = sheet2.locator("[data-address='B2']");
    await b2sheet2.click();
    await paste(page);
    await page.waitForTimeout(300);

    // Sheet1 src: only A2 cleared; Sheet2 dst: only B2 written
    expect(await getSheet1Addresses(page, 0)).toEqual(['A2']);
    expect(await getSheet2Addresses(page, 0)).toEqual(['B2']);

    // Undo the move
    await ctrl(page, 'z');
    await page.waitForTimeout(300);

    expect(await getSheet1Addresses(page, 0)).toEqual(['A2']);
    expect(await getSheet2Addresses(page, 0)).toEqual(['B2']);

    // Verify JSON values: src (Sheet1) A2 restored to 'Apple', dst (Sheet2) B2 restored to original value (25)
    expect((await getSheet1HistoryData(page, 0))['A2'].value).toBe('Apple');
    expect((await getSheet2HistoryData(page, 0))['B2'].value).toBe(25);

    // Redo the move
    await ctrl(page, 'z', true);
    await page.waitForTimeout(300);

    expect(await getSheet1Addresses(page, 0)).toEqual(['A2']);
    expect(await getSheet2Addresses(page, 0)).toEqual(['B2']);
  });
});
