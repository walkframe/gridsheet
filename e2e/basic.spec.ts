import { test, expect } from '@playwright/test';
import { ctrl, drag, paste } from './utils';

test('cell value', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic-simple--sheet&viewMode=story');
  const b2 = page.locator("[data-address='B2']");
  expect(await b2.locator('.gs-cell-rendered').textContent()).toContain('2');

  const b3 = page.locator("[data-address='B3']");
  expect(await b3.locator('.gs-cell-rendered').textContent()).toBe('');

  await b3.dblclick();
  const editor = page.locator('.gs-editor textarea');
  page.keyboard.type('b3');
  await editor.blur();
  expect(await b3.locator('.gs-cell-rendered').textContent()).toBe('b3');
});

test('pointing', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic-simple--sheet&viewMode=story');
  const b2 = page.locator("[data-address='B2']");
  await b2.click();

  const address = page.locator('.gs-selecting-address');
  expect(await address.textContent()).toBe('B2');

  const largeEditor = page.locator('.gs-formula-bar textarea');
  expect(await largeEditor.inputValue()).toBe('2');

  expect(await b2.getAttribute('class')).toContain('gs-choosing');

  const hor = page.locator(".gs-th-top[data-x='2']");
  expect(await hor.getAttribute('class')).toContain('gs-choosing');

  const ver = page.locator(".gs-th-left[data-y='2']");
  expect(await ver.getAttribute('class')).toContain('gs-choosing');

  const b3 = page.locator("[data-address='B3']");
  expect(await b3.getAttribute('class')).not.toContain('gs-choosing');
});

test('select', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic-simple--sheet&viewMode=story');
  const a1 = page.locator("[data-address='A1']");
  const b2 = page.locator("[data-address='B2']");
  const b3 = page.locator("[data-address='B3']");

  await drag(page, 'A1', 'B3');
  expect(await a1.getAttribute('class')).toContain('gs-selecting');
  expect(await b2.getAttribute('class')).toContain('gs-selecting');
  expect(await b3.getAttribute('class')).toContain('gs-selecting');
});

test('select by shift, copy and paste', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic-simple--sheet&viewMode=story');
  const a1 = page.locator("[data-address='A1']");
  const b2 = page.locator("[data-address='B2']");
  const b3 = page.locator("[data-address='B3']");
  const b5 = page.locator("[data-address='B5']");
  const c5 = page.locator("[data-address='C5']");
  await a1.click();
  await page.keyboard.down('Shift');
  await b3.click();
  await page.keyboard.up('Shift');
  expect(await a1.getAttribute('class')).toContain('gs-selecting');
  expect(await b2.getAttribute('class')).toContain('gs-selecting');
  expect(await b3.getAttribute('class')).toContain('gs-selecting');

  // Copy A1:B3
  await ctrl(page, 'c');

  // Paste to B5
  await b5.click();
  await paste(page);

  // Verify the paste operation
  expect(await b5.locator('.gs-cell-rendered').textContent()).toBe('A1');
  expect(await c5.locator('.gs-cell-rendered').textContent()).toBe('B1');
});

test('walk', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic-simple--sheet&viewMode=story');
  const a1 = page.locator("[data-address='A1']");
  await a1.click();

  const editor = page.locator('.gs-editor textarea');
  const largeEditor = page.locator('.gs-formula-bar textarea');

  const address = page.locator('.gs-selecting-address');
  expect(await address.textContent()).toBe('A1');
  await editor.press('ArrowDown');
  expect(await address.textContent()).toBe('A2');
  await editor.press('Enter'); // editing
  await editor.press('Enter'); // commit
  expect(await address.textContent()).toBe('A3');
  await editor.press('Tab');
  expect(await address.textContent()).toBe('B3');
  await editor.press('ArrowRight');
  expect(await address.textContent()).toBe('C3');
  await editor.press('ArrowRight');
  expect(await address.textContent()).toBe('D3'); // right edge
  await editor.press('ArrowRight');
  expect(await address.textContent()).toBe('D3'); // cannot go right
  await editor.press('ArrowUp');
  expect(await address.textContent()).toBe('D2');
  await editor.press('ArrowLeft');
  expect(await address.textContent()).toBe('C2');

  // formulabar must not be empty after ENTER
  const b1 = page.locator("[data-address='B1']");
  await b1.dblclick();
  await editor.press('Enter');
  // B2 must be "2"
  expect(await largeEditor.inputValue()).toBe('2');
  await page.locator("[data-address='B5']").click();
});

test('enter key with alt', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic-simple--sheet&viewMode=story');
  const a1 = page.locator("[data-address='A1']");
  await a1.click();

  await page.keyboard.type('HelloWorld');

  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');

  await page.keyboard.down('Alt');
  await page.keyboard.press('Enter');
  await page.keyboard.up('Alt');

  await page.keyboard.press('Enter');
  expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('Hello\nWorld');
});

test('escape key', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic-simple--sheet&viewMode=story');

  await page.keyboard.type('Change');
  await page.keyboard.press('Escape');

  const a1 = page.locator("[data-address='A1']");
  expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('A1');

  const largeEditor = page.locator('.gs-formula-bar textarea');
  expect(await largeEditor.inputValue()).toBe('A1');

  await page.keyboard.type('Change1');
  await page.keyboard.press('Enter');

  await a1.click();
  await page.keyboard.type('Change2');
  await page.keyboard.press('Escape');
  expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('Change1');
  expect(await largeEditor.inputValue()).toBe('Change1');
});

test('rendered cell', async ({ page }) => {
  const largeEditor = page.locator('.gs-formula-bar textarea');
  await page.goto('http://localhost:5233/iframe.html?id=basic-renderer--render-to-kanji&viewMode=story');
  const c5 = page.locator("[data-address='C5']");
  await c5.click();
  expect(await c5.locator('.gs-cell-rendered').textContent()).toBe('五〇〇');
  expect(await largeEditor.inputValue()).toBe('500');

  // undefined renderer
  const a9 = page.locator("[data-address='A9']");
  await a9.click();
  expect(await a9.locator('.gs-cell-rendered').textContent()).toBe('A9');
  expect(await largeEditor.inputValue()).toBe('');

  // fix #97
  const b10 = page.locator("[data-address='B10']");
  expect(await b10.locator('.gs-cell-rendered').textContent()).toBe('一〇,八〇〇');
});
