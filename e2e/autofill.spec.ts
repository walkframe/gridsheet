import { test, expect } from '@playwright/test';
import { dragAutofill, dragAutofillRange, cut, paste } from './utils';

test('autofill drag and cut paste', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=formula-ref--refs&viewMode=story');

  const c13 = page.locator("[data-address='C13']");
  await c13.click();

  await dragAutofill(page, 'C13', 'E13');

  const d13 = page.locator("[data-address='D13']");
  const e13 = page.locator("[data-address='E13']");

  expect(await d13.locator('.gs-cell-rendered').textContent()).toBe('12');
  expect(await e13.locator('.gs-cell-rendered').textContent()).toBe('14');

  const b9 = page.locator("[data-address='B9']");
  const c9 = page.locator("[data-address='C9']");

  await b9.click();
  await b9.hover();
  await page.mouse.down();
  await c9.hover();
  await page.mouse.up();

  await cut(page);

  const d9 = page.locator("[data-address='D9']");
  await d9.click();
  await paste(page);

  expect(await d13.locator('.gs-cell-rendered').textContent()).toBe('8');
  expect(await e13.locator('.gs-cell-rendered').textContent()).toBe('10');
});

test('autofill range D9:D10 to D13', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=formula-ref--refs&viewMode=story');
  await dragAutofillRange(page, 'D9', 'D10', 'D13');

  const d11 = page.locator("[data-address='D11']");
  const d12 = page.locator("[data-address='D12']");
  const d13 = page.locator("[data-address='D13']");

  expect(await d11.locator('.gs-cell-rendered').textContent()).toBe('9');
  expect(await d12.locator('.gs-cell-rendered').textContent()).toBe('11');
  expect(await d13.locator('.gs-cell-rendered').textContent()).toBe('13');
});
