import { test, expect } from '@playwright/test';
import { drag } from './utils';

test('render', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic--multiple-sheet&viewMode=story');
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
  expect(await largeEditor1.inputValue()).toBe('=Sheet2!A1+100');

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

test('circular referencing error', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic--small&viewMode=story');
  const editor = page.locator('.gs-editor textarea');
  const a1 = page.locator("[data-address='A1']");
  const a2 = page.locator("[data-address='A2']");
  const a3 = page.locator("[data-address='A3']");
  const a4 = page.locator("[data-address='A4']");
  const b1 = page.locator("[data-address='B1']");
  const b2 = page.locator("[data-address='B2']");
  const b3 = page.locator("[data-address='B3']");
  const b4 = page.locator("[data-address='B4']");

  await a1.click();
  await page.keyboard.type('=A1');
  await editor.press('Enter');

  await a2.click();
  await page.keyboard.type('=A1');
  await editor.press('Enter');

  await a3.click();
  await page.keyboard.type('=A4');
  await editor.press('Enter');

  await a4.click();
  await page.keyboard.type('=A3');
  await editor.press('Enter');

  await b1.click();
  await page.keyboard.type('10001');
  await editor.press('Enter');

  await b2.click();
  await page.keyboard.type('=B1');
  await editor.press('Enter');

  await b3.click();
  await page.keyboard.type('=SUM(B1:B2)');
  await editor.press('Enter');

  await b4.click();
  await page.keyboard.type('=SUM(B1:B4)');
  await editor.press('Enter');

  expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('#REF!');
  expect(await a2.locator('.gs-cell-rendered').textContent()).toBe('#REF!');
  expect(await a3.locator('.gs-cell-rendered').textContent()).toBe('#REF!');
  expect(await a4.locator('.gs-cell-rendered').textContent()).toBe('#REF!');
  expect(await b1.locator('.gs-cell-rendered').textContent()).toBe('10001');
  expect(await b2.locator('.gs-cell-rendered').textContent()).toBe('10001');
  expect(await b3.locator('.gs-cell-rendered').textContent()).toBe('20002');
  expect(await b4.locator('.gs-cell-rendered').textContent()).toBe('#REF!');
});

test('insert ref by selection', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic--small&viewMode=story');
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
  await page.goto('http://localhost:5233/iframe.html?id=demo--first-demo&viewMode=story');

  const sheet1 = page.locator('[data-sheet-name="criteria"]');
  const sheet2 = page.locator('[data-sheet-name="grades"]');
  const sheet3 = page.locator('[data-sheet-name="other"]');
  const editor3 = page.locator('.gs-editor[data-sheet-id="3"] textarea');
  const largeEditor3 = sheet3.locator('.gs-formula-bar textarea');

  const b3 = sheet3.locator("[data-address='B3']");
  await b3.click();
  await page.keyboard.type('=sum(');
  await drag(sheet1, 'E1', 'F1', (page = page));
  // Confirm that the contents of largeEditor is copied to editor
  expect(await editor3.inputValue()).toBe('=sum(criteria!E1:F1');
  expect(await largeEditor3.inputValue()).toBe('=sum(criteria!E1:F1');
  await page.keyboard.type(')');
  await page.keyboard.press('Enter');
  expect(await b3.locator('.gs-cell-rendered').textContent()).toBe('185');

  const b5 = sheet3.locator("[data-address='B5']");
  expect(await b5.locator('.gs-cell-rendered').textContent()).toBe('3');

  await b5.dblclick();
  // blur because the cursor is at the end
  await sheet2.locator("[data-address='B4']").click();
  await editor3.press('Tab');
  expect(await b5.locator('.gs-cell-rendered').textContent()).toBe('3');

  await b5.dblclick();
  await page.keyboard.press('ArrowLeft');
  await sheet2.locator("[data-address='B4']").click();
  await editor3.press('Tab');
  expect(await b5.locator('.gs-cell-rendered').textContent()).toBe('2');
});

test('insert cols range and rows range by selection in multiple sheets', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=demo--first-demo&viewMode=story');

  const sheet1 = page.locator('[data-sheet-name="criteria"]');
  const sheet2 = page.locator('[data-sheet-name="grades"]');
  const editor2 = page.locator('.gs-editor[data-sheet-id="2"] textarea');
  const largeEditor2 = sheet2.locator('.gs-formula-bar textarea');

  const d3 = sheet2.locator("[data-address='D3']");
  await d3.click();
  await page.keyboard.type('=sum(');
  const y1 = sheet1.locator("th[data-y='1']");
  await y1.click();
  await editor2.press(')');
  await editor2.press('Enter');
  expect(await d3.locator('.gs-cell-rendered').textContent()).toBe('395');

  const d4 = sheet2.locator("[data-address='D4']");
  await d4.click();
  await page.keyboard.type('=sum(');
  await sheet2.locator("th[data-x='2']").hover();
  await page.mouse.down();
  await sheet2.locator("th[data-x='3']").hover();
  await page.mouse.up();
  expect(await editor2.inputValue()).toBe('=sum(B:C');
  expect(await largeEditor2.inputValue()).toBe('=sum(B:C');
  await editor2.press(')');
  await editor2.press('Enter');
  expect(await d4.locator('.gs-cell-rendered').textContent()).toBe('370');
});

test('disable formula', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=formula--disabled&viewMode=story');
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
