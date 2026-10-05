import { toCellMatrix, type UserSheet, type CellType } from '@gridsheet/engine';
import { writeZip } from './zip';
import { colName } from './a1';
import { escapeXml, escapeAttr } from './xml';
import { StyleSheetBuilder } from './style_writer';
import type { XlsxSheetInput, XlsxCellValue } from './types';

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const MAIN_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const PKG_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';

// Inverse of the read-side pixel conversions (read.ts): px → column-width chars, px → points.
const pxToColWidth = (px: number): number => Math.round(((px - 5) / 7) * 100) / 100;
const pxToPoints = (px: number): number => Math.round(((px * 3) / 4) * 100) / 100;

type SheetData = {
  cells: (CellType | null)[][];
  colWidths: Map<number, number>; // 1-based column index → px
  rowHeights: Map<number, number>; // 1-based row index → px
};

const ROOT_RELS =
  XML_DECL +
  `<Relationships xmlns="${PKG_REL_NS}">` +
  `<Relationship Id="rId1" Type="${REL_NS}/officeDocument" Target="xl/workbook.xml"/>` +
  '</Relationships>';

const isUserSheet = (input: XlsxSheetInput): input is UserSheet =>
  !Array.isArray(input) && typeof (input as { getCell?: unknown }).getCell === 'function';

const normalizeCell = (entry: CellType | XlsxCellValue | null): CellType | null => {
  if (entry == null) {
    return null;
  }
  if (typeof entry === 'object' && !(entry instanceof Date) && 'value' in entry) {
    return entry as CellType;
  }
  return { value: entry } as CellType; // a raw scalar / Date
};

const toSheetData = (input: XlsxSheetInput): SheetData => {
  const colWidths = new Map<number, number>();
  const rowHeights = new Map<number, number>();
  if (isUserSheet(input)) {
    const cells = toCellMatrix(input, { resolution: 'RAW' });
    const rows = cells.length;
    const cols = cells[0]?.length ?? 0;
    // Column widths and row heights live on the header cells (y=0 / x=0).
    for (let x = 1; x <= cols; x++) {
      const w = input.getCell({ y: 0, x })?.width;
      if (typeof w === 'number') {
        colWidths.set(x, w);
      }
    }
    for (let y = 1; y <= rows; y++) {
      const h = input.getCell({ y, x: 0 })?.height;
      if (typeof h === 'number') {
        rowHeights.set(y, h);
      }
    }
    return { cells, colWidths, rowHeights };
  }
  const cells = (input as (CellType | XlsxCellValue | null)[][]).map((row) => row.map(normalizeCell));
  return { cells, colWidths, rowHeights };
};

const buildCellXml = (
  ref: string,
  cell: CellType,
  intern: (s: string) => number,
  styles: StyleSheetBuilder,
): string => {
  const s = styles.xfFor(cell);
  const sAttr = s > 0 ? ` s="${s}"` : '';
  const value = cell.value as XlsxCellValue;
  if (typeof value === 'string' && value.startsWith('=')) {
    return `<c r="${ref}"${sAttr}><f>${escapeXml(value.slice(1))}</f></c>`;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<c r="${ref}"${sAttr}><v>${value}</v></c>`;
  }
  if (typeof value === 'boolean') {
    return `<c r="${ref}"${sAttr} t="b"><v>${value ? 1 : 0}</v></c>`;
  }
  if (value === null || value === undefined || value === '') {
    // Empty but styled → still emit the cell so its background/format survives.
    return sAttr ? `<c r="${ref}"${sAttr}/>` : '';
  }
  // Date has no number-format support yet; round-trip it as an ISO string.
  const text = value instanceof Date ? value.toISOString() : String(value);
  return `<c r="${ref}"${sAttr} t="s"><v>${intern(text)}</v></c>`;
};

const buildSheetXml = (data: SheetData, intern: (s: string) => number, styles: StyleSheetBuilder): string => {
  const { cells, colWidths, rowHeights } = data;
  let cols = '';
  for (const [col, px] of [...colWidths.entries()].sort((a, b) => a[0] - b[0])) {
    cols += `<col min="${col}" max="${col}" width="${pxToColWidth(px)}" customWidth="1"/>`;
  }
  const colsXml = cols ? `<cols>${cols}</cols>` : '';

  let rows = '';
  for (let y = 0; y < cells.length; y++) {
    const row = cells[y];
    let rowCells = '';
    for (let x = 0; x < row.length; x++) {
      const cell = row[x];
      if (cell == null) {
        continue;
      }
      rowCells += buildCellXml(`${colName(x + 1)}${y + 1}`, cell, intern, styles);
    }
    const px = rowHeights.get(y + 1);
    const heightAttr = typeof px === 'number' ? ` ht="${pxToPoints(px)}" customHeight="1"` : '';
    if (rowCells || heightAttr) {
      rows += `<row r="${y + 1}"${heightAttr}>${rowCells}</row>`;
    }
  }
  // Merged ranges live on their anchor cell as merge: { rows, cols }.
  const merges: string[] = [];
  for (let y = 0; y < cells.length; y++) {
    for (let x = 0; x < cells[y].length; x++) {
      const span = cells[y][x]?.merge;
      if (span && (span.rows > 1 || span.cols > 1)) {
        merges.push(`${colName(x + 1)}${y + 1}:${colName(x + span.cols)}${y + span.rows}`);
      }
    }
  }
  // OOXML element order: <mergeCells> must follow <sheetData>.
  const mergesXml = merges.length
    ? `<mergeCells count="${merges.length}">${merges.map((ref) => `<mergeCell ref="${ref}"/>`).join('')}</mergeCells>`
    : '';
  return XML_DECL + `<worksheet xmlns="${MAIN_NS}">${colsXml}<sheetData>${rows}</sheetData>${mergesXml}</worksheet>`;
};

const buildSharedStrings = (shared: string[]): string => {
  const items = shared.map((s) => `<si><t xml:space="preserve">${escapeXml(s)}</t></si>`).join('');
  return XML_DECL + `<sst xmlns="${MAIN_NS}" count="${shared.length}" uniqueCount="${shared.length}">${items}</sst>`;
};

const buildWorkbookXml = (names: string[]): string => {
  const sheets = names
    .map((name, i) => `<sheet name="${escapeAttr(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join('');
  return (
    XML_DECL +
    `<workbook xmlns="${MAIN_NS}" xmlns:r="${REL_NS}">` +
    `<sheets>${sheets}</sheets>` +
    // Force a full recalc on open so formula cells (written without a cached <v>) show values.
    '<calcPr calcId="0" fullCalcOnLoad="1"/>' +
    '</workbook>'
  );
};

const buildWorkbookRels = (count: number): string => {
  let rels = '';
  for (let i = 0; i < count; i++) {
    rels += `<Relationship Id="rId${i + 1}" Type="${REL_NS}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`;
  }
  rels += `<Relationship Id="rId${count + 1}" Type="${REL_NS}/styles" Target="styles.xml"/>`;
  rels += `<Relationship Id="rId${count + 2}" Type="${REL_NS}/sharedStrings" Target="sharedStrings.xml"/>`;
  return XML_DECL + `<Relationships xmlns="${PKG_REL_NS}">${rels}</Relationships>`;
};

const buildContentTypes = (count: number): string => {
  let overrides = '';
  for (let i = 0; i < count; i++) {
    overrides +=
      `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ` +
      'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
  }
  overrides +=
    '<Override PartName="/xl/workbook.xml" ' +
    'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>';
  overrides +=
    '<Override PartName="/xl/styles.xml" ' +
    'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>';
  overrides +=
    '<Override PartName="/xl/sharedStrings.xml" ' +
    'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>';
  return (
    XML_DECL +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    overrides +
    '</Types>'
  );
};

/**
 * Serialize one or more sheets into an xlsx workbook (a Uint8Array of zip bytes).
 * Each input may be a live GridSheet sheet (read via `toCellMatrix` at RAW
 * resolution so formulas keep their "=..." text), a cell matrix, or a value
 * matrix. Values, formulas, cell styles (background / color / weight / italic /
 * underline / alignment), merged ranges, and — for a live sheet — column widths and row
 * heights are written; number formats are not.
 */
export const toXlsx = (sheets: Record<string, XlsxSheetInput>): Uint8Array => {
  const names = Object.keys(sheets);
  if (names.length === 0) {
    throw new Error('toXlsx: at least one sheet is required');
  }

  const shared: string[] = [];
  const sharedIndex = new Map<string, number>();
  const intern = (s: string): number => {
    let idx = sharedIndex.get(s);
    if (idx === undefined) {
      idx = shared.length;
      shared.push(s);
      sharedIndex.set(s, idx);
    }
    return idx;
  };
  const styles = new StyleSheetBuilder();

  const files: Record<string, string> = {};
  names.forEach((name, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = buildSheetXml(toSheetData(sheets[name]), intern, styles);
  });
  files['[Content_Types].xml'] = buildContentTypes(names.length);
  files['_rels/.rels'] = ROOT_RELS;
  files['xl/workbook.xml'] = buildWorkbookXml(names);
  files['xl/_rels/workbook.xml.rels'] = buildWorkbookRels(names.length);
  files['xl/styles.xml'] = styles.build();
  files['xl/sharedStrings.xml'] = buildSharedStrings(shared);

  return writeZip(files);
};
