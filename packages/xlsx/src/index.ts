// @gridsheet/xlsx — xlsx ⇄ GridSheet conversion (values + formulas, v0).
// Headless: no DOM, no framework. Depends on @gridsheet/engine (peer) + fflate.

export { fromXlsx, type XlsxInput } from './read';
export { toXlsx } from './write';
export type { ParsedWorkbook, XlsxSheetData, XlsxSheetInput, XlsxCellValue } from './types';

// A1 helpers are handy for consumers building addresses.
export { colName, colIndex, parseRef } from './a1';
