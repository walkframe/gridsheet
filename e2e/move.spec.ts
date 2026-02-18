import { test, expect } from '@playwright/test';
import { ctrl, drag, cut, paste } from './utils';

const URL = 'http://localhost:5233/iframe.html?id=control-onedit--on-edit&viewMode=story';

const getHistoryData = async (page: any, index: number) => {
  const items = page.locator('[data-testid="history-data"]');
  const text = await items.nth(index).inputValue();
  return JSON.parse(text);
};

const getHistorySheet = async (page: any, index: number) => {
  const items = page.locator('[data-testid="history-item"]');
  const item = items.nth(index);
  const cells = item.locator('td');
  // Sheet name is in the 4th td
  return (await cells.nth(3).textContent())?.trim();
};

test.describe('Move (cut & paste) with lastChangedAddresses', () => {
  test('same sheet move records both src and dst in edit history', async ({ page }) => {
    await page.goto(URL);
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

    // Verify the latest entry in Edit History (Sheet1 onChange fired)
    const sheet = await getHistorySheet(page, 0);
    expect(sheet).toBe('Sheet1');

    const data = await getHistoryData(page, 0);
    // Both src (A2) and dst (B2) are included in lastChangedAddresses, so both appear in the data
    expect(data).toHaveProperty('A2');
    expect(data).toHaveProperty('B2');
    // A2 should be cleared
    expect(data['A2'].value).toBeNull();
    // B2 should have the original value of A2 (Apple)
    expect(data['B2'].value).toBe('Apple');
  });

  test('cross sheet move records src and dst in separate edit histories', async ({ page }) => {
    await page.goto(URL);
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

    // Both src (Sheet1) and dst (Sheet2) should be recorded as separate entries in Edit History
    // The order of index 0 and 1 depends on the fire order, so check both
    const sheet0 = await getHistorySheet(page, 0);
    const sheet1Name = await getHistorySheet(page, 1);

    const data0 = await getHistoryData(page, 0);
    const data1 = await getHistoryData(page, 1);

    // Sheet1 and Sheet2 should each be recorded once
    const sheets = [sheet0, sheet1Name].sort();
    expect(sheets).toEqual(['Sheet1', 'Sheet2']);

    // Sheet1 data: A2 should be cleared
    const sheet1Data = sheet0 === 'Sheet1' ? data0 : data1;
    expect(sheet1Data).toHaveProperty('A2');
    expect(sheet1Data['A2'].value).toBeNull();

    // Sheet2 data: B2 should have Apple
    const sheet2Data = sheet0 === 'Sheet2' ? data0 : data1;
    expect(sheet2Data).toHaveProperty('B2');
    expect(sheet2Data['B2'].value).toBe('Apple');
  });
});
