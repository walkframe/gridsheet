import type { MatricesByAddress, CellType } from '@gridsheet/engine';
import type { UserSheet } from '@gridsheet/engine';

/** Scalar cell values v0 understands on the way in and out of xlsx. */
export type XlsxCellValue = string | number | boolean | Date | null;

/**
 * One sheet's worth of imported data, shaped so it can be handed straight to
 * `buildInitialCells(parsed[name])`. `matrices` maps an origin address ("A1")
 * to a dense value matrix (formulas arrive as their "=..." string).
 */
export type XlsxSheetData = { matrices: MatricesByAddress<XlsxCellValue> };

/** Result of {@link fromXlsx}: sheet name → data, in workbook order. */
export type ParsedWorkbook = { [sheetName: string]: XlsxSheetData };

/**
 * Accepted per-sheet input to {@link toXlsx}: a live GridSheet sheet (its cells
 * are read via `toCellMatrix(sheet, { resolution: 'RAW' })`), a cell matrix, or
 * a plain value matrix.
 */
export type XlsxSheetInput = UserSheet | (CellType | null)[][] | XlsxCellValue[][];
