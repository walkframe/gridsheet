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

test('autofill dragged past the last row fills the ghost rows', async ({ page }) => {
  await go(page, STORY);
  await setMode(page, 'vertical');

  // Select the 1,2,3 series and drag its fill handle below the grid.
  await drag(page, 'A1', 'A3');
  const handle = page.locator("[data-address='A3'] .gs-autofill-drag");
  const hb = await handle.boundingBox();
  const tb = await page.locator('.gs-tabular').boundingBox();
  await page.mouse.move(hb!.x + hb!.width / 2, hb!.y + hb!.height / 2);
  await page.mouse.down();
  await page.mouse.move(hb!.x + hb!.width / 2, tb!.y + tb!.height - 4, { steps: 5 });
  // Ghost rows are drawn outside the grid, right below its last row, while dragging.
  const ghost = page.locator(".gs-ghost-cell[data-y='8'][data-x='1']");
  await expect(ghost).toBeVisible();
  const gb = await ghost.boundingBox();
  expect(gb!.y).toBeGreaterThanOrEqual(tb!.y + tb!.height - 2); // outside the sheet box
  // Drag down onto the 3rd ghost row (row 8).
  await page.mouse.move(gb!.x + gb!.width / 2, gb!.y + gb!.height / 2, { steps: 4 });
  await page.mouse.up();

  await expect(page.locator('.gs-ghost-cell')).toHaveCount(0);
  // Rows 6..8 were appended and the series continued into them.
  expect(await text(page, 'A8')).toBe('8');
  await expect(page.locator("[data-address='A9']")).toHaveCount(0);

  await ctrl(page, 'z');
  await expect(page.locator("[data-address='A6']")).toHaveCount(0);
  expect(await text(page, 'A5')).toBe('');
});
