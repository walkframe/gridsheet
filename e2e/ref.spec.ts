import { test, expect } from '@playwright/test';
import { ctrl, drag, paste } from './utils';

test('reference resolution after move operation', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=formula-ref--refs&viewMode=story');

  // Check initial state
  const f9 = page.locator("[data-address='F9']");
  const f10 = page.locator("[data-address='F10']");

  // Check initial values: F9 = SUM(B9:E9) = 1+2+5+6 = 14, F10 = SUM(B10:E10) = 3+4+7+8 = 22
  expect(await f9.locator('.gs-cell-rendered').textContent()).toBe('14');
  expect(await f10.locator('.gs-cell-rendered').textContent()).toBe('22');

  // Select and cut B9:C10
  await drag(page, 'B9', 'C10');
  await ctrl(page, 'x');

  // Paste to D9:E10
  const d9 = page.locator("[data-address='D9']");
  await d9.click();
  await paste(page);

  // Check state after move
  // Verify that B9:C10 is empty
  const b9 = page.locator("[data-address='B9']");
  const b10 = page.locator("[data-address='B10']");
  const c9 = page.locator("[data-address='C9']");
  const c10 = page.locator("[data-address='C10']");

  expect(await b9.locator('.gs-cell-rendered').textContent()).toBe('');
  expect(await b10.locator('.gs-cell-rendered').textContent()).toBe('');
  expect(await c9.locator('.gs-cell-rendered').textContent()).toBe('');
  expect(await c10.locator('.gs-cell-rendered').textContent()).toBe('');

  // Verify that values have moved to D9:E10
  const e9 = page.locator("[data-address='E9']");
  const e10 = page.locator("[data-address='E10']");
  const d10 = page.locator("[data-address='D10']");

  expect(await d9.locator('.gs-cell-rendered').textContent()).toBe('1');
  expect(await e9.locator('.gs-cell-rendered').textContent()).toBe('2');
  expect(await d10.locator('.gs-cell-rendered').textContent()).toBe('3');
  expect(await e10.locator('.gs-cell-rendered').textContent()).toBe('4');

  // Verify that F9, F10 formulas remain unchanged (SUM(B9:E9), SUM(B10:E10))
  await f9.click();
  const largeEditor = page.locator('.gs-formula-bar textarea');
  expect(await largeEditor.inputValue()).toBe('=SUM(B9:E9)');

  await f10.click();
  expect(await largeEditor.inputValue()).toBe('=SUM(B10:E10)');

  // Verify that calculation results are 3, 7 respectively
  // F9 = SUM(B9:E9) = 0+0+1+2 = 3, F10 = SUM(B10:E10) = 0+0+3+4 = 7
  await f9.click();
  expect(await f9.locator('.gs-cell-rendered').textContent()).toBe('3');
  expect(await f10.locator('.gs-cell-rendered').textContent()).toBe('7');

  // Verify that undo (ctrl+z) returns to 14, 22
  await ctrl(page, 'z');
  expect(await f9.locator('.gs-cell-rendered').textContent()).toBe('14');
  expect(await f10.locator('.gs-cell-rendered').textContent()).toBe('22');

  // Verify that B9:C10 values are restored
  expect(await b9.locator('.gs-cell-rendered').textContent()).toBe('1');
  expect(await b10.locator('.gs-cell-rendered').textContent()).toBe('3');
  expect(await c9.locator('.gs-cell-rendered').textContent()).toBe('2');
  expect(await c10.locator('.gs-cell-rendered').textContent()).toBe('4');

  // Verify that D9:E10 values are restored
  expect(await d9.locator('.gs-cell-rendered').textContent()).toBe('5');
  expect(await e9.locator('.gs-cell-rendered').textContent()).toBe('6');
  expect(await d10.locator('.gs-cell-rendered').textContent()).toBe('7');
  expect(await e10.locator('.gs-cell-rendered').textContent()).toBe('8');

  // Verify that redo (ctrl+r) returns to 3, 7 again
  await ctrl(page, 'r');
  expect(await f9.locator('.gs-cell-rendered').textContent()).toBe('3');
  expect(await f10.locator('.gs-cell-rendered').textContent()).toBe('7');

  // Verify that B9:C10 is empty again
  expect(await b9.locator('.gs-cell-rendered').textContent()).toBe('');
  expect(await b10.locator('.gs-cell-rendered').textContent()).toBe('');
  expect(await c9.locator('.gs-cell-rendered').textContent()).toBe('');
  expect(await c10.locator('.gs-cell-rendered').textContent()).toBe('');

  // Verify that values have moved to D9:E10 again
  expect(await d9.locator('.gs-cell-rendered').textContent()).toBe('1');
  expect(await e9.locator('.gs-cell-rendered').textContent()).toBe('2');
  expect(await d10.locator('.gs-cell-rendered').textContent()).toBe('3');
  expect(await e10.locator('.gs-cell-rendered').textContent()).toBe('4');
});

test('reference resolution after move B11:C12 to B9:C10', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=formula-ref--refs&viewMode=story');

  // Check initial state
  const b13 = page.locator("[data-address='B13']");
  const c13 = page.locator("[data-address='C13']");

  // Check initial values: B13 = SUM(B9:B12) = 1+3+9+11 = 24, C13 = SUM(C9:C12) = 2+4+10+12 = 28
  expect(await b13.locator('.gs-cell-rendered').textContent()).toBe('24');
  expect(await c13.locator('.gs-cell-rendered').textContent()).toBe('28');

  // Select and cut B11:C12
  await drag(page, 'B11', 'C12');
  await ctrl(page, 'x');

  // Paste to B9:C10
  const b9 = page.locator("[data-address='B9']");
  await b9.click();
  await paste(page);

  // Check state after move
  // Verify that B11:C12 is empty
  const b11 = page.locator("[data-address='B11']");
  const b12 = page.locator("[data-address='B12']");
  const c11 = page.locator("[data-address='C11']");
  const c12 = page.locator("[data-address='C12']");

  expect(await b11.locator('.gs-cell-rendered').textContent()).toBe('');
  expect(await b12.locator('.gs-cell-rendered').textContent()).toBe('');
  expect(await c11.locator('.gs-cell-rendered').textContent()).toBe('');
  expect(await c12.locator('.gs-cell-rendered').textContent()).toBe('');

  // Verify that values have moved to B9:C10
  const b10 = page.locator("[data-address='B10']");
  const c9 = page.locator("[data-address='C9']");
  const c10 = page.locator("[data-address='C10']");

  expect(await b9.locator('.gs-cell-rendered').textContent()).toBe('9');
  expect(await c9.locator('.gs-cell-rendered').textContent()).toBe('10');
  expect(await b10.locator('.gs-cell-rendered').textContent()).toBe('11');
  expect(await c10.locator('.gs-cell-rendered').textContent()).toBe('12');

  // Verify that B13, C13 formulas remain unchanged (SUM(B9:B12), SUM(C9:C12))
  await b13.click();
  const largeEditor = page.locator('.gs-formula-bar textarea');
  expect(await largeEditor.inputValue()).toBe('=SUM(B9:B12)');

  await c13.click();
  expect(await largeEditor.inputValue()).toBe('=SUM(C9:C12)');

  // Verify that calculation results are 20, 22 respectively
  // B13 = SUM(B9:B12) = 9+11+0+0 = 20, C13 = SUM(C9:C12) = 10+12+0+0 = 22
  await b13.click();
  expect(await b13.locator('.gs-cell-rendered').textContent()).toBe('20');
  expect(await c13.locator('.gs-cell-rendered').textContent()).toBe('22');

  // Verify that undo (ctrl+z) returns to 24, 28
  await ctrl(page, 'z');
  expect(await b13.locator('.gs-cell-rendered').textContent()).toBe('24');
  expect(await c13.locator('.gs-cell-rendered').textContent()).toBe('28');

  // Verify that B9:C10 values are restored
  expect(await b9.locator('.gs-cell-rendered').textContent()).toBe('1');
  expect(await b10.locator('.gs-cell-rendered').textContent()).toBe('3');
  expect(await c9.locator('.gs-cell-rendered').textContent()).toBe('2');
  expect(await c10.locator('.gs-cell-rendered').textContent()).toBe('4');

  // Verify that B11:C12 values are restored
  expect(await b11.locator('.gs-cell-rendered').textContent()).toBe('9');
  expect(await b12.locator('.gs-cell-rendered').textContent()).toBe('11');
  expect(await c11.locator('.gs-cell-rendered').textContent()).toBe('10');
  expect(await c12.locator('.gs-cell-rendered').textContent()).toBe('12');

  // Verify that redo (ctrl+r) returns to 20, 22 again
  await ctrl(page, 'r');
  expect(await b13.locator('.gs-cell-rendered').textContent()).toBe('20');
  expect(await c13.locator('.gs-cell-rendered').textContent()).toBe('22');

  // Verify that values have moved to B9:C10 again
  expect(await b9.locator('.gs-cell-rendered').textContent()).toBe('9');
  expect(await c9.locator('.gs-cell-rendered').textContent()).toBe('10');
  expect(await b10.locator('.gs-cell-rendered').textContent()).toBe('11');
  expect(await c10.locator('.gs-cell-rendered').textContent()).toBe('12');

  // Verify that B11:C12 is empty again
  expect(await b11.locator('.gs-cell-rendered').textContent()).toBe('');
  expect(await b12.locator('.gs-cell-rendered').textContent()).toBe('');
  expect(await c11.locator('.gs-cell-rendered').textContent()).toBe('');
  expect(await c12.locator('.gs-cell-rendered').textContent()).toBe('');
});
