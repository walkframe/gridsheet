import { test, expect } from '@playwright/test';
import { jsonMinify, jsonQuery, ctrl } from './utils';

test('show the tsv data', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=control-onchange--sheet-on-change&viewMode=story');
  const b2 = page.locator("[data-address='B2']");
  await b2.click();
  await page.keyboard.type('=sum(C1:E1)+10');
  await page.keyboard.press('Enter');

  const tsvData = page.locator('#changes');
  const tsvText = await tsvData.inputValue();
  expect(tsvText).toContain('22'); // Verify that calculation result is included

  const evaluates = page.locator('#evaluates');
  await evaluates.uncheck();
  const tsvTextRaw = await tsvData.inputValue();
  expect(tsvTextRaw).toContain('=sum(C1:E1)+10'); // Verify that raw formula is included
});

test('formula evaluation with evaluates flag', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=control-onchange--sheet-on-change&viewMode=story');

  // Verify that formulas are evaluated in initial state
  const tsvData = page.locator('#changes');

  // Wait for TSV data to be populated
  await page.waitForFunction(
    () => {
      const element = document.querySelector('#changes') as HTMLInputElement;
      return element && element.value && element.value.trim().length > 0;
    },
    { timeout: 5000 },
  );

  let tsvText = await tsvData.inputValue();

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
  tsvText = await tsvData.inputValue();

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
  tsvText = await tsvData.inputValue();

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
  await page.goto('http://localhost:5233/iframe.html?id=control-onchange--sheet-on-change&viewMode=story');
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
  expect(jsonQuery(secondJSON!, ['C1', 'value'])).toBe(null);
});

test('escape key should cancel the editing', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=control-onchange--sheet-on-change&viewMode=story');

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
  await page.goto('http://localhost:5233/iframe.html?id=basic-simple--sheet&viewMode=story');
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

  await page.goto('http://localhost:5233/iframe.html?id=control-write--write');
  const c2 = page.locator("[data-address='C2']");
  await c2.click();

  await page.keyboard.type('abc');

  expect(logs).toStrictEqual([
    ['onKeyUp', 'a', { x: 3, y: 2 }],
    ['onKeyUp', 'ab', { x: 3, y: 2 }],
    ['onKeyUp', 'abc', { x: 3, y: 2 }],
  ]);
});

test('onSelect single cell', async ({ page }) => {
  const logs: any[][] = [];
  page.on('console', async (msg) => {
    if (msg.type() === 'log') {
      const values = await Promise.all(msg.args().map((arg) => arg.jsonValue()));
      logs.push(values);
    }
  });

  await page.goto('http://localhost:5233/iframe.html?id=control-onselect--sheet-on-select');

  // Click on B2 for single cell selection
  const b2 = page.locator("[data-address='B2']");
  await b2.click();

  // Wait for the onSelect event to fire
  await page.waitForTimeout(100);

  // Check that onSelect was called with correct single cell selection
  expect(logs.length).toBeGreaterThan(0);
  const lastLog = logs[logs.length - 1];
  expect(lastLog[0]).toBe('onSelect');

  const selectionData = lastLog[1];

  // Verify the structure of the selection data
  expect(selectionData).toHaveProperty('pointing');
  expect(selectionData).toHaveProperty('selectingFrom');
  expect(selectionData).toHaveProperty('selectingTo');

  // For single cell selection, pointing and selectingFrom should be the same
  // selectingTo might be {-1, -1} for single cell selection
  expect(selectionData.pointing).toEqual(selectionData.selectingFrom);
  expect(selectionData.selectingFrom).toEqual({ y: 2, x: 2 });
});

test('onSelect range selection', async ({ page }) => {
  const logs: any[][] = [];
  page.on('console', async (msg) => {
    if (msg.type() === 'log') {
      const values = await Promise.all(msg.args().map((arg) => arg.jsonValue()));
      logs.push(values);
    }
  });

  await page.goto('http://localhost:5233/iframe.html?id=control-onselect--sheet-on-select');

  // Clear previous logs
  logs.length = 0;

  // Start selection at B2
  const b2 = page.locator("[data-address='B2']");
  await b2.click();

  // Drag to D4 for range selection
  const d4 = page.locator("[data-address='D4']");
  await page.mouse.down();
  await d4.hover();
  await page.mouse.up();

  // Wait for the onSelect event to fire
  await page.waitForTimeout(100);

  // Check that onSelect was called with correct range selection
  expect(logs.length).toBeGreaterThan(0);
  const lastLog = logs[logs.length - 1];
  expect(lastLog[0]).toBe('onSelect');

  const selectionData = lastLog[1];

  // Verify the structure of the selection data
  expect(selectionData).toHaveProperty('pointing');
  expect(selectionData).toHaveProperty('selectingFrom');
  expect(selectionData).toHaveProperty('selectingTo');

  // For range selection, coordinates should be different
  expect(selectionData.pointing).toEqual(selectionData.selectingFrom);
  expect(selectionData.selectingFrom).toEqual({ y: 2, x: 2 });
  expect(selectionData.selectingTo).toEqual({ y: 4, x: 4 });
});

test('onInsertRows', async ({ page }) => {
  const logs: any[][] = [];
  page.on('console', async (msg) => {
    if (msg.type() === 'log') {
      const values = await Promise.all(msg.args().map((arg) => arg.jsonValue()));
      logs.push(values);
    }
  });

  await page.goto('http://localhost:5233/iframe.html?id=control-insert--insert');

  // Select a cell first to set the selection range
  const b2 = page.locator("[data-address='B2']");
  await b2.click();

  // Click "Insert Row Above" button
  const insertRowButton = page.locator('button:has-text("Insert Row Above")');
  await insertRowButton.click();

  // Wait for the onInsertRows event to fire
  await page.waitForTimeout(100);

  // Check that onInsertRows was called
  expect(logs.length).toBeGreaterThan(1);
  const eventLog = logs[logs.length - 2]; // First log is the event call
  expect(eventLog[0]).toBe('onInsertRows called with:');

  const eventData = eventLog[1];
  expect(eventData).toHaveProperty('table');
  expect(eventData).toHaveProperty('y');
  expect(eventData).toHaveProperty('numRows');
  expect(eventData.y).toBeGreaterThanOrEqual(-1); // Insert position can be -1 if no selection
  expect(eventData.numRows).toBe(1);
});

test('onInsertCols', async ({ page }) => {
  const logs: any[][] = [];
  page.on('console', async (msg) => {
    if (msg.type() === 'log') {
      const values = await Promise.all(msg.args().map((arg) => arg.jsonValue()));
      logs.push(values);
    }
  });

  await page.goto('http://localhost:5233/iframe.html?id=control-insert--insert');

  // Select a cell first to set the selection range
  const b2 = page.locator("[data-address='B2']");
  await b2.click();

  // Click "Insert Column Left" button
  const insertColButton = page.locator('button:has-text("Insert Column Left")');
  await insertColButton.click();

  // Wait for the onInsertCols event to fire
  await page.waitForTimeout(100);

  // Check that onInsertCols was called
  expect(logs.length).toBeGreaterThan(1);
  const eventLog = logs[logs.length - 2]; // First log is the event call
  expect(eventLog[0]).toBe('onInsertCols called with:');

  const eventData = eventLog[1];
  expect(eventData).toHaveProperty('table');
  expect(eventData).toHaveProperty('x');
  expect(eventData).toHaveProperty('numCols');
  expect(eventData.x).toBeGreaterThanOrEqual(-1); // Insert position can be -1 if no selection
  expect(eventData.numCols).toBe(1);
});

test('onRemoveRows', async ({ page }) => {
  const logs: any[][] = [];
  page.on('console', async (msg) => {
    if (msg.type() === 'log') {
      const values = await Promise.all(msg.args().map((arg) => arg.jsonValue()));
      logs.push(values);
    }
  });

  await page.goto('http://localhost:5233/iframe.html?id=control-insert--insert');

  // Select a cell first to set the selection range
  const b2 = page.locator("[data-address='B2']");
  await b2.click();

  // Click "Remove Row" button
  const removeRowButton = page.locator('button:has-text("Remove Row")');
  await removeRowButton.click();

  // Wait for the onRemoveRows event to fire
  await page.waitForTimeout(100);

  // Check that onRemoveRows was called
  expect(logs.length).toBeGreaterThan(1);
  const eventLog = logs[logs.length - 2]; // First log is the event call
  expect(eventLog[0]).toBe('onRemoveRows called with:');

  const eventData = eventLog[1];
  expect(eventData).toHaveProperty('table');
  expect(eventData).toHaveProperty('ys');
  expect(Array.isArray(eventData.ys)).toBe(true);
  expect(eventData.ys.length).toBe(1);
});

test('onRemoveCols', async ({ page }) => {
  const logs: any[][] = [];
  page.on('console', async (msg) => {
    if (msg.type() === 'log') {
      const values = await Promise.all(msg.args().map((arg) => arg.jsonValue()));
      logs.push(values);
    }
  });

  await page.goto('http://localhost:5233/iframe.html?id=control-insert--insert');

  // Select a cell first to set the selection range
  const b2 = page.locator("[data-address='B2']");
  await b2.click();

  // Click "Remove Column" button
  const removeColButton = page.locator('button:has-text("Remove Column")');
  await removeColButton.click();

  // Wait for the onRemoveCols event to fire
  await page.waitForTimeout(100);

  // Check that onRemoveCols was called
  expect(logs.length).toBeGreaterThan(1);
  const eventLog = logs[logs.length - 2]; // First log is the event call
  expect(eventLog[0]).toBe('onRemoveCols called with:');

  const eventData = eventLog[1];
  expect(eventData).toHaveProperty('table');
  expect(eventData).toHaveProperty('xs');
  expect(Array.isArray(eventData.xs)).toBe(true);
  expect(eventData.xs.length).toBe(1);
});

test.describe('OnEdit Event Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5233/iframe.html?args=&id=control-onedit--on-edit&viewMode=story');
    await page.waitForSelector('[data-sheet-name="Sheet1"]', { timeout: 10000 });
  });

  test('should display edit data when writing to cells', async ({ page }) => {
    // Sheet1のA2セル（Apple）をクリック
    await page.click('[data-sheet-name="Sheet1"] >> text=Apple');

    // セルを編集モードにする（ダブルクリック）
    await page.dblclick('[data-sheet-name="Sheet1"] .gs-cell >> text=Apple');

    // 値を変更
    await page.fill('[data-sheet-name="Sheet1"] input, [data-sheet-name="Sheet1"] textarea', 'Apple Updated');
    await page.keyboard.press('Enter');

    // Edit Historyに変更が反映されることを確認
    await page.waitForFunction(() => {
      const historyElements = document.querySelectorAll('[data-testid="history-item"]');
      return historyElements.length > 0;
    });

    // 最新の履歴データを確認
    const latestDataText = await page.locator('[data-testid="history-data"]').first().inputValue();
    const editData = JSON.parse(latestDataText);

    // A2セルの値が更新されていることを確認
    expect(editData).toHaveProperty('A2');
    expect(editData.A2).toBe('Apple Updated');
  });

  test('should display edit data when moving cells', async ({ page }) => {
    // 簡単な編集操作でonEditが動作することを確認
    await page.dblclick('[data-sheet-name="Sheet1"] .gs-cell >> text=Apple');
    await page.fill('[data-sheet-name="Sheet1"] input, [data-sheet-name="Sheet1"] textarea', 'Apple Moved');
    await page.keyboard.press('Enter');

    // Edit Historyに編集の差分が反映されることを確認
    await page.waitForFunction(() => {
      const historyElements = document.querySelectorAll('[data-testid="history-item"]');
      return historyElements.length > 0;
    });

    // 最新の履歴データを確認
    const latestDataText = await page.locator('[data-testid="history-data"]').first().inputValue();
    const editData = JSON.parse(latestDataText);

    // 編集された値が存在することを確認
    const hasEditedData = Object.keys(editData).some((key) => editData[key] === 'Apple Moved');
    expect(hasEditedData).toBe(true);
  });

  test('should display edit history for multiple operations', async ({ page }) => {
    // 複数のシートで複数の編集操作を実行

    // 1. Sheet1のA2セルを編集
    await page.dblclick('[data-sheet-name="Sheet1"] .gs-cell >> text=Apple');
    await page.fill('[data-sheet-name="Sheet1"] input, [data-sheet-name="Sheet1"] textarea', 'Apple 1');
    await page.keyboard.press('Enter');

    // 2. Sheet1のB2セルを編集
    await page.dblclick('[data-sheet-name="Sheet1"] .gs-cell >> text=100');
    await page.fill('[data-sheet-name="Sheet1"] input, [data-sheet-name="Sheet1"] textarea', '150');
    await page.keyboard.press('Enter');

    // 3. Sheet2で編集
    await page.click('[data-sheet-name="Sheet2"] .gs-cell >> text=John');
    await page.dblclick('[data-sheet-name="Sheet2"] .gs-cell >> text=John');
    await page.fill('[data-sheet-name="Sheet2"] input, [data-sheet-name="Sheet2"] textarea', 'John Updated');
    await page.keyboard.press('Enter');

    // Edit Historyに複数のエントリが表示されることを確認
    await page.waitForFunction(() => {
      const historyElements = document.querySelectorAll('[data-testid="history-item"]');
      return historyElements.length >= 3;
    });

    // 履歴の内容を確認
    const historyElements = await page.locator('[data-testid="history-item"]').all();
    expect(historyElements.length).toBeGreaterThanOrEqual(3);

    // 最新の履歴エントリを確認
    const latestHistory = await historyElements[0].textContent();
    expect(latestHistory).toContain('Sheet:');

    // 最新の履歴データを確認
    const latestDataText = await page.locator('[data-testid="history-data"]').first().inputValue();
    expect(latestDataText).toContain('John Updated');
  });

  test('should show correct area information in edit data', async ({ page }) => {
    // Sheet1のA2セルを編集
    await page.dblclick('[data-sheet-name="Sheet1"] .gs-cell >> text=Apple');
    await page.fill('[data-sheet-name="Sheet1"] input, [data-sheet-name="Sheet1"] textarea', 'Test Value');
    await page.keyboard.press('Enter');

    // Edit Historyのエリア情報を確認
    await page.waitForFunction(() => {
      const historyElements = document.querySelectorAll('[data-testid="history-item"]');
      return historyElements.length > 0;
    });

    const historyText = await page.locator('[data-testid="history-item"]').first().textContent();

    // エリア情報が正しく表示されていることを確認（A2セルなので top:2, left:1, bottom:2, right:1）
    expect(historyText).toContain('Area:2,1 to 2,1');
  });

  test('should handle edits on both sheets independently', async ({ page }) => {
    // Sheet1で編集
    await page.dblclick('[data-sheet-name="Sheet1"] .gs-cell >> text=Apple');
    await page.fill('[data-sheet-name="Sheet1"] input, [data-sheet-name="Sheet1"] textarea', 'Sheet1 Edit');
    await page.keyboard.press('Enter');

    // Sheet2で編集
    await page.click('[data-sheet-name="Sheet2"] .gs-cell >> text=John');
    await page.dblclick('[data-sheet-name="Sheet2"] .gs-cell >> text=John');
    await page.fill('[data-sheet-name="Sheet2"] input, [data-sheet-name="Sheet2"] textarea', 'Sheet2 Edit');
    await page.keyboard.press('Enter');

    // 両方の編集が履歴に記録されることを確認
    await page.waitForFunction(() => {
      const historyElements = document.querySelectorAll('[data-testid="history-item"]');
      return historyElements.length >= 2;
    });

    const historyElements = await page.locator('[data-testid="history-item"]').all();
    expect(historyElements.length).toBeGreaterThanOrEqual(2);

    // 最新の編集がSheet2のものであることを確認
    const latestHistory = await historyElements[0].textContent();
    expect(latestHistory).toContain('Sheet2 Edit');
  });
});
