import { test, expect } from '@playwright/test';

test('show the diff', async ({ page }) => {
  await page.goto('http://localhost:5233/iframe.html?id=table-operations--sheet-on-change&viewMode=story');
  const b7 = page.locator("[data-address='B7']");
  await b7.dblclick();

  const editor = page.locator('.gs-editor textarea');
  await editor.fill('777');
  await editor.press('Enter');

  const pre = page.locator('#diff');
  expect(await pre.textContent()).toContain('{"B7":777}');
});
