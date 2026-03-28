import { test, expect } from '@playwright/test';
import { ctrl, drag, copy, cut, paste } from './utils';

const STORY_URL = 'http://localhost:5233/iframe.html?id=basic-sortfilter--sheet&viewMode=story';

/** Open the column menu for a given column (1-based x) */
async function openColumnMenu(page: any, x: number) {
  const th = page.locator(`.gs-th-top[data-x='${x}']`);
  await th.hover();
  const menuBtn = th.locator('.gs-column-menu-btn');
  await menuBtn.click();
  // Wait for the column menu to appear
  await page.waitForSelector('.gs-column-menu', { state: 'visible' });
}

/** Close the column menu by clicking the modal backdrop */
async function closeColumnMenu(page: any) {
  await page.locator('.gs-column-menu-modal').click({ position: { x: 0, y: 0 } });
  await page.waitForSelector('.gs-column-menu', { state: 'hidden' }).catch(() => {});
}

/** Helper to get rendered text of a cell */
async function cellText(page: any, address: string) {
  return page.locator(`[data-address='${address}'] .gs-cell-rendered`).textContent();
}

/** Helper to get all visible values in column B (Name) for rows 1-5 */
async function getVisibleNames(page: any) {
  const values: string[] = [];
  for (let row = 1; row <= 5; row++) {
    const cell = page.locator(`[data-address='B${row}']`);
    const isVisible = await cell.isVisible().catch(() => false);
    if (isVisible) {
      values.push(await cell.locator('.gs-cell-rendered').textContent());
    }
  }
  return values;
}

test.describe('Sort & Filter', () => {
  test('sort ascending, descending, undo and redo by Score column', async ({ page }) => {
    await page.goto(STORY_URL);
    await page.waitForSelector('.gs-initialized');

    // Original order: Alice(90), Bob(75), Charlie(60), Diana(85), Eve(40)
    expect(await cellText(page, 'B1')).toBe('Alice');
    expect(await cellText(page, 'B5')).toBe('Eve');

    // ---- Sort ascending ----
    await openColumnMenu(page, 3);
    const sortAsc = page.locator('.gs-column-menu .gs-sort-btn-asc');
    await sortAsc.click();

    // After ascending sort by Score: Eve(40), Charlie(60), Bob(75), Diana(85), Alice(90)
    expect(await cellText(page, 'B1')).toBe('Eve');
    expect(await cellText(page, 'C1')).toContain('40');
    expect(await cellText(page, 'B2')).toBe('Charlie');
    expect(await cellText(page, 'C2')).toContain('60');
    expect(await cellText(page, 'B3')).toBe('Bob');
    expect(await cellText(page, 'C3')).toContain('75');
    expect(await cellText(page, 'B4')).toBe('Diana');
    expect(await cellText(page, 'C4')).toContain('85');
    expect(await cellText(page, 'B5')).toBe('Alice');
    expect(await cellText(page, 'C5')).toContain('90');

    // ---- Undo / Redo ----
    await ctrl(page, 'z');
    expect(await cellText(page, 'B1')).toBe('Alice');

    await ctrl(page, 'z', true);
    expect(await cellText(page, 'B1')).toBe('Eve');

    // Reset to original order for next section
    await ctrl(page, 'z');

    // ---- Sort descending ----
    await openColumnMenu(page, 3);
    const sortDesc = page.locator('.gs-column-menu .gs-sort-btn-desc');
    await sortDesc.click();

    // After descending sort by Score: Alice(90), Diana(85), Bob(75), Charlie(60), Eve(40)
    expect(await cellText(page, 'B1')).toBe('Alice');
    expect(await cellText(page, 'C1')).toContain('90');
    expect(await cellText(page, 'B2')).toBe('Diana');
    expect(await cellText(page, 'C2')).toContain('85');
    expect(await cellText(page, 'B5')).toBe('Eve');
    expect(await cellText(page, 'C5')).toContain('40');
  });

  test('filter by equals', async ({ page }) => {
    await page.goto(STORY_URL);
    await page.waitForSelector('.gs-initialized');

    // Open column menu for column D (Grade, x=4)
    await openColumnMenu(page, 4);

    // Set filter method to '=' (eq) and value to 'A'
    const methodSelect = page.locator('.gs-filter-method-select').first();
    await methodSelect.selectOption('eq');

    const valueInput = page.locator('.gs-filter-value-input').first();
    await valueInput.fill('A');

    // Click APPLY
    await page.locator('.gs-filter-apply-btn').click();

    // Only Alice(A) and Diana(A) should be visible
    const visibleNames = await getVisibleNames(page);
    expect(visibleNames).toContain('Alice');
    expect(visibleNames).toContain('Diana');
    expect(visibleNames).not.toContain('Bob');
    expect(visibleNames).not.toContain('Charlie');
    expect(visibleNames).not.toContain('Eve');
  });

  test('filter undo restores all rows', async ({ page }) => {
    await page.goto(STORY_URL);
    await page.waitForSelector('.gs-initialized');

    // Apply filter: Grade (column D, x=4) = 'A' → only Alice and Diana visible
    await openColumnMenu(page, 4);
    const methodSelect = page.locator('.gs-filter-method-select').first();
    await methodSelect.selectOption('eq');
    const valueInput = page.locator('.gs-filter-value-input').first();
    await valueInput.fill('A');
    await page.locator('.gs-filter-apply-btn').click();

    // Verify filter is applied: Bob, Charlie, Eve are hidden
    let visibleNames = await getVisibleNames(page);
    expect(visibleNames).toContain('Alice');
    expect(visibleNames).toContain('Diana');
    expect(visibleNames).not.toContain('Bob');
    expect(visibleNames).not.toContain('Charlie');
    expect(visibleNames).not.toContain('Eve');

    // Undo the filter
    await ctrl(page, 'z');

    // All rows should be visible again
    visibleNames = await getVisibleNames(page);
    expect(visibleNames).toContain('Alice');
    expect(visibleNames).toContain('Bob');
    expect(visibleNames).toContain('Charlie');
    expect(visibleNames).toContain('Diana');
    expect(visibleNames).toContain('Eve');

    // Redo should re-apply the filter
    await ctrl(page, 'z', true);
    visibleNames = await getVisibleNames(page);
    expect(visibleNames).toContain('Alice');
    expect(visibleNames).toContain('Diana');
    expect(visibleNames).not.toContain('Bob');
    expect(visibleNames).not.toContain('Charlie');
    expect(visibleNames).not.toContain('Eve');
  });

  test('filter by contains', async ({ page }) => {
    await page.goto(STORY_URL);
    await page.waitForSelector('.gs-initialized');

    // Open column menu for column B (Name, x=2)
    await openColumnMenu(page, 2);

    // Set filter method to 'Includes' and value to 'li'
    const methodSelect = page.locator('.gs-filter-method-select').first();
    await methodSelect.selectOption('includes');

    const valueInput = page.locator('.gs-filter-value-input').first();
    await valueInput.fill('li');

    // Click APPLY
    await page.locator('.gs-filter-apply-btn').click();

    // 'Alice' and 'Charlie' contain 'li'
    const visibleNames = await getVisibleNames(page);
    expect(visibleNames).toContain('Alice');
    expect(visibleNames).toContain('Charlie');
    expect(visibleNames).not.toContain('Bob');
    expect(visibleNames).not.toContain('Diana');
    expect(visibleNames).not.toContain('Eve');
  });

  test('filter with multiple conditions (AND)', async ({ page }) => {
    await page.goto(STORY_URL);
    await page.waitForSelector('.gs-initialized');

    // Open column menu for column C (Score, x=3)
    await openColumnMenu(page, 3);

    // First condition: >= 60
    const methodSelect1 = page.locator('.gs-filter-method-select').first();
    await methodSelect1.selectOption('gte');
    const valueInput1 = page.locator('.gs-filter-value-input').first();
    await valueInput1.fill('60');

    // Add a second condition
    await page.locator('.gs-filter-add-btn').click();

    // Second condition: <= 85
    const methodSelect2 = page.locator('.gs-filter-method-select').nth(1);
    await methodSelect2.selectOption('lte');
    const valueInput2 = page.locator('.gs-filter-value-input').nth(1);
    await valueInput2.fill('85');

    // Switch to AND mode
    const andRadio = page.locator('.gs-filter-mode-toggle label').first();
    await andRadio.click();

    // Click APPLY
    await page.locator('.gs-filter-apply-btn').click();

    // Score between 60 and 85 (inclusive): Bob(75), Charlie(60), Diana(85)
    const visibleNames = await getVisibleNames(page);
    expect(visibleNames).toContain('Bob');
    expect(visibleNames).toContain('Charlie');
    expect(visibleNames).toContain('Diana');
    expect(visibleNames).not.toContain('Alice'); // 90 > 85
    expect(visibleNames).not.toContain('Eve'); // 40 < 60
  });

  test('filter boolean column (Active = true and Active = false)', async ({ page }) => {
    await page.goto(STORY_URL);
    await page.waitForSelector('.gs-initialized');

    // ---- Active = true ----
    // Column A (Active, x=1): true, false, true, true, false
    await openColumnMenu(page, 1);
    const methodSelect = page.locator('.gs-filter-method-select').first();
    await methodSelect.selectOption('eq');
    const valueInput = page.locator('.gs-filter-value-input').first();
    await valueInput.fill('true');
    await page.locator('.gs-filter-apply-btn').click();

    // Active=true: Alice, Charlie, Diana
    let visibleNames = await getVisibleNames(page);
    expect(visibleNames).toContain('Alice');
    expect(visibleNames).toContain('Charlie');
    expect(visibleNames).toContain('Diana');
    expect(visibleNames).not.toContain('Bob');
    expect(visibleNames).not.toContain('Eve');

    // Reset filter on column A
    await openColumnMenu(page, 1);
    await page.locator('.gs-filter-reset-btn').click();
    await page.waitForTimeout(300);

    // ---- Active = false ----
    await openColumnMenu(page, 1);
    const methodSelect2 = page.locator('.gs-filter-method-select').first();
    await methodSelect2.selectOption('eq');
    const valueInput2 = page.locator('.gs-filter-value-input').first();
    await valueInput2.fill('false');
    await page.locator('.gs-filter-apply-btn').click();

    // Active=false: Bob, Eve
    visibleNames = await getVisibleNames(page);
    expect(visibleNames).toContain('Bob');
    expect(visibleNames).toContain('Eve');
    expect(visibleNames).not.toContain('Alice');
    expect(visibleNames).not.toContain('Charlie');
    expect(visibleNames).not.toContain('Diana');
  });

  test('label edit via column menu', async ({ page }) => {
    await page.goto(STORY_URL);
    await page.waitForSelector('.gs-initialized');

    // Column B header should show "Name"
    const thB = page.locator(`.gs-th-top[data-x='2'] .gs-th-inner`);
    expect(await thB.textContent()).toContain('Name');

    // Open column menu for column B (x=2)
    await openColumnMenu(page, 2);

    // Change label
    const labelInput = page.locator('.gs-label-input');
    await labelInput.fill('Full Name');
    await page.locator('.gs-label-apply-btn').click();

    // Verify the header changed
    expect(await thB.textContent()).toContain('Full Name');

    // Undo
    await ctrl(page, 'z');
    expect(await thB.textContent()).toContain('Name');
  });

  // -----------------------------------------------------------------------
  // Filter + operation tests
  // Setup: filter Score >= 75 → visible: Alice(row1), Bob(row2), Diana(row4)
  //                             hidden:  Charlie(row3), Eve(row5)
  // -----------------------------------------------------------------------

  async function applyScoreGteFilter(page: any) {
    await openColumnMenu(page, 3); // Column C = Score
    const methodSelect = page.locator('.gs-filter-method-select').first();
    await methodSelect.selectOption('gte');
    const valueInput = page.locator('.gs-filter-value-input').first();
    await valueInput.fill('75');
    await page.locator('.gs-filter-apply-btn').click();
    await page.waitForTimeout(500);
  }

  async function resetScoreFilter(page: any) {
    await openColumnMenu(page, 3); // Column C = Score
    await page.locator('.gs-filter-reset-btn').click();
    await page.waitForTimeout(500);
  }

  test('delete skips filtered rows', async ({ page }) => {
    await page.goto(STORY_URL);
    await page.waitForSelector('.gs-initialized');

    await applyScoreGteFilter(page);
    await drag(page, 'B1', 'B4'); // select all visible rows in column B (B1, B4)
    await page.keyboard.press('Delete');
    await resetScoreFilter(page);

    // Visible rows B1, B2, B4 should be cleared
    expect(await cellText(page, 'B1')).toBe('');
    expect(await cellText(page, 'B2')).toBe('');
    expect(await cellText(page, 'B4')).toBe('');

    // Hidden rows B3, B5 should be untouched
    expect(await cellText(page, 'B3')).toBe('Charlie');
    expect(await cellText(page, 'B5')).toBe('Eve');
  });

  test('copy-paste skips filtered rows (src and dst)', async ({ page }) => {
    await page.goto(STORY_URL);
    await page.waitForSelector('.gs-initialized');

    await applyScoreGteFilter(page);
    await drag(page, 'B1', 'B4'); // select visible rows B1, B2, B4 (B3 hidden)
    await copy(page);

    await page.locator("[data-address='D2']").click();
    await paste(page);
    await resetScoreFilter(page);

    // D2 (visible) ← Alice, D3 (hidden, skip), D4 (visible) ← Bob
    expect(await cellText(page, 'D2')).toBe('Alice');
    expect(await cellText(page, 'D3')).toBe('C'); // untouched (hidden)
    expect(await cellText(page, 'D4')).toBe('Bob');
    expect(await cellText(page, 'D5')).toBe('D'); // untouched (hidden)
  });

  test('cut-paste skips filtered rows (src and dst)', async ({ page }) => {
    await page.goto(STORY_URL);
    await page.waitForSelector('.gs-initialized');

    await applyScoreGteFilter(page);

    await drag(page, 'B1', 'B4');
    await cut(page);

    await page.locator("[data-address='D2']").click();
    await paste(page);
    await resetScoreFilter(page);

    // Pasted into visible dst rows
    expect(await cellText(page, 'D2')).toBe('Alice');
    expect(await cellText(page, 'D3')).toBe('C'); // untouched (hidden)
    expect(await cellText(page, 'D4')).toBe('Bob');

    // Visible src rows should be cleared
    expect(await cellText(page, 'B1')).toBe('');
    expect(await cellText(page, 'B2')).toBe('');
    expect(await cellText(page, 'B4')).toBe('');

    // Hidden src rows must be untouched
    expect(await cellText(page, 'B3')).toBe('Charlie');
    expect(await cellText(page, 'B5')).toBe('Eve');
  });

  test('summary row stays fixed during filter and sort', async ({ page }) => {
    await page.goto(STORY_URL);
    await page.waitForSelector('.gs-initialized');

    // Initial state: Total row at row 6, SUM(C1:C5) = 350
    expect(await cellText(page, 'B6')).toBe('Total');
    expect(await cellText(page, 'C6')).toContain('350');

    // --- Apply filter: Score (column C, x=3) >= 75 ---
    await openColumnMenu(page, 3);
    const methodSelect = page.locator('.gs-filter-method-select').first();
    await methodSelect.selectOption('gte');
    const valueInput = page.locator('.gs-filter-value-input').first();
    await valueInput.fill('75');
    await page.locator('.gs-filter-apply-btn').click();
    await page.waitForTimeout(300);

    // filterFixed row 6 must remain visible
    expect(await page.locator("[data-address='B6']").isVisible()).toBe(true);
    expect(await cellText(page, 'B6')).toBe('Total');

    // Charlie(60) and Eve(40) are hidden by filter
    expect(await page.locator("[data-address='B3']").isVisible()).toBe(false);
    expect(await page.locator("[data-address='B5']").isVisible()).toBe(false);

    // --- Clear filter ---
    await openColumnMenu(page, 3);
    await page.locator('.gs-filter-reset-btn').click();
    await page.waitForTimeout(300);

    // All data rows visible again
    expect(await page.locator("[data-address='B3']").isVisible()).toBe(true);
    expect(await page.locator("[data-address='B5']").isVisible()).toBe(true);

    // --- Sort ascending by Score (column C, x=3) ---
    await openColumnMenu(page, 3);
    await page.locator('.gs-column-menu .gs-sort-btn-asc').click();

    // Data rows sorted ascending: Eve(40), Charlie(60), Bob(75), Diana(85), Alice(90)
    expect(await cellText(page, 'B1')).toBe('Eve');
    expect(await cellText(page, 'B2')).toBe('Charlie');
    expect(await cellText(page, 'B3')).toBe('Bob');
    expect(await cellText(page, 'B4')).toBe('Diana');
    expect(await cellText(page, 'B5')).toBe('Alice');

    // sortFixed row 6 stays at the bottom
    expect(await cellText(page, 'B6')).toBe('Total');
    expect(await cellText(page, 'C6')).toContain('350');
  });
});
