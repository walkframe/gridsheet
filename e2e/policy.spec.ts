import { test, expect } from '@playwright/test';
import { ctrl, drag, go, paste } from './utils';

test('policy options: select, autocomplete, invalid and valid cut-paste', async ({ page }) => {
  await go(page, 'restriction-options--options');

  // ---- Strict option selection ----
  {
    const a1 = page.locator("[data-address='A1']");
    await a1.dblclick();
    const options = page.locator('.gs-editor-option');
    expect(await options.count()).toBe(4);
    await options.last().click();
    expect(await a1.locator('.gs-cell-rendered').textContent()).toBe('red');
  }

  {
    const a2 = page.locator("[data-address='A2']");
    await a2.dblclick();
    await page.keyboard.type('g');
    await page.keyboard.press('Enter');
    expect(await a2.locator('.gs-cell-rendered').textContent()).toBe('green');
  }

  {
    const a3 = page.locator("[data-address='A3']");
    await a3.dblclick();
    const options = page.locator('.gs-editor-option');
    expect(await options.count()).toBe(1);
    await page.keyboard.type('test');
    await page.keyboard.press('Enter');
    // no changes if it does not match any option
    expect(await a3.locator('.gs-cell-rendered').textContent()).toBe('red');
  }

  // ---- Autocomplete suggestion selection ----
  {
    const b1 = page.locator("[data-address='B1']");
    await b1.click();
    await page.keyboard.type('b');
    await page.keyboard.press('Enter');
    // suggested option should be selected.
    expect(await b1.locator('.gs-cell-rendered').textContent()).toBe('bird');
  }

  {
    const b2 = page.locator("[data-address='B2']");
    await b2.click();
    await page.keyboard.type('marmot');
    await page.keyboard.press('Enter');
    // word not in the suggestions can still be submitted.
    expect(await b2.locator('.gs-cell-rendered').textContent()).toBe('marmot');
  }

  // ---- Cut invalid value to column A ----
  {
    const b3 = page.locator("[data-address='B3']");
    await b3.click();
    await ctrl(page, 'x');
    const a3 = page.locator("[data-address='A3']");
    await a3.click();
    await paste(page);
    // invalid value should be replaced with the default value
    expect(await a3.locator('.gs-cell-rendered').textContent()).toBe('red');
    expect(await b3.locator('.gs-cell-rendered').textContent()).toBe('');
    await ctrl(page, 'z');
    expect(await a3.locator('.gs-cell-rendered').textContent()).toBe('red');
    expect(await b3.locator('.gs-cell-rendered').textContent()).toBe('alpaca');
    await ctrl(page, 'r');
    expect(await a3.locator('.gs-cell-rendered').textContent()).toBe('red');
    expect(await b3.locator('.gs-cell-rendered').textContent()).toBe('');
  }

  // ---- Cut valid value to column A ----
  {
    const b8 = page.locator("[data-address='B8']");
    await b8.click();
    await ctrl(page, 'x');
    const a8 = page.locator("[data-address='A8']");
    await a8.click();
    await paste(page);
    expect(await a8.locator('.gs-cell-rendered').textContent()).toBe('green');
    expect(await b8.locator('.gs-cell-rendered').textContent()).toBe('');
    await ctrl(page, 'z');
    expect(await a8.locator('.gs-cell-rendered').textContent()).toBe('');
    expect(await b8.locator('.gs-cell-rendered').textContent()).toBe('green');
    await ctrl(page, 'r');
    expect(await a8.locator('.gs-cell-rendered').textContent()).toBe('green');
    expect(await b8.locator('.gs-cell-rendered').textContent()).toBe('');
  }
});

test('masked words in clipboard', async ({ page, context }) => {
  await go(page, 'restriction-serializeforclipboard--serialize-for-clipboard');
  await drag(page, 'A1', 'B2');
  // Copy A1:B2
  await ctrl(page, 'c');
  const clipboardText = await page.evaluate(async () => {
    return await navigator.clipboard.readText();
  });
  expect(clipboardText).toBe('*****\t\n\t************');
});
