import { test, expect } from '@playwright/test';

test('cell value', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic--small&viewMode=story');
  const b2 = page.locator("[data-address='B2']");
  expect(await b2.locator('.gs-cell-rendered').textContent()).toContain('b2');

  const b3 = page.locator("[data-address='B3']");
  expect(await b3.locator('.gs-cell-rendered').textContent()).toBe('');
  
  await b3.dblclick();
  const editor = page.locator('.gs-editor textarea');
  await editor.fill('b3');
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
  expect(await largeEditor.inputValue()).toBe('b2');

  expect(await b2.getAttribute('class')).toContain('gs-pointed');

  const hor = page.locator(".gs-header-horizontal[data-x='2']");
  expect(await hor.getAttribute('class')).toContain('gs-pointed');

  const ver = page.locator(".gs-header-vertical[data-y='2']");
  expect(await ver.getAttribute('class')).toContain('gs-pointed');

  const b3 = page.locator("[data-address='B3']");
  expect(await b3.getAttribute('class')).not.toContain('gs-pointed');

});

test('walk', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic--small&viewMode=story');
  const a1 = page.locator("[data-address='A1']");
  await a1.click();

  const address = page.locator('.gs-selecting-address');
  expect(await address.textContent()).toBe('A1');
  const editor = page.locator('.gs-editor textarea');
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
});

test('enter key with alt', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=basic--small&viewMode=story');

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

  const a1 = page.locator("[data-address='A1']");
  expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('Hello\nWorld');
});
