import { colName, colIndex, parseRef } from './a1';

describe('a1 helpers', () => {
  it('converts 1-based column index to name', () => {
    expect(colName(1)).toBe('A');
    expect(colName(26)).toBe('Z');
    expect(colName(27)).toBe('AA');
    expect(colName(52)).toBe('AZ');
    expect(colName(702)).toBe('ZZ');
    expect(colName(703)).toBe('AAA');
  });

  it('converts column name to 1-based index (round-trips colName)', () => {
    expect(colIndex('A')).toBe(1);
    expect(colIndex('AA')).toBe(27);
    for (const c of [1, 26, 27, 100, 702, 703, 16384]) {
      expect(colIndex(colName(c))).toBe(c);
    }
  });

  it('parses A1 references, ignoring absolute markers', () => {
    expect(parseRef('A1')).toEqual({ row: 1, col: 1 });
    expect(parseRef('B2')).toEqual({ row: 2, col: 2 });
    expect(parseRef('AA10')).toEqual({ row: 10, col: 27 });
    expect(parseRef('$C$3')).toEqual({ row: 3, col: 3 });
  });
});
