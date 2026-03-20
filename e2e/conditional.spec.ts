import { test, expect } from '@playwright/test';

const IF_URL = 'http://localhost:5233/iframe.html?id=formula-conditional--if&viewMode=story';
const IFS_URL = 'http://localhost:5233/iframe.html?id=formula-conditional--ifs&viewMode=story';
const IFNA_URL = 'http://localhost:5233/iframe.html?id=formula-conditional--ifna&viewMode=story';

test.describe('IF', () => {
  test('pass/fail, no-false-branch, and nested IF evaluate correctly', async ({ page }) => {
    await page.goto(IF_URL);
    const sheet = page.locator('[data-sheet-name="IfDemo"]');

    // B column: IF(score >= 60, "Pass", "Fail")
    await expect(sheet.locator("[data-address='B2'] .gs-cell-rendered")).toHaveText('Pass'); // 90 >= 60
    await expect(sheet.locator("[data-address='B3'] .gs-cell-rendered")).toHaveText('Fail'); // 50 < 60
    await expect(sheet.locator("[data-address='B4'] .gs-cell-rendered")).toHaveText('Fail'); //  0 < 60

    // C column: IF(score >= 60, "Pass")  — no false-branch arg
    await expect(sheet.locator("[data-address='C2'] .gs-cell-rendered")).toHaveText('Pass'); // 90 true
    await expect(sheet.locator("[data-address='C3'] .gs-cell-rendered")).toHaveText('FALSE'); // 50 false → FALSE
    await expect(sheet.locator("[data-address='C4'] .gs-cell-rendered")).toHaveText('FALSE'); //  0 false → FALSE

    // D column: nested IF grade
    await expect(sheet.locator("[data-address='D2'] .gs-cell-rendered")).toHaveText('A'); // 90
    await expect(sheet.locator("[data-address='D3'] .gs-cell-rendered")).toHaveText('F'); // 50
    await expect(sheet.locator("[data-address='D4'] .gs-cell-rendered")).toHaveText('F'); //  0
  });
});

test.describe('IFS', () => {
  test('returns value for first matching condition', async ({ page }) => {
    await page.goto(IFS_URL);
    const sheet = page.locator('[data-sheet-name="IfsDemo"]');

    // IFS(score>=90,"A", score>=70,"B", score>=50,"C", score>=0,"F")
    await expect(sheet.locator("[data-address='B2'] .gs-cell-rendered")).toHaveText('A'); // 95
    await expect(sheet.locator("[data-address='B3'] .gs-cell-rendered")).toHaveText('B'); // 75
    await expect(sheet.locator("[data-address='B4'] .gs-cell-rendered")).toHaveText('C'); // 55
    await expect(sheet.locator("[data-address='B5'] .gs-cell-rendered")).toHaveText('F'); // 35
  });
});

test.describe('IFERROR / IFNA', () => {
  const IFERROR_IFNA_URL = 'http://localhost:5233/iframe.html?id=formula-conditional--iferror-ifna&viewMode=story';

  test('IFERROR catches all errors; IFNA catches only #N/A', async ({ page }) => {
    await page.goto(IFERROR_IFNA_URL);
    const sheet = page.locator('[data-sheet-name="IferrorIfnaDemo"]');

    // A2 = #DIV/0! — IFERROR catches it, IFNA does not
    await expect(sheet.locator("[data-address='B2'] .gs-cell-rendered")).toHaveText('div/0 caught');
    await expect(sheet.locator("[data-address='C2'] .gs-cell-rendered")).toHaveText('#DIV/0!');

    // A3 = 42 — neither catches (not an error)
    await expect(sheet.locator("[data-address='B3'] .gs-cell-rendered")).toHaveText('42');
    await expect(sheet.locator("[data-address='C3'] .gs-cell-rendered")).toHaveText('42');

    // A4 = #N/A — both catch it
    await expect(sheet.locator("[data-address='B4'] .gs-cell-rendered")).toHaveText('all errors');
    await expect(sheet.locator("[data-address='C4'] .gs-cell-rendered")).toHaveText('was N/A');
  });
});

test.describe('IFNA', () => {
  test('catches #N/A, passes non-NA values, ignores non-NA errors, handles VLOOKUP miss', async ({ page }) => {
    await page.goto(IFNA_URL);
    const sheet = page.locator('[data-sheet-name="IfnaDemo"]');

    // B2: IFNA(NA(), "was N/A") → "was N/A"
    await expect(sheet.locator("[data-address='B2'] .gs-cell-rendered")).toHaveText('was N/A');
    // B3: IFNA(42, "was N/A") → 42
    await expect(sheet.locator("[data-address='B3'] .gs-cell-rendered")).toHaveText('42');
    // B4: IFNA(1/0, "was N/A") → #DIV/0! (not caught)
    await expect(sheet.locator("[data-address='B4'] .gs-cell-rendered")).toHaveText('#DIV/0!');
    // B10: VLOOKUP("apple", ...) → 100 (found)
    await expect(sheet.locator("[data-address='B10'] .gs-cell-rendered")).toHaveText('100');
    // B11: VLOOKUP("cherry", ...) → #N/A → "Not found"
    await expect(sheet.locator("[data-address='B11'] .gs-cell-rendered")).toHaveText('Not found');
  });
});
