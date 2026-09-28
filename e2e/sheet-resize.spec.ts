import { test, expect } from '@playwright/test';
import { go } from './utils';

/**
 * The sheet box carries the CSS `resize` handle on `.gs-main`. A fixed-height,
 * matrix-aligned grid used to cap that element with `max-height: sheetHeight`,
 * which silently blocks dragging the handle DOWN — a box cannot grow past its own
 * max-height — while shrinking still worked. The fix leaves the height uncontrolled
 * (seeded imperatively) so native resize can grow it and the ResizeObserver syncs.
 *
 * Native CSS-resize grips can't be reliably pointer-dragged in Playwright, so this
 * guards the two conditions that were broken: (1) no `max-height` cap pins the box,
 * and (2) an enlarged height sticks instead of being reset by React on re-render.
 */
test('the sheet box has no height cap and keeps an enlarged size', async ({ page }) => {
  await go(page, 'basic-huge--sheet');
  await page.waitForSelector('.gs-initialized');

  const main = page.locator('.gs-main').first();

  // (1) The cap that blocked enlarging is gone; the box is still user-resizable.
  const css = await main.evaluate((el) => {
    const s = getComputedStyle(el as HTMLElement);
    return { maxHeight: s.maxHeight, resize: s.resize, clientHeight: (el as HTMLElement).clientHeight };
  });
  expect(css.maxHeight).toBe('none');
  expect(css.resize).toBe('both');
  const start = css.clientHeight;

  // (2) Growing the box (as the native resize handle would) sticks — React no longer
  // overwrites the height on the ResizeObserver-driven re-render.
  await main.evaluate((el) => {
    (el as HTMLElement).style.height = '820px';
  });
  await page.waitForTimeout(200);
  expect((await main.boundingBox())!.height).toBeGreaterThan(start + 100);

  // Shrinking still works too.
  await main.evaluate((el) => {
    (el as HTMLElement).style.height = '360px';
  });
  await page.waitForTimeout(200);
  expect((await main.boundingBox())!.height).toBeLessThan(500);
});
