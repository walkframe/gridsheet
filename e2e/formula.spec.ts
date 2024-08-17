import { test, expect } from '@playwright/test';

test('render', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic--multiple-sheet&viewMode=story');
  const sheet1 = page.locator('[data-sheet-name="Sheet1"]');
  const a11 = sheet1.locator("[data-address='A1']");
  const a21 = sheet1.locator("[data-address='A2']");
  const a31 = sheet1.locator("[data-address='A3']");
  const b11 = sheet1.locator("[data-address='B1']");

  expect(await a11.locator('.gs-cell-rendered').textContent()).toBe('150');
  expect(await a21.locator('.gs-cell-rendered').textContent()).toBe('1230');
  expect(await a31.locator('.gs-cell-rendered').textContent()).toBe('1555');
  expect(await b11.locator('.gs-cell-rendered').textContent()).toBe('#REF!');

  // raw A1
  const largeEditor1 = sheet1.locator('.gs-formula-bar textarea');
  expect(await largeEditor1.inputValue()).toBe('=Sheet2!A1+100');

  // update sheet2
  const sheet2 = page.locator('[data-sheet-name="Sheet2"]');
  const editor2 = sheet2.locator('.gs-editor textarea');
  const a12 = sheet2.locator("[data-address='A1']");
  await a12.dblclick();
  await editor2.fill('500');
  await editor2.blur();
  expect(await a11.locator('.gs-cell-rendered').textContent()).toBe('600');

  // update sheet3
  const sheet3 = page.locator('[data-sheet-name="Sheet 3"]');
  const editor3 = sheet3.locator('.gs-editor textarea');
  const a13 = sheet3.locator("[data-address='A1']");
  await a13.dblclick();
  await editor3.fill('777');
  await editor3.blur();
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

  await a1.dblclick();
  await editor.fill('=A1');
  await editor.press('Enter');

  await a2.dblclick();
  await editor.fill('=A1');
  await editor.press('Enter');

  await a3.dblclick();
  await editor.fill('=A4');
  await editor.press('Enter');

  await a4.dblclick();
  await editor.fill('=A3');
  await editor.press('Enter');

  await b1.dblclick();
  await editor.fill('10001');
  await editor.press('Enter');

  await b2.dblclick();
  await editor.fill('=B1');
  await editor.press('Enter');

  await b3.dblclick();
  await editor.fill('=SUM(B1:B2)');
  await editor.press('Enter');

  await b4.dblclick();
  await editor.fill('=SUM(B1:B4)');
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
  await editor.fill('=A1');
  await b2.click();
  await editor.press('Enter');

  await b1.dblclick();
  await editor.fill('=sum(');
  await page.locator("[data-address='B2']").hover();
  await page.mouse.down();
  await page.locator("[data-address='C3']").hover();
  await page.mouse.up();
  await editor.press(')');
  await editor.press('Enter');

  await c1.dblclick();
  await editor.fill('=sum()');
  await page.locator("[data-address='B2']").hover();
  await page.mouse.down();
  await page.locator("[data-address='C3']").hover();
  await page.mouse.up();

  expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('2');
  expect(await b1.locator('.gs-cell-rendered').textContent()).toBe('5');
  expect(await c1.locator('.gs-cell-rendered').textContent()).toBe('#N/A');
});
