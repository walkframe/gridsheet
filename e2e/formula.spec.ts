import { test, expect } from '@playwright/test';
import { ctrl, drag, paste } from './utils';

test('render', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=multiple-sheets--sheets&viewMode=story');
  const sheet1 = page.locator('[data-sheet-name="Sheet1"]');
  const a11 = sheet1.locator("[data-address='A1']");
  const a21 = sheet1.locator("[data-address='A2']");
  const a31 = sheet1.locator("[data-address='A3']");
  const b11 = sheet1.locator("[data-address='B1']");

  expect(await a11.locator('.gs-cell-rendered').textContent()).toBe('150');
  expect(await a21.locator('.gs-cell-rendered').textContent()).toBe('1230');
  expect(await a31.locator('.gs-cell-rendered').textContent()).toBe('1633');
  expect(await b11.locator('.gs-cell-rendered').textContent()).toBe('#REF!');

  // raw A1
  const largeEditor1 = sheet1.locator('.gs-formula-bar textarea');
  expect(await largeEditor1.inputValue()).toBe("='Sheet2'!A1+100");

  // update sheet2
  const sheet2 = page.locator('[data-sheet-name="Sheet2"]');
  const editor2 = sheet2.locator('.gs-editor textarea');
  const a12 = sheet2.locator("[data-address='A1']");
  await a12.click();
  await page.keyboard.type('500');
  await page.keyboard.press('Enter');
  expect(await a11.locator('.gs-cell-rendered').textContent()).toBe('600');

  // update sheet3
  const sheet3 = page.locator('[data-sheet-name="Sheet 3"]');
  const editor3 = sheet3.locator('.gs-editor textarea');
  const a13 = sheet3.locator("[data-address='A1']");
  await a13.click();
  await page.keyboard.type('777');
  await page.keyboard.press('Enter');
  expect(await a31.locator('.gs-cell-rendered').textContent()).toBe('1777');

  const input3 = page.locator('#input3');
  await input3.fill('Sheet 3a');

  await a31.click();
  expect(await largeEditor1.inputValue()).toBe("='Sheet 3a'!A1 + 1000");
});

test('absolute ref should not be changed', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=formula-lookup--look-up&viewMode=story');
  const sheet2 = page.locator('[data-sheet-name="year"]');

  const b3 = sheet2.locator("[data-address='B3']");
  await b3.click();
  await ctrl(page, 'c');

  const b7 = sheet2.locator("[data-address='B7']");
  await b7.click();
  await paste(page);
  expect(await b7.locator('.gs-cell-rendered').textContent()).toBe('辰🐲');
  const largeEditor2 = sheet2.locator('.gs-formula-bar textarea');
  expect(await largeEditor2.inputValue()).toBe("=VLOOKUP(MOD(A7 - 4, 12), 'eto'!$A$1:$B$12, 2, false)");
});

test('inserting absolute ref', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic-labeler--labeler&viewMode=story');
  const largeEditor = page.locator('.gs-formula-bar textarea');
  // single ref
  const a2 = page.locator("[data-address='A2']");
  await a2.dblclick(); // =$B2
  const a3 = page.locator("[data-address='A3']");
  await a3.click();
  expect(await largeEditor.inputValue()).toBe('=$A3');
  await page.keyboard.press('Enter');

  // range ref
  const a1 = page.locator("[data-address='A1']");
  await a1.dblclick(); // =SUM($B1:C$1)
  await page.keyboard.press('ArrowLeft');
  await drag(page, 'C1', 'D1');
  expect(await largeEditor.inputValue()).toBe('=SUM($C1:D$1)');
  await page.keyboard.press('Enter');
  expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('300'); // 100 + 200
});

test('referencing error', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=formula-ref--refs&viewMode=story');
  const editor = page.locator('.gs-editor textarea');

  // B
  expect(await page.locator('[data-address="B1"] .gs-cell-rendered').textContent()).toBe('#REF!');
  expect(await page.locator('[data-address="B2"] .gs-cell-rendered').textContent()).toBe('1');
  expect(await page.locator('[data-address="B3"] .gs-cell-rendered').textContent()).toBe('3');
  expect(await page.locator('[data-address="B4"] .gs-cell-rendered').textContent()).toBe('5');
  expect(await page.locator('[data-address="B6"] .gs-cell-rendered').textContent()).toBe('10');
  expect(await page.locator('[data-address="B7"] .gs-cell-rendered').textContent()).toBe('1');

  // C
  expect(await page.locator('[data-address="C1"] .gs-cell-rendered').textContent()).toBe('#REF!');
  expect(await page.locator('[data-address="C2"] .gs-cell-rendered').textContent()).toBe('2');
  expect(await page.locator('[data-address="C3"] .gs-cell-rendered').textContent()).toBe('4');
  expect(await page.locator('[data-address="C4"] .gs-cell-rendered').textContent()).toBe('6');
  expect(await page.locator('[data-address="C6"] .gs-cell-rendered').textContent()).toBe('10');
  expect(await page.locator('[data-address="C7"] .gs-cell-rendered').textContent()).toBe('1');

  // D
  expect(await page.locator('[data-address="D1"] .gs-cell-rendered').textContent()).toBe('#REF!');
  expect(await page.locator('[data-address="D2"] .gs-cell-rendered').textContent()).toBe('#REF!');
  expect(await page.locator('[data-address="D3"] .gs-cell-rendered').textContent()).toBe('#REF!');
  expect(await page.locator('[data-address="D4"] .gs-cell-rendered').textContent()).toBe('#REF!');
  expect(await page.locator('[data-address="D6"] .gs-cell-rendered').textContent()).toBe('11');
  expect(await page.locator('[data-address="D7"] .gs-cell-rendered').textContent()).toBe('2');

  // E
  expect(await page.locator('[data-address="E6"] .gs-cell-rendered').textContent()).toBe('31');
  expect(await page.locator('[data-address="E7"] .gs-cell-rendered').textContent()).toBe('3');
  // F
  expect(await page.locator('[data-address="F7"] .gs-cell-rendered').textContent()).toBe('5');
  // G
  expect(await page.locator('[data-address="G7"] .gs-cell-rendered').textContent()).toBe('8');
});

test('insert ref by selection', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic-simple--sheet&viewMode=story');
  const editor = page.locator('.gs-editor textarea');
  const a1 = page.locator("[data-address='A1']");
  const a2 = page.locator("[data-address='A2']");
  const b1 = page.locator("[data-address='B1']");
  const b2 = page.locator("[data-address='B2']");
  const c1 = page.locator("[data-address='C1']");

  await a1.dblclick();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('=');
  await b2.click();
  await page.keyboard.press('Enter');

  await b1.click();
  await page.keyboard.type('=sum(');
  await page.locator("[data-address='B2']").hover();
  await page.mouse.down();
  await page.locator("[data-address='C3']").hover();
  await page.mouse.up();
  await page.keyboard.type(')');
  await page.keyboard.press('Enter');

  await c1.click();
  await page.keyboard.type('=sum()');
  await page.locator("[data-address='B2']").hover();
  await page.mouse.down();
  await page.locator("[data-address='C3']").hover();
  await page.mouse.up();

  expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('2');
  expect(await b1.locator('.gs-cell-rendered').textContent()).toBe('5');
  expect(await c1.locator('.gs-cell-rendered').textContent()).toBe('#N/A');
});

test('insert ref by selection in multiple sheets', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=multiple-sheets--sheets&viewMode=story');

  const sheet1 = page.locator('[data-sheet-name="Sheet1"]');
  const sheet2 = page.locator('[data-sheet-name="Sheet2"]');
  const sheet3 = page.locator('[data-sheet-name="Sheet 3"]');
  const editor3 = page.locator('.gs-editor[data-sheet-id="3"] textarea');
  const largeEditor3 = sheet3.locator('.gs-formula-bar textarea');

  const b3 = sheet3.locator("[data-address='B3']");
  await b3.click();
  await page.keyboard.type('=sum(');
  await drag(sheet1, 'C1', 'C2', (page = page));
  // Confirm that the contents of largeEditor is copied to editor
  expect(await editor3.inputValue()).toBe("=sum('Sheet1'!C1:C2");
  expect(await largeEditor3.inputValue()).toBe("=sum('Sheet1'!C1:C2");
  await page.keyboard.type(')');
  await page.keyboard.press('Enter');
  expect(await b3.locator('.gs-cell-rendered').textContent()).toBe('766');

  const b5 = sheet3.locator("[data-address='B5']");
  expect(await b5.locator('.gs-cell-rendered').textContent()).toBe('64');

  await b5.dblclick();
  // blur because the cursor is at the end
  await sheet2.locator("[data-address='B3']").click();
  await editor3.press('Tab');
  expect(await b5.locator('.gs-cell-rendered').textContent()).toBe('30');

  await b5.dblclick();
  await sheet2.locator("[data-address='B4']").click();
  await editor3.press('Tab');
  expect(await largeEditor3.inputValue()).toBe('128');
});

test('insert cols range and rows range by selection in multiple sheets', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=multiple-sheets--sheets&viewMode=story');

  const sheet1 = page.locator('[data-sheet-name="Sheet1"]');
  const sheet2 = page.locator('[data-sheet-name="Sheet2"]');
  const sheet3 = page.locator('[data-sheet-name="Sheet 3"]');
  const editor3 = page.locator('.gs-editor[data-sheet-id="3"] textarea');
  const largeEditor3 = sheet3.locator('.gs-formula-bar textarea');

  const b3 = sheet1.locator("[data-address='B3']");
  await b3.click();
  await page.keyboard.type('=sum(');
  const y2 = sheet2.locator("th[data-y='2']");
  await y2.click();
  await page.keyboard.press(')');
  await page.keyboard.press('Enter');
  expect(await b3.locator('.gs-cell-rendered').textContent()).toBe('1833');

  const b4 = sheet3.locator("[data-address='B4']");
  await b4.click();
  await page.keyboard.type('=sum(');
  await sheet2.locator("th[data-x='2']").hover();
  await page.mouse.down();
  await sheet2.locator("th[data-x='3']").hover();
  await page.mouse.up();
  expect(await editor3.inputValue()).toBe("=sum('Sheet2'!B:C");
  expect(await largeEditor3.inputValue()).toBe("=sum('Sheet2'!B:C");
  await page.keyboard.press(')');
  await page.keyboard.press('Enter');
  expect(await b4.locator('.gs-cell-rendered').textContent()).toBe('2293');
});

test('disable formula', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=formula-disabled--disabled&viewMode=story');
  const a1 = page.locator("[data-address='A1']");
  const b1 = page.locator("[data-address='B1']");
  const a2 = page.locator("[data-address='A2']");
  const b2 = page.locator("[data-address='B2']");
  const a3 = page.locator("[data-address='A3']");
  const b3 = page.locator("[data-address='B3']");
  const a4 = page.locator("[data-address='A4']");
  const b4 = page.locator("[data-address='B4']");

  expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('=1+1');
  expect(await b1.locator('.gs-cell-rendered').textContent()).toBe('2');
  expect(await a2.locator('.gs-cell-rendered').textContent()).toBe("'quote");
  expect(await b2.locator('.gs-cell-rendered').textContent()).toBe('quote');
  expect(await a3.locator('.gs-cell-rendered').textContent()).toBe("'0123");
  expect(await b3.locator('.gs-cell-rendered').textContent()).toBe('0123');
  expect(await a4.locator('.gs-cell-rendered').textContent()).toBe('0123');
  expect(await b4.locator('.gs-cell-rendered').textContent()).toBe('0123');
});

test('copy and slide ref', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=multiple-sheets--sheets&viewMode=story');
  const sheet1 = page.locator('[data-sheet-name="Sheet1"]');
  const sheet2 = page.locator('[data-sheet-name="Sheet2"]');
  const sheet3 = page.locator('[data-sheet-name="Sheet 3"]');
  const largeEditor3 = sheet3.locator('.gs-formula-bar textarea');

  const a13 = sheet3.locator("[data-address='A1']");
  const b13 = sheet3.locator("[data-address='B1']");
  await a13.click();
  await ctrl(page, 'c');
  await b13.click();
  await paste(page);
  expect(await b13.locator('.gs-cell-rendered').textContent()).toBe('#REF!');
  expect(await largeEditor3.inputValue()).toBe('=#REF!');

  const a23 = sheet3.locator("[data-address='A2']");
  const b23 = sheet3.locator("[data-address='B2']");
  await a23.click();
  await ctrl(page, 'c');
  await b23.click();
  await paste(page);
  expect(await b23.locator('.gs-cell-rendered').textContent()).toBe('#REF!');
  expect(await largeEditor3.inputValue()).toBe("=SUM('Sheet1'!#REF!:#REF!) + 10");

  const a33 = sheet3.locator("[data-address='A3']");
  const b33 = sheet3.locator("[data-address='B3']");
  await a33.click();
  await ctrl(page, 'c');
  await b33.click();
  await paste(page);
  expect(await b33.locator('.gs-cell-rendered').textContent()).toBe('#REF!');
  expect(await largeEditor3.inputValue()).toBe("=SUM('Sheet1'!C3:#REF!) + 20");

  // fixed: detecting circular reference
  const a31 = sheet1.locator("[data-address='A3']");
  expect(await a31.locator('.gs-cell-rendered').textContent()).toBe('1633');
});

test('add col and slide ref', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=multiple-sheets--sheets&viewMode=story');
  const sheet1 = page.locator('[data-sheet-name="Sheet1"]');
  const sheet2 = page.locator('[data-sheet-name="Sheet2"]');
  const sheet3 = page.locator('[data-sheet-name="Sheet 3"]');
  const largeEditor1 = sheet1.locator('.gs-formula-bar textarea');
  const largeEditor2 = sheet2.locator('.gs-formula-bar textarea');

  const a51 = sheet1.locator("[data-address='A5']");
  expect(await a51.locator('.gs-cell-rendered').textContent()).toBe('600');
  const b51 = sheet1.locator("[data-address='B5']");
  expect(await b51.locator('.gs-cell-rendered').textContent()).toBe('900');
  const a22 = sheet2.locator("[data-address='A2']");
  expect(await a22.locator('.gs-cell-rendered').textContent()).toBe('633');

  // insert a column to the left of Sheet1!C
  const th31 = sheet1.locator("th[data-x='3']");
  await th31.click();
  await page.click("th[data-x='3']", { button: 'right' });
  await page.click("[data-testid='insert-cols-left-item']");

  expect(await a51.locator('.gs-cell-rendered').textContent()).toBe('600');
  expect(await b51.locator('.gs-cell-rendered').textContent()).toBe('900');
  expect(await a22.locator('.gs-cell-rendered').textContent()).toBe('633');

  await a51.click();
  expect(await largeEditor1.inputValue()).toBe('=D5+100'); // C5 -> D5
  await b51.click();
  expect(await largeEditor1.inputValue()).toBe('=A5+300'); // A5 -> A5
  await a22.click();
  expect(await largeEditor2.inputValue()).toBe("='Sheet1'!D3"); // C3 -> D3
});
