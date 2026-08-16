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

test('autofill with edge auto-scroll can be released and cleared', async ({ page }) => {
  // Regression: dragging the autofill handle past the bottom edge starts the built-in
  // edge auto-scroll (ScrollHandle). Its rAF loop re-dispatched setAutofillDraggingTo
  // every frame from a stale closure, so when the drag ended off the strip (release on a
  // cell, or the strip hid at the very bottom) the loop kept running: the selection could
  // never be cleared and the grid could not be scrolled back up. The loop must stop once
  // the drag ends (no dragging / no autofillDraggingTo in the live store).
  await go(page, 'basic-large--sheet');

  const tabular = page.locator('.gs-tabular');
  const tb = (await tabular.boundingBox())!;
  const maxScroll = await tabular.evaluate((el) => el.scrollHeight - el.clientHeight);

  // Start an autofill from a visible cell in column A (deterministic IDs 1..2000).
  const a3 = page.locator("[data-address='A3']");
  await a3.click();
  const handle = a3.locator('.gs-autofill-drag');
  const hb = (await handle.boundingBox())!;
  const gx = Math.round(hb.x + hb.width / 2);
  await page.mouse.move(gx, Math.round(hb.y + hb.height / 2));
  await page.mouse.down();

  // Park the cursor on the 5px bottom auto-scroll strip and let it run all the way to the
  // very bottom. There the bottom strip hides (cannotScrollHere) and drops its mouse
  // handlers, so it can no longer stop itself — the exact state that used to orphan the
  // rAF loop. The loop self-reschedules, so one move onto the strip is enough.
  await page.mouse.move(gx, Math.round(tb.y + tb.height - 3));
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(150);
    const top = await tabular.evaluate((el) => (el as HTMLElement).scrollTop);
    if (top >= maxScroll - 1) {
      break;
    }
  }
  expect(await tabular.evaluate((el) => (el as HTMLElement).scrollTop)).toBeGreaterThanOrEqual(maxScroll - 1);

  // Release (the strip is hidden here now, so this lands on the cell underneath).
  await page.mouse.up();

  // The grid must scroll back up and STAY there — pre-fix the orphaned loop kept
  // scrolling it back down every frame (and re-arming the autofill), so this bounced.
  await tabular.evaluate((el) => ((el as HTMLElement).scrollTop = 0));
  await page.waitForTimeout(500);
  expect(await tabular.evaluate((el) => (el as HTMLElement).scrollTop)).toBe(0);

  // And a plain click selects another cell (autofillDraggingTo is cleared, not blocking).
  const a2 = page.locator("[data-address='A2']");
  await a2.click();
  expect(await a2.getAttribute('class')).toContain('gs-choosing');
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
