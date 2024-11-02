import { test, expect } from '@playwright/test';

test('cell value', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic--small&viewMode=story');
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
  await page.goto('http://localhost:5233/iframe.html?id=basic--small&viewMode=story');
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
  await page.goto('http://localhost:5233/iframe.html?id=basic--small&viewMode=story');
  const a1 = page.locator("[data-address='A1']");
  const b2 = page.locator("[data-address='B2']");
  const b3 = page.locator("[data-address='B3']");
  await a1.click();
  await page.locator("[data-address='A1']").hover();
  await page.mouse.down();
  await page.locator("[data-address='B3']").hover();
  await page.mouse.up();
  expect(await a1.getAttribute('class')).toContain('gs-selecting');
  expect(await b2.getAttribute('class')).toContain('gs-selecting');
  expect(await b3.getAttribute('class')).toContain('gs-selecting');
});

test('select by shift, copy and paste', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic--small&viewMode=story');
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
  await page.keyboard.down('Control');
  await page.keyboard.press('c');
  await page.keyboard.up('Control');

  // Paste to B5
  await b5.click();
  await page.keyboard.down('Control');
  await page.keyboard.press('v');
  await page.keyboard.up('Control');

  expect(await b5.locator('.gs-cell-rendered').textContent()).toBe('A1');
  expect(await c5.locator('.gs-cell-rendered').textContent()).toBe('B1');

});


test('walk', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic--small&viewMode=story');
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
  expect(await address.textContent()).toBe('C3');
  await editor.press('ArrowUp');
  expect(await address.textContent()).toBe('C2');
  await editor.press('ArrowLeft');
  expect(await address.textContent()).toBe('B2');

  // formulabar must not be empty after ENTER
  const b1 = page.locator("[data-address='B1']");
  await b1.dblclick();
  await editor.press('Enter');
  // B2 must be "2"
  expect(await largeEditor.inputValue()).toBe('2');
  await page.locator("[data-address='B5']").click();

});

test('enter key with alt', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic--small&viewMode=story');
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
  await page.goto('http://localhost:5233/iframe.html?id=basic--small&viewMode=story');

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
