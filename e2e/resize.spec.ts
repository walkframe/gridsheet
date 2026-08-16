import { test, expect } from '@playwright/test';
import { go } from './utils';

/**
 * Regression guard for the row-resize selection-drift bug.
 *
 * A row resize goes through the partial-update path, which must keep the
 * row-height override cache in sync so `getOffsetTop()` stays correct. When it
 * didn't, the DOM cells resized fine (they read cell.height directly) but the
 * canvas choosing overlay — drawn at `getCellRectPositions()` — drifted upward
 * from the actual cell. Here we resize a row, choose a cell below it, and assert
 * the choosing box (COLOR_POINTED = rgb(0,119,255), drawn on the overlay canvas)
 * has its top and bottom borders lined up with the chosen cell's real DOM box.
 */
test('choosing overlay stays aligned with the cell after a row resize', async ({ page }) => {
  await go(page, 'basic-sortfilter--sheet');
  await page.waitForSelector('.gs-initialized');

  // Resize row 2 much taller by dragging its bottom resize handle down.
  const handle = page.locator(`.gs-th-left[data-y='2'] .gs-resizer`).first();
  const box = await handle.boundingBox();
  if (!box) throw new Error('row-2 resize handle not found');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height - 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height - 2 + 60, { steps: 10 });
  await page.mouse.up();
  await page.mouse.move(5, 5);
  await page.waitForTimeout(300);

  // Choose A5 (below the resized row).
  await page.locator(`[data-address='A5']`).first().click();
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    const cell = document.querySelector("[data-address='A5']") as HTMLElement | null;
    if (!canvas || !cell) return null;
    const cr = canvas.getBoundingClientRect();
    const er = cell.getBoundingClientRect();
    const cellTopRel = er.top - cr.top; // A5 top relative to the canvas (CSS px)
    const cellBottomRel = er.bottom - cr.top;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const dpr = canvas.width / cr.width || 1;
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = img;

    // Count pure COLOR_POINTED blue (0,119,255, opaque) per device-row.
    const rowCounts: number[] = new Array(height).fill(0);
    for (let py = 0; py < height; py++) {
      let c = 0;
      for (let px = 0; px < width; px++) {
        const i = (py * width + px) * 4;
        if (data[i] < 20 && data[i + 1] >= 105 && data[i + 1] <= 135 && data[i + 2] >= 245 && data[i + 3] > 240) {
          c++;
        }
      }
      rowCounts[py] = c;
    }
    const maxc = Math.max(...rowCounts);
    // Horizontal border rows: those with a dense run of blue (the box's top/bottom
    // edges), in CSS coords. The narrow vertical side-borders don't qualify.
    const borderRowsCss = rowCounts
      .map((c, y) => ({ y: y / dpr, c }))
      .filter((o) => o.c > maxc * 0.5)
      .map((o) => o.y);
    return { cellTopRel, cellBottomRel, maxc, borderRowsCss };
  });

  expect(result, 'canvas + A5 cell must exist').not.toBeNull();
  expect(result!.maxc, 'choosing box (blue border) must be drawn').toBeGreaterThan(10);
  // The choosing box's top and bottom edges must sit on the real cell (not ~60px
  // above it as in the bug). Tolerance covers the 2px border and anti-aliasing.
  const near = (rows: number[], target: number) => rows.some((y) => Math.abs(y - target) <= 4);
  expect(near(result!.borderRowsCss, result!.cellTopRel), 'box top edge aligns with cell top').toBe(true);
  expect(near(result!.borderRowsCss, result!.cellBottomRel), 'box bottom edge aligns with cell bottom').toBe(true);
});
