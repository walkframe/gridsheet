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
