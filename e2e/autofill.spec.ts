import { test, expect } from '@playwright/test';
import { dragAutofill, dragAutofillRange, cut, go, paste } from './utils';

test('autofill drag and cut paste', async ({ page }) => {
  await go(page, 'formula-ref--refs');

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

test('autofill drag straight down the rightmost column', async ({ page }) => {
  // Regression: the rightmost column's autofill handle sits under the right-edge
  // auto-scroll strip. Dragging it straight down (continuous move, not a teleport hover)
  // must still fill the cells below. J is the last column here.
  await go(page, 'formula-ref--refs');

  const j7 = page.locator("[data-address='J7']");
  await j7.click();

  const handle = j7.locator('.gs-autofill-drag');
  const hb = await handle.boundingBox();
  const cb = await j7.boundingBox();
  const rowH = Math.round(cb!.height);
  // Grab the handle and drag straight down at its own x (the edge case), two rows.
  const gx = Math.round(hb!.x + hb!.width / 2);
  const gy = Math.round(hb!.y + hb!.height / 2);
  await page.mouse.move(gx, gy);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(gx, gy + Math.round((rowH * 2 * i) / 12));
  }
  await page.mouse.up();

  const j8 = page.locator("[data-address='J8']");
  const j9 = page.locator("[data-address='J9']");
  expect(await j8.locator('.gs-cell-rendered').textContent()).toBe('0');
  expect(await j9.locator('.gs-cell-rendered').textContent()).toBe('0');
});

test('autofill range D9:D10 to D13', async ({ page }) => {
  await go(page, 'formula-ref--refs');
  await dragAutofillRange(page, 'D9', 'D10', 'D13');

  const d11 = page.locator("[data-address='D11']");
  const d12 = page.locator("[data-address='D12']");
  const d13 = page.locator("[data-address='D13']");

  expect(await d11.locator('.gs-cell-rendered').textContent()).toBe('9');
  expect(await d12.locator('.gs-cell-rendered').textContent()).toBe('11');
  expect(await d13.locator('.gs-cell-rendered').textContent()).toBe('13');
});
