import { fromXlsx, toXlsx } from './index';
import { writeZip } from './zip';
import type { XlsxCellValue } from './types';

// Round-trip helper: value matrix → xlsx bytes → parsed first sheet's matrix.
const roundTrip = (matrix: XlsxCellValue[][], sheetName = 'Sheet1'): XlsxCellValue[][] => {
  const bytes = toXlsx({ [sheetName]: matrix });
  const parsed = fromXlsx(bytes);
  return parsed[sheetName].matrices.A1;
};

describe('toXlsx → fromXlsx round trip', () => {
  it('preserves strings, numbers, and booleans by type', () => {
    const out = roundTrip([
      ['name', 'age', 'active'],
      ['Alice', 30, true],
      ['Bob', 25.5, false],
    ]);
    expect(out[0]).toEqual(['name', 'age', 'active']);
    expect(out[1]).toEqual(['Alice', 30, true]);
    expect(out[2]).toEqual(['Bob', 25.5, false]);
    // types, not just values
    expect(typeof out[1][1]).toBe('number');
    expect(typeof out[1][2]).toBe('boolean');
  });

  it('keeps formulas as their "=..." string', () => {
    const out = roundTrip([
      [1, 2],
      ['=A1+B1', '=SUM(A1:B1)'],
    ]);
    expect(out[1][0]).toBe('=A1+B1');
    expect(out[1][1]).toBe('=SUM(A1:B1)');
  });

  it('escapes special characters in strings and formulas', () => {
    const out = roundTrip([
      ['a & b <c>', 'quote "x"'],
      ['=IF(A1>2,"big","small")', null],
    ]);
    expect(out[0][0]).toBe('a & b <c>');
    expect(out[0][1]).toBe('quote "x"');
    expect(out[1][0]).toBe('=IF(A1>2,"big","small")');
  });

  it('drops empty/null cells and trims the matrix to the used range', () => {
    const out = roundTrip([
      ['x', null, ''],
      [null, null, null],
      [null, null, 'y'],
    ]);
    // used range is A1:C3 (C3 = 'y')
    expect(out).toHaveLength(3);
    expect(out[0][0]).toBe('x');
    expect(out[0][1]).toBeNull();
    expect(out[2][2]).toBe('y');
  });

  it('round-trips a Date as an ISO string (v0 has no date number-format)', () => {
    const d = new Date('2026-09-28T00:00:00.000Z');
    const out = roundTrip([[d]]);
    expect(out[0][0]).toBe(d.toISOString());
  });

  it('deduplicates shared strings', () => {
    // "dup" appears 3x → uniqueCount should be 1 (plus the distinct "solo").
    const bytes = toXlsx({
      Sheet1: [
        ['dup', 'dup'],
        ['dup', 'solo'],
      ],
    });
    const parsed = fromXlsx(bytes);
    const m = parsed.Sheet1.matrices.A1;
    expect(m[0]).toEqual(['dup', 'dup']);
    expect(m[1]).toEqual(['dup', 'solo']);
  });

  it('handles multiple sheets in workbook order', () => {
    const bytes = toXlsx({
      First: [['a']],
      Second: [[1], [2]],
      'Name with spaces': [['=1+1']],
    });
    const parsed = fromXlsx(bytes);
    expect(Object.keys(parsed)).toEqual(['First', 'Second', 'Name with spaces']);
    expect(parsed.First.matrices.A1).toEqual([['a']]);
    expect(parsed.Second.matrices.A1).toEqual([[1], [2]]);
    expect(parsed['Name with spaces'].matrices.A1).toEqual([['=1+1']]);
  });

  it('produces output usable as buildInitialCells input shape', () => {
    const parsed = fromXlsx(toXlsx({ Sheet1: [['hi', 42]] }));
    // Shape check: { matrices: { A1: [[...]] } } — exactly what buildInitialCells destructures.
    expect(parsed.Sheet1).toHaveProperty('matrices.A1');
    expect(parsed.Sheet1.matrices.A1).toEqual([['hi', 42]]);
  });
});

describe('fromXlsx read paths not emitted by our writer', () => {
  // Build a minimal workbook by hand to exercise inlineStr, t="str", and untyped
  // numeric cells (readers must accept these even though toXlsx never writes them).
  const MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const PKG = 'http://schemas.openxmlformats.org/package/2006/relationships';

  const handBuilt = (): Uint8Array =>
    writeZip({
      '[Content_Types].xml':
        `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `</Types>`,
      '_rels/.rels':
        `<?xml version="1.0"?><Relationships xmlns="${PKG}">` +
        `<Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      'xl/workbook.xml':
        `<?xml version="1.0"?><workbook xmlns="${MAIN}" xmlns:r="${REL}"><sheets>` +
        `<sheet name="Data" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      'xl/_rels/workbook.xml.rels':
        `<?xml version="1.0"?><Relationships xmlns="${PKG}">` +
        `<Relationship Id="rId1" Type="${REL}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
      'xl/worksheets/sheet1.xml':
        `<?xml version="1.0"?><worksheet xmlns="${MAIN}"><sheetData>` +
        `<row r="1">` +
        `<c r="A1" t="inlineStr"><is><t>inline</t></is></c>` +
        `<c r="B1"><v>3.14</v></c>` + // untyped number
        `<c r="C1" t="str"><f>CONCAT("a","b")</f><v>ab</v></c>` + // formula with cached value
        `</row>` +
        `<row r="2">` +
        `<c r="B2" t="b"><v>1</v></c>` + // boolean, sparse (A2 missing)
        `</row>` +
        `</sheetData></worksheet>`,
    });

  it('reads inlineStr, untyped numbers, cached formulas, and sparse booleans', () => {
    const parsed = fromXlsx(handBuilt());
    const m = parsed.Data.matrices.A1;
    expect(m[0][0]).toBe('inline');
    expect(m[0][1]).toBe(3.14);
    expect(m[0][2]).toBe('=CONCAT("a","b")'); // formula text wins over cached <v>
    expect(m[1][0]).toBeNull(); // A2 absent
    expect(m[1][1]).toBe(true); // B2 boolean
  });

  it('throws a clear error on non-xlsx input', () => {
    expect(() => fromXlsx(writeZip({ 'hello.txt': 'not a workbook' }))).toThrow(/valid xlsx/);
  });
});
