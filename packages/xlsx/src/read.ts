import { readZip } from './zip';
import { parseXml, child, children, gatherText, type XmlNode } from './xml';
import { parseRef, colName } from './a1';
import { StyleTable } from './styles';
import type { CellsByAddressType } from '@gridsheet/engine';
import type { ParsedWorkbook, XlsxCellValue } from './types';

/** Accepted binary inputs for {@link fromXlsx}. Node Buffer is a Uint8Array subclass. */
export type XlsxInput = Uint8Array | ArrayBuffer | number[];

const toU8 = (data: XlsxInput): Uint8Array => {
  if (data instanceof Uint8Array) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  if (Array.isArray(data)) {
    return Uint8Array.from(data);
  }
  throw new Error('fromXlsx: expected a Uint8Array, ArrayBuffer, or byte array');
};

const parseRelationships = (xml: string | undefined): Record<string, string> => {
  const map: Record<string, string> = {};
  if (!xml) {
    return map;
  }
  const root = parseXml(xml);
  for (const rel of children(root, 'Relationship')) {
    if (rel.attrs['Id']) {
      map[rel.attrs['Id']] = rel.attrs['Target'] ?? '';
    }
  }
  return map;
};

/** Relationship targets are relative to xl/ (the .rels lives in xl/_rels/). */
const resolveWorkbookTarget = (target: string): string => {
  if (target.startsWith('/')) {
    return target.slice(1);
  }
  return `xl/${target.replace(/^\.\//, '')}`;
};

const parseSharedStrings = (xml: string | undefined): string[] => {
  if (!xml) {
    return [];
  }
  const root = parseXml(xml);
  return children(root, 'si').map((si) => gatherText(si));
};

const coerceValue = (cell: XmlNode, t: string | undefined, shared: string[]): XlsxCellValue => {
  const v = child(cell, 'v');
  switch (t) {
    case 'inlineStr':
      return gatherText(child(cell, 'is') ?? cell);
    case 's': {
      const idx = v ? parseInt(v.text, 10) : -1;
      return shared[idx] ?? '';
    }
    case 'b':
      return (v?.text ?? '0') !== '0';
    case 'str':
    case 'e':
      return v ? v.text : '';
    default: {
      // number (t="n") or untyped
      if (v && v.text !== '') {
        const num = Number(v.text);
        return Number.isNaN(num) ? v.text : num;
      }
      return null;
    }
  }
};

const parseSheet = (
  xml: string,
  shared: string[],
  styles: StyleTable,
): { matrix: XlsxCellValue[][]; cells: CellsByAddressType } => {
  const root = parseXml(xml);
  const sheetData = child(root, 'sheetData');
  const entries: { row: number; col: number; value: XlsxCellValue }[] = [];
  const cells: CellsByAddressType = {};
  let maxRow = 0;
  let maxCol = 0;

  for (const row of children(sheetData, 'row')) {
    const rowAttr = row.attrs['r'] ? parseInt(row.attrs['r'], 10) : undefined;
    let autoCol = 0;
    for (const c of children(row, 'c')) {
      const ref = c.attrs['r'] ? parseRef(c.attrs['r']) : { row: rowAttr ?? maxRow + 1, col: ++autoCol };
      autoCol = ref.col;
      const t = c.attrs['t'];
      const f = child(c, 'f');
      let value: XlsxCellValue;
      const formulaText = f ? f.text : '';
      if (f && formulaText.trim() !== '') {
        value = `=${formulaText}`;
      } else {
        value = coerceValue(c, t, shared);
      }
      // Cell style (background/color/weight/alignment) is independent of value: a
      // colored-but-empty cell still carries a style we want to keep.
      const cellStyle = styles.resolve(c.attrs['s']);
      if (cellStyle) {
        cells[`${colName(ref.col)}${ref.row}`] = cellStyle;
      }
      if (value !== null && value !== '') {
        entries.push({ row: ref.row, col: ref.col, value });
        if (ref.row > maxRow) {
          maxRow = ref.row;
        }
        if (ref.col > maxCol) {
          maxCol = ref.col;
        }
      }
    }
  }

  const matrix: XlsxCellValue[][] = [];
  for (let y = 0; y < maxRow; y++) {
    matrix.push(new Array<XlsxCellValue>(maxCol).fill(null));
  }
  for (const { row, col, value } of entries) {
    matrix[row - 1][col - 1] = value;
  }
  return { matrix, cells };
};

/**
 * Parse an xlsx workbook into a per-sheet map of `{ matrices }`, ready to feed
 * to `buildInitialCells(parsed[sheetName])`. Values arrive as string / number /
 * boolean; formulas arrive as their "=..." string (v0 does not read styles).
 */
export const fromXlsx = (data: XlsxInput): ParsedWorkbook => {
  const files = readZip(toU8(data));
  const workbookXml = files['xl/workbook.xml'];
  if (!workbookXml) {
    throw new Error('fromXlsx: not a valid xlsx (missing xl/workbook.xml)');
  }
  const workbook = parseXml(workbookXml);
  const rels = parseRelationships(files['xl/_rels/workbook.xml.rels']);
  const shared = parseSharedStrings(files['xl/sharedStrings.xml']);
  const styles = new StyleTable(files['xl/styles.xml']);

  const result: ParsedWorkbook = {};
  const sheetsEl = child(workbook, 'sheets');
  let fallback = 0;
  for (const sheet of children(sheetsEl, 'sheet')) {
    const name = sheet.attrs['name'] ?? `Sheet${++fallback}`;
    const rid = sheet.attrs['r:id'] ?? sheet.attrs['id'];
    const target = rid ? rels[rid] : undefined;
    if (!target) {
      continue;
    }
    const path = resolveWorkbookTarget(target);
    const sheetXml = files[path];
    if (sheetXml == null) {
      continue;
    }
    const { matrix, cells } = parseSheet(sheetXml, shared, styles);
    result[name] = { matrices: { A1: matrix }, cells };
  }
  return result;
};
