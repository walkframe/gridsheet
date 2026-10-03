import { test, expect } from '@playwright/test';
import { ctrl, go } from './utils';

const cell = (page: any, address: string) => page.locator(`[data-address='${address}']`);
const rendered = (page: any, address: string) => cell(page, address).locator('.gs-cell-rendered');

test('renders merges: the host spans the range, covered cells are empty', async ({ page }) => {
  await go(page, 'basic-merge--sheet');
  await expect(cell(page, 'B2')).toHaveClass(/gs-merged-host/);
  await expect(cell(page, 'C2')).toHaveClass(/gs-merged-covered/);
  await expect(cell(page, 'D3')).toHaveClass(/gs-merged-covered/);
  await expect(cell(page, 'E2')).not.toHaveClass(/gs-merged/);
  expect(await rendered(page, 'B2').textContent()).toBe('Merged B2:D3');

  // The host's content box covers B2:D3 (3 columns x 2 rows).
  const wrap = await cell(page, 'B2').locator('.gs-cell-inner-wrap').boundingBox();
  const b2 = await cell(page, 'B2').boundingBox();
  const d3 = await cell(page, 'D3').boundingBox();
  expect(Math.abs(wrap!.x + wrap!.width - (d3!.x + d3!.width))).toBeLessThanOrEqual(2);
  expect(Math.abs(wrap!.y + wrap!.height - (d3!.y + d3!.height))).toBeLessThanOrEqual(2);
  expect(wrap!.width).toBeGreaterThan(b2!.width * 2.5);
});

test('pointing a covered cell chooses the anchor; arrows step over the merge', async ({ page }) => {
  await go(page, 'basic-merge--sheet');
  const address = page.locator('.gs-selecting-address');

  await cell(page, 'C3').click({ force: true });
  await expect(address).toHaveText('B2');

  await page.keyboard.press('ArrowDown');
  await expect(address).toHaveText('B4');
  await page.keyboard.press('ArrowUp');
  await expect(address).toHaveText('B2');
  await page.keyboard.press('ArrowRight');
  await expect(address).toHaveText('E2');
  await page.keyboard.press('ArrowLeft');
  await expect(address).toHaveText('B2');

  // Typing edits the anchor, and Enter then walks over the covered rows.
  await page.keyboard.type('x');
  await page.keyboard.press('Enter');
  expect(await rendered(page, 'B2').textContent()).toBe('x');
  await expect(address).toHaveText('B4');
});

test('a selection grows to include every merge it touches', async ({ page }) => {
  await go(page, 'basic-merge--sheet');
  await cell(page, 'A1').click();
  await page.keyboard.down('Shift');
  await cell(page, 'C2').click({ force: true });
  await page.keyboard.up('Shift');
  // A1:C2 cuts through B2:D3, so it becomes A1:D3.
  await expect(cell(page, 'A3')).toHaveClass(/gs-selecting/);
  await expect(cell(page, 'D1')).toHaveClass(/gs-selecting/);
  await expect(cell(page, 'E1')).not.toHaveClass(/gs-selecting/);
});

test('merge and unmerge from the context menu, with undo/redo', async ({ page }) => {
  await go(page, 'basic-merge--sheet');
  const sum = rendered(page, 'A8');
  expect(await sum.textContent()).toBe('78');

  await cell(page, 'A5').click();
  await page.keyboard.down('Shift');
  await cell(page, 'B6').click();
  await page.keyboard.up('Shift');
  await cell(page, 'B6').click({ button: 'right' });
  await page.getByText('Merge cells', { exact: true }).click();

  await expect(cell(page, 'A5')).toHaveClass(/gs-merged-host/);
  await expect(cell(page, 'B6')).toHaveClass(/gs-merged-covered/);
  expect(await rendered(page, 'A5').textContent()).toBe('1');
  // B5 (2), A6 (5), B6 (6) were discarded.
  expect(await sum.textContent()).toBe('65');

  await ctrl(page, 'z');
  await expect(cell(page, 'A5')).not.toHaveClass(/gs-merged/);
  expect(await rendered(page, 'B6').textContent()).toBe('6');
  expect(await sum.textContent()).toBe('78');

  await ctrl(page, 'y');
  await expect(cell(page, 'A5')).toHaveClass(/gs-merged-host/);

  // Unmerge: the anchor keeps its value, the rest stays empty.
  await cell(page, 'A5').click({ button: 'right' });
  await page.getByText('Unmerge cells', { exact: true }).click();
  await expect(cell(page, 'A5')).not.toHaveClass(/gs-merged/);
  expect(await rendered(page, 'A5').textContent()).toBe('1');
  expect(await rendered(page, 'B6').textContent()).toBe('');
});

test('a merge stays drawn after its anchor scrolls out of view', async ({ page }) => {
  await go(page, 'basic-merge--sheet');
  await cell(page, 'A1').waitFor();
  await page.evaluate(() => {
    document.querySelector('.gs-tabular')!.scrollTop = 72;
  });
  // F2 / F3 are out of the rendered window; the first rendered row of F2:F6 hosts it.
  const host = page.locator('.gs-merged-host', { hasText: 'Tall F2:F6' });
  await expect(host).toHaveCount(1);
});

test('shift+arrow, mouse drag and Tab respect merges', async ({ page }) => {
  await go(page, 'basic-merge--sheet');
  const address = page.locator('.gs-selecting-address');

  await cell(page, 'A1').click();
  await page.keyboard.press('Shift+ArrowDown');
  await page.keyboard.press('Shift+ArrowRight');
  // A1:B2 touches B2:D3 → A1:D3.
  await expect(cell(page, 'A3')).toHaveClass(/gs-selecting/);
  await expect(cell(page, 'D1')).toHaveClass(/gs-selecting/);
  await expect(cell(page, 'E1')).not.toHaveClass(/gs-selecting/);

  // Mouse drag from E4 into the merge grows the selection over the merge.
  await cell(page, 'E4').hover();
  await page.mouse.down();
  await cell(page, 'C3').hover({ force: true });
  await page.mouse.up();
  await expect(cell(page, 'B4')).toHaveClass(/gs-selecting/);
  await expect(cell(page, 'E2')).toHaveClass(/gs-selecting/);
  await expect(cell(page, 'A4')).not.toHaveClass(/gs-selecting/);

  // Tab walks over the covered columns.
  await cell(page, 'A2').click();
  await page.keyboard.press('Tab');
  await expect(address).toHaveText('B2');
  await page.keyboard.press('Tab');
  await expect(address).toHaveText('E2');
  await page.keyboard.press('Shift+Tab');
  await expect(address).toHaveText('B2');
});

test('Merge prevention disables merging and unmerging', async ({ page }) => {
  await go(page, 'basic-merge--sheet');
  const menuItem = (label: string) => page.locator('.gs-menu-item', { hasText: label }).first();
  // Clicking anywhere outside the menu (on its backdrop) closes it.
  const closeMenu = async () => {
    if ((await page.locator('.gs-context-menu').count()) > 0) {
      await page.mouse.click(5, 5);
    }
    await expect(page.locator('.gs-context-menu')).toHaveCount(0);
  };

  // G2:H3 contains H2 (prevention: Merge).
  await cell(page, 'G2').click();
  await page.keyboard.down('Shift');
  await cell(page, 'H3').click();
  await page.keyboard.up('Shift');
  await cell(page, 'H3').click({ button: 'right' });
  await expect(menuItem('Merge cells')).toHaveClass(/gs-disabled/);
  await menuItem('Merge cells').click({ force: true });
  await expect(cell(page, 'G2')).not.toHaveClass(/gs-merged/);
  await closeMenu();

  // A range without protected cells can still be merged.
  await cell(page, 'G8').click();
  await page.keyboard.down('Shift');
  await cell(page, 'H8').click();
  await page.keyboard.up('Shift');
  await cell(page, 'H8').click({ button: 'right' });
  await expect(menuItem('Merge cells')).toHaveClass(/gs-enabled/);
  await closeMenu();

  // H5:I6 is anchored on a Merge-protected cell, so it cannot be unmerged.
  await cell(page, 'H5').click();
  await cell(page, 'H5').click({ button: 'right' });
  await expect(menuItem('Unmerge cells')).toHaveClass(/gs-disabled/);
  await menuItem('Unmerge cells').click({ force: true });
  await expect(cell(page, 'H5')).toHaveClass(/gs-merged-host/);
});
