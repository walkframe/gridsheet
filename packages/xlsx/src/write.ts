import { toCellMatrix, type UserSheet, type CellType } from '@gridsheet/engine';
import { writeZip } from './zip';
import { colName } from './a1';
import { escapeXml, escapeAttr } from './xml';
import type { XlsxSheetInput, XlsxCellValue } from './types';

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const MAIN_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const PKG_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';

// A minimal-but-valid styles part. v0 writes no per-cell styles; Excel still
// requires xl/styles.xml to exist and expose xf index 0.
const STYLES_XML =
  XML_DECL +
  `<styleSheet xmlns="${MAIN_NS}">` +
  '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>' +
  '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>' +
  '<borders count="1"><border/></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>' +
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
  '</styleSheet>';

const ROOT_RELS =
  XML_DECL +
  `<Relationships xmlns="${PKG_REL_NS}">` +
  `<Relationship Id="rId1" Type="${REL_NS}/officeDocument" Target="xl/workbook.xml"/>` +
  '</Relationships>';

const isUserSheet = (input: XlsxSheetInput): input is UserSheet =>
  !Array.isArray(input) && typeof (input as { getCell?: unknown }).getCell === 'function';

const cellEntryToValue = (entry: CellType | XlsxCellValue | null): XlsxCellValue => {
  if (entry != null && typeof entry === 'object' && !(entry instanceof Date) && 'value' in entry) {
    return (entry as CellType).value ?? null;
  }
  return (entry as XlsxCellValue) ?? null;
};

const toValueMatrix = (input: XlsxSheetInput): XlsxCellValue[][] => {
  if (isUserSheet(input)) {
    const cells = toCellMatrix(input, { resolution: 'RAW' });
    return cells.map((row) => row.map((cell) => (cell ? (cell.value ?? null) : null)));
  }
  return (input as (CellType | XlsxCellValue | null)[][]).map((row) => row.map(cellEntryToValue));
};

const buildCellXml = (ref: string, value: XlsxCellValue, intern: (s: string) => number): string => {
  if (typeof value === 'string' && value.startsWith('=')) {
    return `<c r="${ref}"><f>${escapeXml(value.slice(1))}</f></c>`;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<c r="${ref}"><v>${value}</v></c>`;
  }
  if (typeof value === 'boolean') {
    return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`;
  }
  // Date has no v0 number-format support; round-trip it as an ISO string.
  const text = value instanceof Date ? value.toISOString() : String(value);
  return `<c r="${ref}" t="s"><v>${intern(text)}</v></c>`;
};

const buildSheetXml = (matrix: XlsxCellValue[][], intern: (s: string) => number): string => {
  let rows = '';
  for (let y = 0; y < matrix.length; y++) {
    const row = matrix[y];
    let cells = '';
    for (let x = 0; x < row.length; x++) {
      const value = row[x];
      if (value === null || value === undefined || value === '') {
        continue;
      }
      cells += buildCellXml(`${colName(x + 1)}${y + 1}`, value, intern);
    }
    if (cells) {
      rows += `<row r="${y + 1}">${cells}</row>`;
    }
  }
  return XML_DECL + `<worksheet xmlns="${MAIN_NS}"><sheetData>${rows}</sheetData></worksheet>`;
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
 * matrix. v0 writes values + formulas only; styles are not emitted.
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

  const files: Record<string, string> = {};
  names.forEach((name, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = buildSheetXml(toValueMatrix(sheets[name]), intern);
  });
  files['[Content_Types].xml'] = buildContentTypes(names.length);
  files['_rels/.rels'] = ROOT_RELS;
  files['xl/workbook.xml'] = buildWorkbookXml(names);
  files['xl/_rels/workbook.xml.rels'] = buildWorkbookRels(names.length);
  files['xl/styles.xml'] = STYLES_XML;
  files['xl/sharedStrings.xml'] = buildSharedStrings(shared);

  return writeZip(files);
};
