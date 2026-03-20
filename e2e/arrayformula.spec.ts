import { test, expect } from '@playwright/test';

const BASIC_URL = 'http://localhost:5233/iframe.html?id=formula-arrayformula--arrayformula-basic&viewMode=story';
const RANGE_URL = 'http://localhost:5233/iframe.html?id=formula-arrayformula--arrayformula-range&viewMode=story';
const WITH_IF_URL = 'http://localhost:5233/iframe.html?id=formula-arrayformula--arrayformula-with-if&viewMode=story';

test.describe('ARRAYFORMULA — basic element-wise arithmetic', () => {
  test('A*B and A+B spill correctly', async ({ page }) => {
    await page.goto(BASIC_URL);
    const sheet = page.locator('[data-sheet-name="AFBasic"]');

    // C2: ARRAYFORMULA(A2:A5 * B2:B5) → 1*10, 2*20, 3*30, 4*40
    await expect(sheet.locator("[data-address='C2'] .gs-cell-rendered")).toHaveText('10');
    await expect(sheet.locator("[data-address='C3'] .gs-cell-rendered")).toHaveText('40');
    await expect(sheet.locator("[data-address='C4'] .gs-cell-rendered")).toHaveText('90');
    await expect(sheet.locator("[data-address='C5'] .gs-cell-rendered")).toHaveText('160');

    // D2: ARRAYFORMULA(A2:A5 + B2:B5) → 1+10, 2+20, 3+30, 4+40
    await expect(sheet.locator("[data-address='D2'] .gs-cell-rendered")).toHaveText('11');
    await expect(sheet.locator("[data-address='D3'] .gs-cell-rendered")).toHaveText('22');
    await expect(sheet.locator("[data-address='D4'] .gs-cell-rendered")).toHaveText('33');
    await expect(sheet.locator("[data-address='D5'] .gs-cell-rendered")).toHaveText('44');
  });
});

test.describe('ARRAYFORMULA — range passthrough', () => {
  test('spills range values into successive rows', async ({ page }) => {
    await page.goto(RANGE_URL);
    const sheet = page.locator('[data-sheet-name="AFRange"]');

    // C2: ARRAYFORMULA(A2:A5) → 10, 20, 30, 40
    await expect(sheet.locator("[data-address='C2'] .gs-cell-rendered")).toHaveText('10');
    await expect(sheet.locator("[data-address='C3'] .gs-cell-rendered")).toHaveText('20');
    await expect(sheet.locator("[data-address='C4'] .gs-cell-rendered")).toHaveText('30');
    await expect(sheet.locator("[data-address='C5'] .gs-cell-rendered")).toHaveText('40');
  });
});

test.describe('ARRAYFORMULA — combined with IF', () => {
  test('applies IF element-wise and spills Pass/Fail', async ({ page }) => {
    await page.goto(WITH_IF_URL);
    const sheet = page.locator('[data-sheet-name="AFWithIf"]');

    // B2: ARRAYFORMULA(IF(A2:A5 >= 60, "Pass", "Fail"))
    // scores: 90, 55, 70, 40
    await expect(sheet.locator("[data-address='B2'] .gs-cell-rendered")).toHaveText('Pass'); // 90
    await expect(sheet.locator("[data-address='B3'] .gs-cell-rendered")).toHaveText('Fail'); // 55
    await expect(sheet.locator("[data-address='B4'] .gs-cell-rendered")).toHaveText('Pass'); // 70
    await expect(sheet.locator("[data-address='B5'] .gs-cell-rendered")).toHaveText('Fail'); // 40
  });
});
