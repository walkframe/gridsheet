import { test, expect } from '@playwright/test';
import type { Page, CDPSession } from '@playwright/test';
import { go } from './utils';

/**
 * Touch gestures (react-core useTouchGestures) on a phone-sized viewport.
 *
 * Taps go through page.touchscreen; drags and long presses need raw touch sequences, which
 * Playwright only exposes through CDP (Chromium) — fine, since the suite runs on Chromium.
 */
test.use({ viewport: { width: 390, height: 664 }, hasTouch: true, isMobile: true });

type Pt = [number, number];

const center = async (page: Page, selector: string): Promise<Pt> => {
  const b = await page.locator(selector).first().boundingBox();
  if (!b) throw new Error(`${selector} not found`);
  return [b.x + b.width / 2, b.y + b.height / 2];
};

const send = (cdp: CDPSession, type: string, points: Pt[]) =>
  cdp.send('Input.dispatchTouchEvent', {
    type: type as 'touchStart' | 'touchMove' | 'touchEnd',
    touchPoints: points.map(([x, y], id) => ({ x, y, id })),
  });

const swipe = async (page: Page, cdp: CDPSession, from: Pt, to: Pt, steps = 10) => {
  await send(cdp, 'touchStart', [from]);
  for (let i = 1; i <= steps; i++) {
    await send(cdp, 'touchMove', [
      [from[0] + ((to[0] - from[0]) * i) / steps, from[1] + ((to[1] - from[1]) * i) / steps],
    ]);
    await page.waitForTimeout(16);
  }
  await send(cdp, 'touchEnd', []);
  await page.waitForTimeout(300);
};

const longPress = async (page: Page, cdp: CDPSession, at: Pt) => {
  await send(cdp, 'touchStart', [at]);
  await page.waitForTimeout(800);
  await send(cdp, 'touchEnd', []);
  await page.waitForTimeout(300);
};

const tap = async (page: Page, selector: string) => {
  await page.touchscreen.tap(...(await center(page, selector)));
  await page.waitForTimeout(250);
};

const doubleTap = async (page: Page, selector: string) => {
  const at = await center(page, selector);
  await page.touchscreen.tap(...at);
  await page.waitForTimeout(60);
  await page.touchscreen.tap(...at);
  await page.waitForTimeout(300);
};

const open = async (page: Page, story: string) => {
  await go(page, story);
  await page.waitForSelector('.gs-initialized');
  await page.waitForTimeout(300);
  return page.context().newCDPSession(page);
};

const selectedCount = (page: Page) => page.locator('.gs-cell.gs-selecting').count();

test('tap selects a cell without opening the soft keyboard', async ({ page }) => {
  await open(page, 'basic-large--sheet');
  await tap(page, "[data-address='B3']");
  await expect(page.locator('.gs-cell.gs-choosing')).toHaveAttribute('data-address', 'B3');
  await expect(page.locator('.gs-editor textarea')).toHaveAttribute('inputmode', 'none');
});

test('double tap edits the cell with the keyboard enabled', async ({ page }) => {
  await open(page, 'basic-simple--sheet');
  await doubleTap(page, "[data-address='A3']");
  await expect(page.locator('.gs-editor.gs-editing')).toHaveCount(1);
  await expect(page.locator('.gs-editor textarea')).not.toHaveAttribute('inputmode', 'none');
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('hello');
  await page.waitForTimeout(100);
  await page.keyboard.press('Enter');
  await expect(page.locator("[data-address='A3'] .gs-cell-rendered")).toHaveText('hello');
});

test('tapping a cell while typing a formula inserts its reference', async ({ page }) => {
  await open(page, 'basic-simple--sheet');
  await doubleTap(page, "[data-address='A4']");
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type('=SUM(');
  await page.waitForTimeout(200);
  await tap(page, "[data-address='A1']");
  await expect(page.locator('.gs-editor textarea')).toHaveValue('=SUM(A1');
});

test('swiping scrolls without moving the selection', async ({ page }) => {
  const cdp = await open(page, 'basic-large--sheet');
  const from = await center(page, "[data-address='B8']");
  await swipe(page, cdp, from, [from[0] - 150, from[1] - 250], 8);
  const top = await page.locator('.gs-tabular').evaluate((el) => el.scrollTop);
  expect(top).toBeGreaterThan(100);
  await expect(page.locator('.gs-cell.gs-choosing')).toHaveAttribute('data-address', 'A1');
});

test('dragging from the cursor cell extends the selection', async ({ page }) => {
  const cdp = await open(page, 'basic-large--sheet');
  await tap(page, "[data-address='B2']");
  await swipe(page, cdp, await center(page, "[data-address='B2']"), await center(page, "[data-address='C5']"));
  expect(await selectedCount(page)).toBe(8);
  await expect(page.locator('.gs-cell.gs-choosing')).toHaveAttribute('data-address', 'B2');
});

test('holding a range drag at the bottom edge auto-scrolls', async ({ page }) => {
  const cdp = await open(page, 'basic-large--sheet');
  await tap(page, "[data-address='A3']");
  const box = (await page.locator('.gs-tabular').boundingBox())!;
  const from = await center(page, "[data-address='A3']");
  const to: Pt = [from[0], box.y + box.height - 5];
  await send(cdp, 'touchStart', [from]);
  for (let i = 1; i <= 10; i++) {
    await send(cdp, 'touchMove', [[from[0], from[1] + ((to[1] - from[1]) * i) / 10]]);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(600);
  await send(cdp, 'touchEnd', []);
  await page.waitForTimeout(300);
  const top = await page.locator('.gs-tabular').evaluate((el) => el.scrollTop);
  expect(top).toBeGreaterThan(100);
  // The selection followed the scroll: the rows now in view are selected.
  expect(await selectedCount(page)).toBeGreaterThan(10);
});

test('dragging from a selected column header extends the column selection', async ({ page }) => {
  const cdp = await open(page, 'basic-large--sheet');
  await tap(page, ".gs-th-top[data-x='2'] .gs-th-inner");
  await swipe(
    page,
    cdp,
    await center(page, ".gs-th-top[data-x='2'] .gs-th-inner"),
    await center(page, ".gs-th-top[data-x='3'] .gs-th-inner"),
  );
  const cols = await page.evaluate(
    () => new Set([...document.querySelectorAll<HTMLElement>('.gs-cell.gs-selecting')].map((e) => e.dataset.x)).size,
  );
  expect(cols).toBe(2);
});

test('long press on a cell opens the context menu', async ({ page }) => {
  const cdp = await open(page, 'basic-large--sheet');
  await longPress(page, cdp, await center(page, "[data-address='B3']"));
  await expect(page.locator('.gs-context-menu-modal')).toHaveCount(1);
  // The pressed cell became the target.
  await expect(page.locator('.gs-cell.gs-choosing')).toHaveAttribute('data-address', 'B3');
});

test('long press on a column header opens the column menu', async ({ page }) => {
  const cdp = await open(page, 'basic-large--sheet');
  await longPress(page, cdp, await center(page, ".gs-th-top[data-x='3'] .gs-th-inner"));
  await expect(page.locator('.gs-column-menu')).toHaveCount(1);
  await expect(page.locator('.gs-context-menu-modal')).toHaveCount(0);
});

test('long press on a row header opens the row menu', async ({ page }) => {
  const cdp = await open(page, 'basic-large--sheet');
  await longPress(page, cdp, await center(page, ".gs-th-left[data-y='4'] .gs-th-inner"));
  await expect(page.locator('.gs-row-menu')).toHaveCount(1);
});

test('dragging a column resizer resizes the column', async ({ page }) => {
  const cdp = await open(page, 'basic-large--sheet');
  const th = page.locator(".gs-th-top[data-x='2']");
  const before = (await th.boundingBox())!.width;
  const r = (await page.locator(".gs-th-top[data-x='2'] .gs-resizer").boundingBox())!;
  const from: Pt = [r.x + r.width / 2, r.y + r.height / 2];
  await swipe(page, cdp, from, [from[0] + 60, from[1]]);
  const after = (await th.boundingBox())!.width;
  expect(after - before).toBeGreaterThan(40);
});

test('dragging the autofill handle fills', async ({ page }) => {
  const cdp = await open(page, 'basic-large--sheet');
  await tap(page, "[data-address='A2']");
  const h = (await page.locator('.gs-cell.gs-choosing .gs-autofill-drag').boundingBox())!;
  await swipe(page, cdp, [h.x + h.width / 2, h.y + h.height / 2], await center(page, "[data-address='A5']"));
  for (const a of ['A3', 'A4', 'A5']) {
    await expect(page.locator(`[data-address='${a}'] .gs-cell-rendered`)).toHaveText('2');
  }
});

test('tapping a checkbox inside a cell still toggles it', async ({ page }) => {
  await open(page, 'basic-sortfilter--sheet');
  const cb = page.locator("[data-address='A2'] input[type=checkbox]");
  const before = await cb.isChecked();
  const b = (await cb.boundingBox())!;
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForTimeout(300);
  expect(await cb.isChecked()).toBe(!before);
});

test('inputs are at least 16px on touch devices (no iOS focus zoom)', async ({ page }) => {
  await open(page, 'basic-large--sheet');
  const sizes = await page.evaluate(() =>
    ['.gs-editor textarea', '.gs-formula-bar textarea'].map((s) =>
      parseFloat(getComputedStyle(document.querySelector(s)!).fontSize),
    ),
  );
  for (const s of sizes) {
    expect(s).toBeGreaterThanOrEqual(16);
  }
});
