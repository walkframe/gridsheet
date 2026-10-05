import { test, expect } from '@playwright/test';
import { copy, ctrl, drag, go, paste } from './utils';

const STORY = 'restriction-autoexpand--auto-expand';

const setMode = async (page: any, mode: string) => {
  await page.locator(`.mode-selector input[value='${mode}']`).check();
};

const text = (page: any, address: string) =>
  page.locator(`[data-address='${address}'] .gs-cell-rendered`).textContent();

test('paste past the edge grows the sheet, and undo shrinks it back', async ({ page }) => {
  await go(page, STORY);
  await setMode(page, 'both');

  // A1:C3 pasted at C4 on a 5x4 sheet needs rows 4..6 and cols C..E.
  await drag(page, 'A1', 'C3');
  await copy(page);
  await page.locator("[data-address='C4']").click();
  await paste(page);

  expect(await text(page, 'E6')).toBe('z');
  expect(await text(page, 'C4')).toBe('1');
  // The grown rows/cols would sit off-screen, so the grid scrolls the pasted corner into view.
  await expect(page.locator("[data-address='E6']")).toBeInViewport();

  await ctrl(page, 'z');
  await expect(page.locator("[data-address='E6']")).toHaveCount(0);
  await expect(page.locator("[data-address='A6']")).toHaveCount(0);
  expect(await text(page, 'C4')).toBe('');
});

test("paste past the edge is clipped with 'none'", async ({ page }) => {
  await go(page, STORY);
  await setMode(page, 'none');

  await drag(page, 'A1', 'C3');
  await copy(page);
  await page.locator("[data-address='C4']").click();
  await paste(page);

  expect(await text(page, 'D5')).toBe('b');
  await expect(page.locator("[data-address='A6']")).toHaveCount(0);
  // Nothing grew, so nothing scrolled.
  expect(await page.locator('.gs-tabular').evaluate((el) => el.scrollTop)).toBe(0);
  await expect(page.locator("[data-address='E1']")).toHaveCount(0);
});

test("'vertical' grows rows only", async ({ page }) => {
  await go(page, STORY);
  await setMode(page, 'vertical');

  await drag(page, 'A1', 'C3');
  await copy(page);
  await page.locator("[data-address='C4']").click();
  await paste(page);

  expect(await text(page, 'D6')).toBe('c');
  await expect(page.locator("[data-address='E1']")).toHaveCount(0);
});

test('autofill held past the last row adds provisional rows, committed on release', async ({ page }) => {
  await go(page, STORY);
  await setMode(page, 'vertical');

  // Select the 1,2,3 series and drag its fill handle below the grid, then hold.
  await drag(page, 'A1', 'A3');
  const hb = await page.locator("[data-address='A3'] .gs-autofill-drag").boundingBox();
  const tb = await page.locator('.gs-tabular').boundingBox();
  await page.mouse.move(hb!.x + hb!.width / 2, hb!.y + hb!.height / 2);
  await page.mouse.down();
  await page.mouse.move(hb!.x + hb!.width / 2, tb!.y + tb!.height + 20, { steps: 5 });
  // Provisional rows appear one by one (Handsontable-style) — display only, the sheet is untouched.
  await expect(page.locator('.gs-ghost-row').first()).toBeAttached();
  await page.waitForTimeout(1200);
  await expect(page.locator('.gs-root1')).toHaveAttribute('data-rows', '5');
  expect(await page.locator('.gs-ghost-row').count()).toBeGreaterThan(1);
  await page.mouse.up();

  await expect(page.locator('.gs-ghost-cell')).toHaveCount(0);
  // Rows were appended on release and the series continued into them.
  const rows = Number(await page.locator('.gs-root1').getAttribute('data-rows'));
  expect(rows).toBeGreaterThan(6);
  expect(await text(page, `A${rows}`)).toBe(String(rows));

  // One undo removes both the rows and the fill.
  await ctrl(page, 'z');
  await expect(page.locator('.gs-root1')).toHaveAttribute('data-rows', '5');
  await page.locator('.gs-tabular').evaluate((el) => (el.scrollTop = 0));
  expect(await text(page, 'A4')).toBe('');
});

test('provisional rows vanish when the fill is dragged back before release', async ({ page }) => {
  await go(page, STORY);
  await setMode(page, 'vertical');

  await drag(page, 'A1', 'A3');
  const hb = await page.locator("[data-address='A3'] .gs-autofill-drag").boundingBox();
  const tb = await page.locator('.gs-tabular').boundingBox();
  await page.mouse.move(hb!.x + hb!.width / 2, hb!.y + hb!.height / 2);
  await page.mouse.down();
  await page.mouse.move(hb!.x + hb!.width / 2, tb!.y + tb!.height + 20, { steps: 5 });
  await page.waitForTimeout(600);
  // Back onto the selection itself (no fill), then release.
  await page.locator('.gs-tabular').evaluate((el) => (el.scrollTop = 0));
  await page.locator("[data-address='A2']").hover();
  await page.mouse.up();

  await expect(page.locator('.gs-ghost-cell')).toHaveCount(0);
  await expect(page.locator('.gs-root1')).toHaveAttribute('data-rows', '5');
});

for (const dir of ['down', 'right'] as const) {
  test(`leaving an enlarged box before its whitespace fills keeps growing (${dir})`, async ({ page }) => {
    // Regression: with whitespace left in a resized box, exiting the box snapped the target back to
    // the last real row/col (edge scroll handle) and the provisional ghosts stopped growing.
    await page.setViewportSize({ width: 800, height: 700 });
    await go(page, STORY);
    const b = await page.locator('.gs-main').boundingBox();
    await page.mouse.move(b!.x + b!.width - 3, b!.y + b!.height - 3);
    await page.mouse.down();
    await page.mouse.move(b!.x + b!.width + 150, b!.y + b!.height + 230, { steps: 8 });
    await page.mouse.up();

    await page.locator("[data-address='A1']").click();
    const hb = await page.locator("[data-address='A1'] .gs-autofill-drag").boundingBox();
    const tb = await page.locator('.gs-tabular').boundingBox();
    const grid = await page.locator('.gs-tabular-inner').boundingBox();
    await page.mouse.move(hb!.x + 3, hb!.y + 3);
    await page.mouse.down();
    if (dir === 'down') {
      await page.mouse.move(hb!.x + 3, grid!.y + grid!.height + 10, { steps: 5 }); // a little into the whitespace
      await page.mouse.move(hb!.x + 3, tb!.y + tb!.height + 40, { steps: 2 }); // straight out of the box
    } else {
      await page.mouse.move(grid!.x + grid!.width + 10, hb!.y + 3, { steps: 5 });
      await page.mouse.move(tb!.x + tb!.width + 40, hb!.y + 3, { steps: 2 });
    }
    await page.waitForTimeout(1000);
    const ghosts = dir === 'down' ? '.gs-ghost-row' : '.gs-ghost-th-top';
    expect(await page.locator(ghosts).count()).toBeGreaterThan(4);
    await page.mouse.up();
  });
}

test('provisional rows stop growing once the pointer is back over a cell', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 700 });
  await go(page, STORY);
  await setMode(page, 'vertical');

  await drag(page, 'A1', 'A3');
  const hb = await page.locator("[data-address='A3'] .gs-autofill-drag").boundingBox();
  const tb = await page.locator('.gs-tabular').boundingBox();
  await page.mouse.move(hb!.x + 3, hb!.y + 3);
  await page.mouse.down();
  await page.mouse.move(hb!.x + 3, tb!.y + tb!.height + 30, { steps: 4 }); // past the edge: grows
  await page.waitForTimeout(800);
  // Back inside the grid, over a (ghost) cell, and hold still.
  await page.mouse.move(hb!.x + 3, tb!.y + tb!.height - 30, { steps: 3 });
  await page.waitForTimeout(300);
  const settled = await page.locator('.gs-ghost-row').count();
  expect(settled).toBeGreaterThan(1);
  await page.waitForTimeout(1000);
  expect(await page.locator('.gs-ghost-row').count()).toBe(settled);
  await page.mouse.up();
});
