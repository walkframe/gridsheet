import { Sheet, createRegistry, buildInitialCells, Policy, toValueMatrix, type PolicyMixinType } from './index';

/**
 * Save round-trip fidelity (CSV viewer text mode).
 *
 * The VS Code CSV viewer saves by serializing `toValueMatrix(RESOLVED)` back to text. To keep
 * that loss-less, every data cell uses a "text-in / text-out" default policy: values are never
 * coerced from their original string EXCEPT a number that round-trips exactly (so `10` sorts
 * numerically yet still saves as `10`). These tests pin that contract so a policy/serialize
 * change can't silently start corrupting files (`007`→`7`, `12.50`→`12.5`, a date → ISO) or
 * dropping an edit — the "opened a CSV, saved, and it changed" class of bug.
 */

// Mirror of the webview's makeDefaultPolicy(parseNumber only): keep every value as text except
// a number that serializes back identically; date/time/bool are never coerced.
const disable = (): PolicyMixinType['deserializeNumber'] => () => ({ value: undefined });
const roundTripNumber: PolicyMixinType['deserializeNumber'] = (value: string) => {
  if (typeof value !== 'string' || value === '') {
    return { value: undefined };
  }
  const n = Number(value);
  return Number.isFinite(n) && String(n) === value ? { value: n } : { value: undefined };
};
const textModePolicy = () =>
  new Policy({
    mixins: [
      {
        deserializeNumber: roundTripNumber,
        deserializeDate: disable(),
        deserializeTime: disable(),
        deserializeBool: disable(),
      },
    ],
  });

const load = (rows: string[][]) => {
  const registry = createRegistry({ policies: { raw: textModePolicy() } });
  const ic = buildInitialCells({
    cells: { default: { policy: 'raw' } },
    matrices: { A1: rows },
    flattenAs: 'value',
    ensured: { numRows: rows.length, numCols: rows[0]?.length ?? 1 },
  });
  const sheet = new Sheet({ name: 'S', registry, eager: false });
  sheet.initialize(ic);
  sheet.setTotalSize();
  return sheet;
};

// What the save path reads: RESOLVED values, stringified like buildText does.
const serialized = (sheet: Sheet): string[][] =>
  (toValueMatrix(sheet, { resolution: 'RESOLVED' }) as any[][]).map((r) =>
    r.map((v) => (v == null ? '' : String(v))),
  );

describe('CSV viewer save round-trip (text mode)', () => {
  it('preserves values that would be mangled by coercion', () => {
    const sheet = load([
      ['007', '12.50', '2026-02-02'],
      ['1e3', '00', 'Mon Feb 02 2026 00:00:00 GMT+0900'],
    ]);
    const out = serialized(sheet);
    // Leading zeros, trailing decimals, dates, exponent form, and verbose date text all stay
    // byte-identical — none are coerced to number/Date and re-serialized.
    expect(out[0]).toEqual(['007', '12.50', '2026-02-02']);
    expect(out[1]).toEqual(['1e3', '00', 'Mon Feb 02 2026 00:00:00 GMT+0900']);
  });

  it('round-trips clean numbers unchanged (they parse but serialize back the same)', () => {
    const sheet = load([['10', '12.5', '-3', '0']]);
    expect(serialized(sheet)[0]).toEqual(['10', '12.5', '-3', '0']);
  });

  it('reflects a cell edit in the serialized output', () => {
    const sheet = load([
      ['1', 'Alice', '10'],
      ['2', 'Bob', '20'],
    ]);
    sheet.write({ point: { y: 2, x: 2 }, value: 'EDITED', operator: 'USER' });
    const out = serialized(sheet);
    expect(out[1]).toEqual(['2', 'EDITED', '20']);
    // Untouched cells are unchanged.
    expect(out[0]).toEqual(['1', 'Alice', '10']);
  });

  it('still evaluates formulas on save', () => {
    const sheet = load([['=1+2', 'x']]);
    expect(serialized(sheet)[0][0]).toBe('3');
  });
});
