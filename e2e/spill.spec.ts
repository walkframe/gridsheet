import { test, expect } from '@playwright/test';

const SEQUENCE_URL = 'http://localhost:5233/iframe.html?id=formula-spill--spill-sequence&viewMode=story';
const BLOCKED_URL = 'http://localhost:5233/iframe.html?id=formula-spill--spill-blocked&viewMode=story';

// Expected cell values for SEQUENCE(4), SEQUENCE(3,2), SEQUENCE(3,3,10,5)
// -------------------------------------------------------------------------
// A1:A4  → SEQUENCE(4)          : 1, 2, 3, 4
// C1:D3  → SEQUENCE(3, 2)       : 1, 2 / 3, 4 / 5, 6
// F1:H3  → SEQUENCE(3, 3, 10, 5): 10, 15, 20 / 25, 30, 35 / 40, 45, 50

test.describe('Spill — SEQUENCE vs DELAY_SEQUENCE', () => {
  test('sync SEQUENCE and async DELAY_SEQUENCE spill correct identical values', async ({ page }) => {
    await page.goto(SEQUENCE_URL);

    const syncSheet = page.locator('[data-sheet-name="SpillSync"]');
    const asyncSheet = page.locator('[data-sheet-name="SpillAsync"]');

    // Wait for the async spill to resolve (timeout covers the 0.5 s delay + rendering)
    await expect(asyncSheet.locator("[data-address='A2'] .gs-cell-rendered")).toHaveText('1', {
      timeout: 3000,
    });

    // --- SpillSync: SEQUENCE(4) — 1-D column
    await expect(syncSheet.locator("[data-address='A2'] .gs-cell-rendered")).toHaveText('1');
    await expect(syncSheet.locator("[data-address='A3'] .gs-cell-rendered")).toHaveText('2');
    await expect(syncSheet.locator("[data-address='A4'] .gs-cell-rendered")).toHaveText('3');
    await expect(syncSheet.locator("[data-address='A5'] .gs-cell-rendered")).toHaveText('4');
    // SEQUENCE(3, 2) — 3×2 matrix
    await expect(syncSheet.locator("[data-address='C2'] .gs-cell-rendered")).toHaveText('1');
    await expect(syncSheet.locator("[data-address='D2'] .gs-cell-rendered")).toHaveText('2');
    await expect(syncSheet.locator("[data-address='C3'] .gs-cell-rendered")).toHaveText('3');
    await expect(syncSheet.locator("[data-address='D3'] .gs-cell-rendered")).toHaveText('4');
    await expect(syncSheet.locator("[data-address='C4'] .gs-cell-rendered")).toHaveText('5');
    await expect(syncSheet.locator("[data-address='D4'] .gs-cell-rendered")).toHaveText('6');
    // SEQUENCE(3, 3, 10, 5) — 3×3 matrix starting at 10 with step 5
    await expect(syncSheet.locator("[data-address='F2'] .gs-cell-rendered")).toHaveText('10');
    await expect(syncSheet.locator("[data-address='G2'] .gs-cell-rendered")).toHaveText('15');
    await expect(syncSheet.locator("[data-address='H2'] .gs-cell-rendered")).toHaveText('20');
    await expect(syncSheet.locator("[data-address='F3'] .gs-cell-rendered")).toHaveText('25');
    await expect(syncSheet.locator("[data-address='G3'] .gs-cell-rendered")).toHaveText('30');
    await expect(syncSheet.locator("[data-address='H3'] .gs-cell-rendered")).toHaveText('35');
    await expect(syncSheet.locator("[data-address='F4'] .gs-cell-rendered")).toHaveText('40');
    await expect(syncSheet.locator("[data-address='G4'] .gs-cell-rendered")).toHaveText('45');
    await expect(syncSheet.locator("[data-address='H4'] .gs-cell-rendered")).toHaveText('50');
    // SEQUENCE(1, 4) at J2 — spills rightward; only J2 is within bounds (10 cols total)
    await expect(syncSheet.locator("[data-address='J2'] .gs-cell-rendered")).toHaveText('1');
    // SUM(C2:D4) — sum of the SEQUENCE(3,2) spill range: 1+2+3+4+5+6 = 21
    await expect(syncSheet.locator("[data-address='C10'] .gs-cell-rendered")).toHaveText('21');

    // --- SpillAsync: DELAY_SEQUENCE — same values expected
    await expect(asyncSheet.locator("[data-address='A2'] .gs-cell-rendered")).toHaveText('1');
    await expect(asyncSheet.locator("[data-address='A3'] .gs-cell-rendered")).toHaveText('2');
    await expect(asyncSheet.locator("[data-address='A4'] .gs-cell-rendered")).toHaveText('3');
    await expect(asyncSheet.locator("[data-address='A5'] .gs-cell-rendered")).toHaveText('4');
    await expect(asyncSheet.locator("[data-address='C2'] .gs-cell-rendered")).toHaveText('1');
    await expect(asyncSheet.locator("[data-address='D2'] .gs-cell-rendered")).toHaveText('2');
    await expect(asyncSheet.locator("[data-address='C3'] .gs-cell-rendered")).toHaveText('3');
    await expect(asyncSheet.locator("[data-address='D3'] .gs-cell-rendered")).toHaveText('4');
    await expect(asyncSheet.locator("[data-address='C4'] .gs-cell-rendered")).toHaveText('5');
    await expect(asyncSheet.locator("[data-address='D4'] .gs-cell-rendered")).toHaveText('6');
    await expect(asyncSheet.locator("[data-address='F2'] .gs-cell-rendered")).toHaveText('10');
    await expect(asyncSheet.locator("[data-address='G2'] .gs-cell-rendered")).toHaveText('15');
    await expect(asyncSheet.locator("[data-address='H2'] .gs-cell-rendered")).toHaveText('20');
    await expect(asyncSheet.locator("[data-address='F3'] .gs-cell-rendered")).toHaveText('25');
    await expect(asyncSheet.locator("[data-address='G3'] .gs-cell-rendered")).toHaveText('30');
    await expect(asyncSheet.locator("[data-address='H3'] .gs-cell-rendered")).toHaveText('35');
    await expect(asyncSheet.locator("[data-address='F4'] .gs-cell-rendered")).toHaveText('40');
    await expect(asyncSheet.locator("[data-address='G4'] .gs-cell-rendered")).toHaveText('45');
    await expect(asyncSheet.locator("[data-address='H4'] .gs-cell-rendered")).toHaveText('50');
    await expect(asyncSheet.locator("[data-address='J2'] .gs-cell-rendered")).toHaveText('1');
    // SUM(C2:D4) — sum of the DELAY_SEQUENCE(3,2) spill range: 1+2+3+4+5+6 = 21
    await expect(asyncSheet.locator("[data-address='C10'] .gs-cell-rendered")).toHaveText('21');
  });
});

test.describe('Spill — UI behavior (address bar, formula bar, double-click, Delete)', () => {
  // SpillSync layout: A2 = =SEQUENCE(4), spills into A3 (2), A4 (3), A5 (4).
  // All four assertions use A3 as the representative spilled cell.
  test('spilled cell shows origin address in address bar, spilled value in formula bar, and is unaffected by Delete', async ({
    page,
  }) => {
    await page.goto(SEQUENCE_URL);

    const syncSheet = page.locator('[data-sheet-name="SpillSync"]');
    const a3 = syncSheet.locator("[data-address='A3']");

    // Wait for the SEQUENCE(4) spill to render (A3 receives the value 2 from A2)
    await expect(a3.locator('.gs-cell-rendered')).toHaveText('2');

    // ---- 1. Address bar shows the origin cell address (A2) when a spilled cell is selected ----
    await a3.click();

    const addressBar = syncSheet.locator('.gs-selecting-address');
    // The address bar renders the origin address followed by a spill indicator (↩).
    // Use toContainText so the indicator character does not need to be matched exactly.
    await expect(addressBar).toContainText('A2');

    // The formula bar root element also carries a data-spill marker while a spilled cell is focused.
    const formulaBar = syncSheet.locator('.gs-formula-bar');
    await expect(formulaBar).toHaveAttribute('data-spill', 'true');

    // ---- 2. Formula bar textarea displays the spilled value as-is (not evaluated by a formula) ----
    const formulaBarTextarea = syncSheet.locator('.gs-formula-bar textarea');
    await expect(formulaBarTextarea).toHaveValue('2');

    // ---- 3. Double-clicking a spilled cell initializes the inline editor with the spilled value ----
    // The gs-editor is a body-level portal; scope it to this sheet via data-sheet-id.
    const sheetId = await formulaBar.getAttribute('data-sheet-id');
    await a3.dblclick();

    const inlineEditor = page.locator(`.gs-editor[data-sheet-id="${sheetId}"] textarea`);
    await expect(inlineEditor).toHaveValue('2');

    // Cancel editing without committing
    await page.keyboard.press('Escape');

    // ---- 4. Pressing Delete on a spilled cell leaves the displayed value unchanged ----
    await a3.click();
    await page.keyboard.press('Delete');
    await expect(a3.locator('.gs-cell-rendered')).toHaveText('2');
  });
});

test.describe('Spill — blocked cases (#REF!)', () => {
  test('obstruction, overlap, and ARRAYFORMULA propagation all produce #REF!', async ({ page }) => {
    await page.goto(BLOCKED_URL);

    const sheet = page.locator('[data-sheet-name="SpillBlocked"]');

    // A1 = SEQUENCE(3, 2); A3 is pre-filled with "BLOCK" → A1 must be #REF!
    await expect(sheet.locator("[data-address='A1'] .gs-cell-rendered")).toHaveText('#REF!');
    // The pre-filled value in A3 must be untouched
    await expect(sheet.locator("[data-address='A3'] .gs-cell-rendered")).toHaveText('BLOCK');

    // D1 = SEQUENCE(3, 2) spills into D1:E3 first and claims E2/E3.
    // E2 = SEQUENCE(3, 2) tries to spill into E2:F4, which overlaps D1's range → E2 must be #REF!
    await expect(sheet.locator("[data-address='D1'] .gs-cell-rendered")).toHaveText('1');
    await expect(sheet.locator("[data-address='C2'] .gs-cell-rendered")).toHaveText('#REF!');

    // B1 = ARRAYFORMULA(A1:A3+2)
    // A1 is #REF! (its spill is blocked by A3="BLOCK") → B1 propagates #REF!
    await expect(sheet.locator("[data-address='B1'] .gs-cell-rendered")).toHaveText('#REF!');
    // B2 = spill of B1: A2 is empty (spill of A1 never happened) → 0+2 = 2
    await expect(sheet.locator("[data-address='B2'] .gs-cell-rendered")).toHaveText('2');
    // B3 = spill of B1: A3 is "BLOCK" (string) → "BLOCK"+2 = #VALUE!
    await expect(sheet.locator("[data-address='B3'] .gs-cell-rendered")).toHaveText('#VALUE!');
  });
});
