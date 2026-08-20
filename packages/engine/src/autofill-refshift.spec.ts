import { Sheet, createRegistry, buildInitialCells, Lexer } from './index';

// Autofill shifts a formula's relative references by re-running processFormula() with a slide.
// Regression: when a horizontal fill slid a RANGE argument off-sheet, the range collapsed to an
// EMPTY argument — `=F(a, C2:C6, b)` became `=F(a, , b)` — silently corrupting the formula's
// arity (and, for a spilling AI function, flipping it into a different mode). It must degrade to a
// stable #REF! instead, never to empty. Root cause: IdRangeEntity.identify returned '' when the
// slid range no longer resolved; it now returns the '#?' broken-ref marker like RefEntity/IdEntity.
describe('autofill range-ref shift', () => {
  const make = (cols: number) => {
    const registry = createRegistry();
    const cells = buildInitialCells({ cells: {}, ensured: { numRows: 8, numCols: cols } });
    const sheet = new Sheet({ name: 'S', registry, eager: true });
    sheet.initialize(cells);
    registry.contextsBySheetId[sheet.id] = {
      store: { sheetReactive: { current: sheet } },
      dispatch: () => {},
    } as any;
    return sheet;
  };

  const display = (sheet: Sheet, internal: string): string => {
    const lexer = new Lexer(internal.substring(1));
    lexer.tokenize();
    return '=' + lexer.display({ sheet });
  };

  // Enter a formula at the source cell (raw -> internal id form), then autofill it by `slideX`.
  const fill = (sheet: Sheet, raw: string, srcX: number, slideX: number, dstX: number): string => {
    const srcId = sheet.getId({ y: 2, x: srcX })!;
    const internal = sheet.processFormula(raw, { dependency: srcId, slideX: 0, slideY: 0 });
    const dstId = sheet.getId({ y: 2, x: dstX })!;
    return sheet.processFormula(internal, { dependency: dstId, slideX, slideY: 0 });
  };

  it('shifts an in-bounds range and preserves an absolute arg', () => {
    const sheet = make(8);
    const filled = fill(sheet, '=FOO("x", C2:C6, $D$1)', 5, 1, 6);
    expect(display(sheet, filled)).toBe('=FOO("x", D2:D6, $D$1)');
  });

  it('degrades an off-sheet range to #REF! WITHOUT dropping the argument', () => {
    const sheet = make(6); // A..F — sliding C2:C6 right by 4 lands past column F
    const filled = fill(sheet, '=FOO("x", C2:C6, $D$1)', 5, 4, 6);
    const shown = display(sheet, filled);
    expect(shown).toContain('#REF!'); // the range became a broken ref
    expect(shown).toContain('$D$1'); // the trailing arg survived
    expect(shown).not.toMatch(/,\s*,/); // no empty argument slot
  });

  it('stays #REF! (never collapses to empty) when re-identified again', () => {
    const sheet = make(6);
    let cur = fill(sheet, '=FOO("x", C2:C6, $D$1)', 5, 4, 6);
    const dstId = sheet.getId({ y: 2, x: 6 })!;
    for (let pass = 0; pass < 3; pass++) {
      cur = sheet.processFormula(cur, { dependency: dstId, slideX: 0, slideY: 0 });
      const shown = display(sheet, cur);
      expect(shown).toContain('#REF!');
      expect(shown).not.toMatch(/,\s*,/);
    }
  });
});
