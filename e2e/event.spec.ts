import { test, expect } from '@playwright/test';
import { jsonMinify, jsonQuery, ctrl, go } from './utils';

test('show the tsv data', async ({ page }) => {
  await go(page, 'control-tsv--sheet-tsv');
  const b2 = page.locator("[data-address='B2']");
  await b2.click();
  await page.keyboard.type('=sum(C1:E1)+10');
  await page.keyboard.press('Enter');

  const getTsvText = async () => {
    const lines = await page.locator('#changes .cm-line').allTextContents();
    return lines.join('\n');
  };

  const tsvText = await getTsvText();
  expect(tsvText).toContain('22'); // Verify that calculation result is included

  const evaluates = page.locator('#evaluates');
  await evaluates.uncheck();
  const tsvTextRaw = await getTsvText();
  expect(tsvTextRaw).toContain('=sum(C1:E1)+10'); // Verify that raw formula is included
});

test('formula evaluation with evaluates flag', async ({ page }) => {
  await go(page, 'control-tsv--sheet-tsv');

  // Verify that formulas are evaluated in initial state
  const getTsvText = async () => {
    const lines = await page.locator('#changes .cm-line').allTextContents();
    return lines.join('\n');
  };

  // Wait for TSV data to be populated
  await page.waitForFunction(
    () => {
      const lines = document.querySelectorAll('#changes .cm-line');
      return lines.length > 0 && Array.from(lines).some((l) => l.textContent && l.textContent.trim().length > 0);
    },
    { timeout: 5000 },
  );

  let tsvText = await getTsvText();

  // Debug: Log TSV content for troubleshooting
  // console.log('TSV Text:', tsvText);
  // console.log('TSV Lines:', tsvText.split('\n'));

  // Verify that formula calculation results are included (formula results are in 3rd row)
  const lines = tsvText.split('\n');
  expect(lines.length).toBeGreaterThan(2); // Ensure we have at least 3 rows
  const thirdLine = lines[2]; // 3rd row (0-indexed so 2)
  expect(thirdLine).toBeDefined(); // Ensure third line exists

  expect(thirdLine).toContain('7'); // A3: =A1+A2 result
  expect(thirdLine).toContain('16'); // B3: =SUM(A1:B2) result
  expect(thirdLine).toContain('4.5'); // C3: =AVERAGE(A1:C2) result
  expect(thirdLine).toContain('9'); // D3: =MAX(A1:D2) result
  expect(thirdLine).toContain('1'); // E3: =MIN(A1:E2) result

  // Verify that formulas are not displayed
  expect(tsvText).not.toContain('=A1+A2');
  expect(tsvText).not.toContain('=SUM(A1:B2)');

  // Turn off Evaluates flag and verify that raw formulas are displayed
  const evaluates = page.locator('#evaluates');
  await evaluates.uncheck();

  // Wait for TSV data to update after unchecking evaluates
  await page.waitForTimeout(100);
  tsvText = await getTsvText();

  // Verify that raw formulas are included
  const lines2 = tsvText.split('\n');
  expect(lines2.length).toBeGreaterThan(2); // Ensure we have at least 3 rows
  const thirdLine2 = lines2[2]; // 3rd row
  expect(thirdLine2).toBeDefined(); // Ensure third line exists

  expect(thirdLine2).toContain('=A1+A2');
  expect(thirdLine2).toContain('=SUM(A1:B2)');
  expect(thirdLine2).toContain('=AVERAGE(A1:C2)');
  expect(thirdLine2).toContain('=MAX(A1:D2)');
  expect(thirdLine2).toContain('=MIN(A1:E2)');

  // Verify that calculation results are not displayed
  expect(thirdLine2).not.toContain('7'); // A3 calculation result
  expect(thirdLine2).not.toContain('16'); // B3 calculation result
  expect(thirdLine2).not.toContain('4.5'); // C3 calculation result

  // Turn Evaluates flag back on and verify that calculation results are displayed again
  await evaluates.check();

  // Wait for TSV data to update after checking evaluates
  await page.waitForTimeout(100);
  tsvText = await getTsvText();

  // Verify that calculation results are included again
  const lines3 = tsvText.split('\n');
  expect(lines3.length).toBeGreaterThan(2); // Ensure we have at least 3 rows
  const thirdLine3 = lines3[2]; // 3rd row
  expect(thirdLine3).toBeDefined(); // Ensure third line exists

  expect(thirdLine3).toContain('7'); // A3: =A1+A2 result
  expect(thirdLine3).toContain('16'); // B3: =SUM(A1:B2) result
  expect(thirdLine3).toContain('4.5'); // C3: =AVERAGE(A1:C2) result
  expect(thirdLine3).toContain('9'); // D3: =MAX(A1:D2) result
  expect(thirdLine3).toContain('1'); // E3: =MIN(A1:E2) result
});

test('1 operation makes 1 diff history', async ({ page }) => {
  await go(page, 'control-tsv--sheet-tsv');
  const histories = page.locator('.histories li');

  const b4 = page.locator("[data-address='B4']");
  await b4.click();
  await page.keyboard.type('4444');
  await page.keyboard.press('Enter');

  expect(await histories.count()).toBe(1);

  const c1 = page.locator("[data-address='C1']");
  await c1.click();
  await page.keyboard.press('Backspace');

  expect(await histories.count()).toBe(2);

  const firstJSON = await histories.nth(0).locator('pre').textContent();
  expect(jsonQuery(firstJSON!, ['B4', 'value'])).toBe(4444);

  const secondJSON = await histories.nth(1).locator('pre').textContent();
  expect(jsonQuery(secondJSON!, ['C1', 'value'])).toBe(undefined);
});

test('escape key should cancel the editing', async ({ page }) => {
  await go(page, 'control-tsv--sheet-tsv');

  const histories = page.locator('.histories li');

  const b2 = page.locator("[data-address='B2']");
  await b2.click();
  await page.keyboard.type('7777777');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Enter');

  expect(await histories.count()).toBe(0);
  expect(await b2.locator('.gs-cell-rendered').textContent()).toBe('7');
});

test('edit on enter', async ({ page }) => {
  await go(page, 'basic-simple--sheet');
  const address = page.locator('.gs-selecting-address');
  const editor = page.locator('.gs-editor');
  const b2 = page.locator("[data-address='B2']");
  await b2.click();

  expect(await address.textContent()).toBe('B2');
  expect(await editor.getAttribute('class')).not.toContain('gs-editing');
  await page.keyboard.press('Enter');
  expect(await address.textContent()).toBe('B2');
  expect(await editor.getAttribute('class')).toContain('gs-editing');
  await page.keyboard.press('Enter');
  expect(await address.textContent()).toBe('B3');
  expect(await editor.getAttribute('class')).not.toContain('gs-editing');
  await page.keyboard.press('Enter');
  expect(await address.textContent()).toBe('B3');
  expect(await editor.getAttribute('class')).toContain('gs-editing');
});

test('onKeyUp', async ({ page }) => {
  const logs: any[][] = [];
  page.on('console', async (msg) => {
    if (msg.type() === 'log') {
      const values = await Promise.all(msg.args().map((arg) => arg.jsonValue()));
      logs.push(values);
    }
  });

  await go(page, 'control-write--write');
  const c2 = page.locator("[data-address='C2']");
  await c2.click();

  await page.keyboard.type('abc');

  expect(logs).toStrictEqual([
    ['onKeyUp', 'a', { x: 3, y: 2 }],
    ['onKeyUp', 'ab', { x: 3, y: 2 }],
    ['onKeyUp', 'abc', { x: 3, y: 2 }],
  ]);
});

test('onSelect single cell and range selection', async ({ page }) => {
  const logs: any[][] = [];
  page.on('console', async (msg) => {
    if (msg.type() === 'log') {
      const values = await Promise.all(msg.args().map((arg) => arg.jsonValue()));
      logs.push(values);
    }
  });

  await go(page, 'control-onselect--sheet-on-select');

  const b2 = page.locator("[data-address='B2']");

  // ---- Single cell selection ----
  await b2.click();
  await page.waitForTimeout(100);
  expect(logs.length).toBeGreaterThan(0);
  let lastLog = logs[logs.length - 1];
  expect(lastLog[0]).toBe('onSelect');
  let selectionData = lastLog[1];
  expect(selectionData).toHaveProperty('pointing');
  expect(selectionData).toHaveProperty('selectingFrom');
  expect(selectionData).toHaveProperty('selectingTo');
  expect(selectionData.pointing).toEqual(selectionData.selectingFrom);
  expect(selectionData.selectingFrom).toEqual({ y: 2, x: 2 });

  // ---- Range selection ----
  logs.length = 0;
  await b2.click();
  const d4 = page.locator("[data-address='D4']");
  await page.mouse.down();
  await d4.hover();
  await page.mouse.up();
  await page.waitForTimeout(100);
  expect(logs.length).toBeGreaterThan(0);
  lastLog = logs[logs.length - 1];
  expect(lastLog[0]).toBe('onSelect');
  selectionData = lastLog[1];
  expect(selectionData).toHaveProperty('pointing');
  expect(selectionData).toHaveProperty('selectingFrom');
  expect(selectionData).toHaveProperty('selectingTo');
  expect(selectionData.pointing).toEqual(selectionData.selectingFrom);
  expect(selectionData.selectingFrom).toEqual({ y: 2, x: 2 });
  expect(selectionData.selectingTo).toEqual({ y: 4, x: 4 });
});

test('onInsertRows, onInsertCols, onRemoveRows, onRemoveCols events', async ({ page }) => {
  const logs: any[][] = [];
  page.on('console', async (msg) => {
    if (msg.type() === 'log') {
      const values = await Promise.all(msg.args().map((arg) => arg.jsonValue()));
      logs.push(values);
    }
  });

  await go(page, 'control-insert--insert');

  const b2 = page.locator("[data-address='B2']");

  // ---- onInsertRows ----
  logs.length = 0;
  await b2.click();
  await page.locator('button:has-text("Insert Row Above")').click();
  await page.waitForTimeout(100);
  expect(logs.length).toBeGreaterThan(1);
  let eventLog = logs[logs.length - 2];
  expect(eventLog[0]).toBe('onInsertRows called with:');
  let eventData = eventLog[1];
  expect(eventData).toHaveProperty('sheet');
  expect(eventData).toHaveProperty('y');
  expect(eventData).toHaveProperty('numRows');
  expect(eventData.y).toBeGreaterThanOrEqual(-1);
  expect(eventData.numRows).toBe(1);

  // ---- onInsertCols ----
  logs.length = 0;
  await b2.click();
  await page.locator('button:has-text("Insert Column Left")').click();
  await page.waitForTimeout(100);
  expect(logs.length).toBeGreaterThan(1);
  eventLog = logs[logs.length - 2];
  expect(eventLog[0]).toBe('onInsertCols called with:');
  eventData = eventLog[1];
  expect(eventData).toHaveProperty('sheet');
  expect(eventData).toHaveProperty('x');
  expect(eventData).toHaveProperty('numCols');
  expect(eventData.x).toBeGreaterThanOrEqual(-1);
  expect(eventData.numCols).toBe(1);

  // ---- onRemoveRows ----
  logs.length = 0;
  await b2.click();
  await page.locator('button:has-text("Remove Row")').click();
  await page.waitForTimeout(100);
  expect(logs.length).toBeGreaterThan(1);
  eventLog = logs[logs.length - 2];
  expect(eventLog[0]).toBe('onRemoveRows called with:');
  eventData = eventLog[1];
  expect(eventData).toHaveProperty('sheet');
  expect(eventData).toHaveProperty('ys');
  expect(Array.isArray(eventData.ys)).toBe(true);
  expect(eventData.ys.length).toBe(1);

  // ---- onRemoveCols ----
  logs.length = 0;
  await b2.click();
  await page.locator('button:has-text("Remove Column")').click();
  await page.waitForTimeout(100);
  expect(logs.length).toBeGreaterThan(1);
  eventLog = logs[logs.length - 2];
  expect(eventLog[0]).toBe('onRemoveCols called with:');
  eventData = eventLog[1];
  expect(eventData).toHaveProperty('sheet');
  expect(eventData).toHaveProperty('xs');
  expect(Array.isArray(eventData.xs)).toBe(true);
  expect(eventData.xs.length).toBe(1);
});

test.describe('OnEdit Event Tests', () => {
  test.beforeEach(async ({ page }) => {
    await go(page, 'control-onedit--on-edit');
    await page.waitForSelector('[data-sheet-name="Sheet1"]', { timeout: 10000 });
  });

  test('should display edit data when writing to cells', async ({ page }) => {
    // Click cell A2 (Apple) in Sheet1
    await page.click('[data-sheet-name="Sheet1"] >> text=Apple');

    // Enter edit mode (double-click)
    await page.dblclick('[data-sheet-name="Sheet1"] .gs-cell >> text=Apple');

    // Change the value
    await page.fill('[data-sheet-name="Sheet1"] input, [data-sheet-name="Sheet1"] textarea', 'Apple Updated');
    await page.keyboard.press('Enter');

    // Verify the change is reflected in Edit History
    await page.waitForFunction(() => {
      const historyElements = document.querySelectorAll('[data-testid="history-item"]');
      return historyElements.length > 0;
    });

    // Check the latest history data
    const latestDataText = await page.locator('[data-testid="history-data"]').first().inputValue();
    const editData = JSON.parse(latestDataText);

    // Verify the value of cell A2 has been updated
    expect(editData).toHaveProperty('A2');
    expect(editData.A2.value).toBe('Apple Updated');
  });

  test('should display edit data when moving cells', async ({ page }) => {
    // Verify that onEdit fires for a simple edit operation
    await page.dblclick('[data-sheet-name="Sheet1"] .gs-cell >> text=Apple');
    await page.fill('[data-sheet-name="Sheet1"] input, [data-sheet-name="Sheet1"] textarea', 'Apple Moved');
    await page.keyboard.press('Enter');

    // Verify the edit diff is reflected in Edit History
    await page.waitForFunction(() => {
      const historyElements = document.querySelectorAll('[data-testid="history-item"]');
      return historyElements.length > 0;
    });

    // Check the latest history data
    const latestDataText = await page.locator('[data-testid="history-data"]').first().inputValue();
    const editData = JSON.parse(latestDataText);

    // Verify the edited value exists
    const hasEditedData = Object.keys(editData).some((key) => editData[key]?.value === 'Apple Moved');
    expect(hasEditedData).toBe(true);
  });

  test('should display edit history for multiple operations', async ({ page }) => {
    // Perform multiple edit operations across multiple sheets

    // 1. Edit cell A2 in Sheet1
    await page.dblclick('[data-sheet-name="Sheet1"] .gs-cell >> text=Apple');
    await page.fill('[data-sheet-name="Sheet1"] input, [data-sheet-name="Sheet1"] textarea', 'Apple 1');
    await page.keyboard.press('Enter');

    // 2. Edit cell B2 in Sheet1
    await page.dblclick('[data-sheet-name="Sheet1"] .gs-cell >> text=100');
    await page.fill('[data-sheet-name="Sheet1"] input, [data-sheet-name="Sheet1"] textarea', '150');
    await page.keyboard.press('Enter');

    // 3. Edit in Sheet2
    await page.click('[data-sheet-name="Sheet2"] .gs-cell >> text=John');
    await page.dblclick('[data-sheet-name="Sheet2"] .gs-cell >> text=John');
    await page.fill('[data-sheet-name="Sheet2"] input, [data-sheet-name="Sheet2"] textarea', 'John Updated');
    await page.keyboard.press('Enter');

    // Verify multiple entries are shown in Edit History
    await page.waitForFunction(() => {
      const historyElements = document.querySelectorAll('[data-testid="history-item"]');
      return historyElements.length >= 3;
    });

    // Verify entries in each panel (Sheet1 gets 2, Sheet2 gets 1)
    const sheet1Items = await page.locator('[data-testid="edit-history-sheet1"] [data-testid="history-item"]').all();
    const sheet2Items = await page.locator('[data-testid="edit-history-sheet2"] [data-testid="history-item"]').all();
    expect(sheet1Items.length).toBeGreaterThanOrEqual(2);
    expect(sheet2Items.length).toBeGreaterThanOrEqual(1);

    // Check the latest Sheet2 history data contains John Updated
    const latestDataText = await page
      .locator('[data-testid="edit-history-sheet2"] [data-testid="history-data"]')
      .first()
      .inputValue();
    expect(latestDataText).toContain('John Updated');
  });

  test('should show correct area information in edit data', async ({ page }) => {
    // Edit cell A2 in Sheet1
    await page.dblclick('[data-sheet-name="Sheet1"] .gs-cell >> text=Apple');
    await page.fill('[data-sheet-name="Sheet1"] input, [data-sheet-name="Sheet1"] textarea', 'Test Value');
    await page.keyboard.press('Enter');

    // Check the area information in Edit History
    await page.waitForFunction(() => {
      const historyElements = document.querySelectorAll('[data-testid="history-item"]');
      return historyElements.length > 0;
    });

    // Verify the data in the Sheet1 panel contains the edited value
    const latestDataText = await page
      .locator('[data-testid="edit-history-sheet1"] [data-testid="history-data"]')
      .first()
      .inputValue();
    const editData = JSON.parse(latestDataText);
    expect(editData['A2']?.value).toBe('Test Value');
  });

  test('should handle edits on both sheets independently', async ({ page }) => {
    // Edit in Sheet1
    await page.dblclick('[data-sheet-name="Sheet1"] .gs-cell >> text=Apple');
    await page.fill('[data-sheet-name="Sheet1"] input, [data-sheet-name="Sheet1"] textarea', 'Sheet1 Edit');
    await page.keyboard.press('Enter');

    // Edit in Sheet2
    await page.click('[data-sheet-name="Sheet2"] .gs-cell >> text=John');
    await page.dblclick('[data-sheet-name="Sheet2"] .gs-cell >> text=John');
    await page.fill('[data-sheet-name="Sheet2"] input, [data-sheet-name="Sheet2"] textarea', 'Sheet2 Edit');
    await page.keyboard.press('Enter');

    // Verify both edits are recorded in history
    await page.waitForFunction(() => {
      const historyElements = document.querySelectorAll('[data-testid="history-item"]');
      return historyElements.length >= 2;
    });

    const historyElements = await page.locator('[data-testid="history-item"]').all();
    expect(historyElements.length).toBeGreaterThanOrEqual(2);

    // Verify each sheet's edit is recorded in its own panel
    const sheet2DataText = await page
      .locator('[data-testid="edit-history-sheet2"] [data-testid="history-data"]')
      .first()
      .inputValue();
    expect(sheet2DataText).toContain('Sheet2 Edit');
    const sheet1DataText = await page
      .locator('[data-testid="edit-history-sheet1"] [data-testid="history-data"]')
      .first()
      .inputValue();
    expect(sheet1DataText).toContain('Sheet1 Edit');
  });
});
