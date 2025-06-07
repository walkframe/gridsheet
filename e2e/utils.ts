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

export const ctrl = async (page: any, key: string) => {
  await page.keyboard.down('Control');
  await page.keyboard.press(key);
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
