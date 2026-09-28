import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fromXlsx } from './index';

// A real workbook written by openpyxl (an independent OOXML writer) with features
// v0 does NOT support: merged cells, cell styles (fonts/fills/borders/alignment),
// number formats, frozen panes, column widths. The importer must ignore all of
// that and still extract values + formulas without throwing.
const complex = () => readFileSync(join(__dirname, '__fixtures__', 'complex.xlsx'));

describe('fromXlsx on a complex, styled workbook (graceful degradation)', () => {
  it('reads every sheet without throwing', () => {
    const parsed = fromXlsx(complex());
    expect(Object.keys(parsed)).toEqual(['Sales', 'Meta Data', 'Summary']);
  });

  it('keeps a merged cell value in its top-left, leaving the rest empty', () => {
    const sales = fromXlsx(complex()).Sales.matrices.A1;
    // A1:D1 is merged in the source; the value lives only in A1.
    expect(sales[0]).toEqual(['Q3 Sales Report', null, null, null]);
  });

  it('extracts values and formulas through the styling', () => {
    const sales = fromXlsx(complex()).Sales.matrices.A1;
    expect(sales[1]).toEqual(['Product', 'Qty', 'Price', 'Total']);
    expect(sales[2]).toEqual(['Apple', 3, 1.5, '=B3*C3']);
    expect(sales[3]).toEqual(['Banana', 10, 0.25, '=B4*C4']);
    expect(sales[4]).toEqual(['Cherry', 5, 2, '=B5*C5']);
    expect(sales[5]).toEqual(['Sum', null, null, '=SUM(D3:D5)']);
  });

  it('drops number formats: a formatted date reads as its raw serial number', () => {
    const meta = fromXlsx(complex())['Meta Data'].matrices.A1;
    // B1 is a date with a yyyy-mm-dd format; v0 has no numFmt handling, so it is
    // the underlying Excel serial number (a plain number), not a Date/string.
    expect(meta[0][0]).toBe('Generated');
    expect(typeof meta[0][1]).toBe('number');
    // A boolean stays boolean; a percent-formatted 15.3% is its raw fraction.
    expect(meta[1]).toEqual(['Active', true]);
    expect(meta[2]).toEqual(['Rate', 0.153]);
    // Escaped special characters decode correctly.
    expect(meta[3]).toEqual(['Note', 'a & b <x> "q"']);
  });

  it('imports cell styles as CSS: background, text color, weight, alignment', () => {
    const sales = fromXlsx(complex()).Sales.cells;
    // Merged title: white bold text on a dark fill, centered both ways.
    expect(sales.A1.style).toMatchObject({
      color: '#FFFFFF',
      fontWeight: 'bold',
      backgroundColor: '#203864',
    });
    expect(sales.A1.justifyContent).toBe('center');
    expect(sales.A1.alignItems).toBe('center');
    // Header cell: bold on a light fill, centered.
    expect(sales.B2.style).toMatchObject({ fontWeight: 'bold', backgroundColor: '#D9E1F2' });
    expect(sales.B2.justifyContent).toBe('center');
    // Zebra-striped data row keeps its fill.
    expect(sales.A4.style?.backgroundColor).toBe('#F2F2F2');
    // Right-aligned bold "Sum" label.
    expect(sales.A6.style?.fontWeight).toBe('bold');
    expect(sales.A6.justifyContent).toBe('flex-end');
  });

  it('imports column widths and row heights onto header cells', () => {
    const sales = fromXlsx(complex()).Sales.cells;
    // Column widths land on the column-header cell (ch(col) === `${col}0`).
    expect(sales.A0.width).toBe(159); // wide product column (22 chars)
    expect(sales.B0.width).toBe(47); // narrow qty column (6 chars)
    expect(sales.A0.width!).toBeGreaterThan(sales.B0.width!);
    // Row heights land on the row-header cell (rh(row) === `0${row}`).
    expect(sales['01'].height).toBe(45); // tall title row (34pt)
    expect(sales['02'].height).toBe(29); // header row (22pt)
  });

  it('preserves cross-sheet formula references verbatim (incl. quoted sheet names)', () => {
    const summary = fromXlsx(complex()).Summary.matrices.A1;
    expect(summary[0]).toEqual(['Cross-sheet Summary', null]); // merged title
    expect(summary[1]).toEqual(['Grand Total', '=SUM(Sales!D3:D5)']);
    expect(summary[2]).toEqual(['Top Product', '=Sales!D3']);
    // A sheet name with a space stays quoted through the round trip.
    expect(summary[3]).toEqual(['Weighted', "=Sales!D6*'Meta Data'!B3"]);
  });
});
