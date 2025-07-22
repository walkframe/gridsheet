export const jsonMinify = (json: string) => {
  return JSON.stringify(JSON.parse(json));
};

export const jsonQuery = (json: string, keys: string[]) => {
  const obj = JSON.parse(json);
  return keys.reduce((acc, key) => {
    return acc[key];
  }, obj);
};

export const drag = async (locator: any, startAddress: string, endAddress: string, page: any = null) => {
  if (page == null) {
    page = locator;
  }
  const start = locator.locator(`[data-address='${startAddress}']`);
  const end = locator.locator(`[data-address='${endAddress}']`);
  await start.click();
  await start.hover();
  await page.mouse.down();
  await end.hover();
  await page.mouse.up();
};

export const ctrl = async (page: any, key: string, shift = false) => {
  await page.keyboard.down('Control');
  if (shift) {
    await page.keyboard.down('Shift');
  }
  await page.keyboard.press(key);
  if (shift) {
    await page.keyboard.up('Shift');
  }
  await page.keyboard.up('Control');
};

export const paste = async (page: any) => {
  await page.evaluate(() => {
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', 'dummy');
    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: dataTransfer,
    });
    document.activeElement?.dispatchEvent(pasteEvent);
  });
};

export const dragAutofill = async (page: any, startAddress: string, endAddress: string) => {
  const start = page.locator(`[data-address='${startAddress}']`);
  const end = page.locator(`[data-address='${endAddress}']`);

  const autofillHandle = start.locator('.gs-autofill-drag');
  await autofillHandle.click();

  await autofillHandle.hover();
  await page.mouse.down();
  await end.hover();
  await page.mouse.up();
};

export const dragAutofillRange = async (
  page: any,
  rangeStartAddress: string,
  rangeEndAddress: string,
  targetAddress: string,
) => {
  const rangeStart = page.locator(`[data-address='${rangeStartAddress}']`);
  const rangeEnd = page.locator(`[data-address='${rangeEndAddress}']`);
  const target = page.locator(`[data-address='${targetAddress}']`);

  await rangeStart.click();
  await rangeStart.hover();
  await page.mouse.down();
  await rangeEnd.hover();
  await page.mouse.up();

  const autofillHandle = rangeEnd.locator('.gs-autofill-drag');
  await autofillHandle.click();

  await autofillHandle.hover();
  await page.mouse.down();
  await target.hover();
  await page.mouse.up();
};

export const cut = async (page: any) => {
  await ctrl(page, 'x');
};

export const copy = async (page: any) => {
  await ctrl(page, 'c');
};
