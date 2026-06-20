import {
  Sheet,
  createRegistry,
  toValueMatrix,
  BaseFunctionAsync,
  type FunctionArgumentDefinition,
  type FunctionCategory,
} from '@gridsheet/core';

/**
 * Tests for opt-in eager resolution (`Sheet.resolveAll()` / the `eager` book
 * option). GridSheet is virtualized: only rendered cells get solved, so an
 * off-screen async formula never fires. resolveAll() solves every formula cell
 * regardless of the visible range, which is what fills off-screen async cells.
 */

// A minimal async function that records each call and resolves on a controlled
// deferred, so a test can assert how many cells fired within one tick.
const calls: any[] = [];
let deferreds: Array<(v: any) => void> = [];

class EchoAsyncFunction extends BaseFunctionAsync {
  example = 'ECHO(A1)';
  description = 'Echoes its argument asynchronously (test helper).';
  category: FunctionCategory = 'other';
  defs: FunctionArgumentDefinition[] = [
    { name: 'value', description: 'value to echo', acceptedTypes: ['string', 'number'] },
  ];
  protected broadcastDisabled = true;

  protected main(value: any): Promise<any> {
    calls.push(value);
    return new Promise((resolve) => {
      deferreds.push(() => resolve(`R:${value}`));
    });
  }
}

const flush = async () => {
  // Resolve every pending deferred, then let microtasks (awaitAndSave .then /
  // transmit) settle.
  const pending = deferreds;
  deferreds = [];
  pending.forEach((r) => r(undefined));
  await Promise.resolve();
  await Promise.resolve();
};

const newSheet = (cells: any, eager = false) => {
  const registry = createRegistry({ additionalFunctions: { echo: EchoAsyncFunction } });
  const sheet = new Sheet({ name: 'Sheet1', registry, eager });
  sheet.initialize(cells);
  // Wire the sheet into the registry the way the React store does, so
  // sheet-qualified references (`#0!#id`) resolve outside a live UI.
  registry.contextsBySheetId[sheet.id] = {
    store: { sheetReactive: { current: sheet } },
    dispatch: () => {},
  } as any;
  // boot() normally does this; identifies formulas → populates formulaCells.
  sheet.resolveFormulas();
  return sheet;
};

beforeEach(() => {
  calls.length = 0;
  deferreds = [];
});

describe('resolveAll / eager resolution', () => {
  it('fires every async formula cell regardless of the visible range', async () => {
    // 5 async formulas; in a virtualized UI only the first row or two would
    // render, so without eager resolution the rest never fire.
    const cells: any = {};
    for (let y = 1; y <= 5; y++) {
      cells[`A${y}`] = { value: y * 10 };
      cells[`B${y}`] = { value: `=ECHO(A${y})` };
    }
    const sheet = newSheet(cells);

    expect(calls).toHaveLength(0); // nothing solved yet (no render, no resolveAll)

    const visited = sheet.resolveAll();
    expect(visited).toBe(5);
    // All five fired synchronously in one tick → a userland batcher could
    // coalesce them into a single backend call.
    expect(calls).toEqual([10, 20, 30, 40, 50]);

    await flush();
    await sheet.waitForPending();

    // toValueMatrix returns resolved values for the off-screen cells too.
    const matrix = toValueMatrix(sheet, { area: { top: 1, left: 2, bottom: 5, right: 2 } });
    expect(matrix.map((r) => r[0])).toEqual(['R:10', 'R:20', 'R:30', 'R:40', 'R:50']);
  });

  it('does not re-fire already-resolved cells on repeated calls', async () => {
    const sheet = newSheet({ A1: { value: 7 }, B1: { value: '=ECHO(A1)' } });

    sheet.resolveAll();
    await flush();
    await sheet.waitForPending();
    expect(calls).toEqual([7]);

    // Second pass: the cell is an async-cache hit, so main() must not run again.
    sheet.resolveAll();
    expect(calls).toEqual([7]);
  });

  it('targets only async formulas — sync formulas and literals are skipped', async () => {
    const sheet = newSheet({
      A1: { value: 1 },
      B1: { value: '=ECHO(A1)' }, // async → eager
      C1: { value: '=A1*2' }, // sync → resolves on read, not eager
      D1: { value: 'plain' }, // literal
    });
    // Only the async cell is visited, regardless of the sync formula present.
    expect(sheet.resolveAll()).toBe(1);

    // Overwrite the async formula with a literal → drops out of the index.
    sheet.update({ diff: { B1: { value: 'literal' } } });
    expect(sheet.resolveAll()).toBe(0);
  });

  it('drops a cell from the index when its formula changes async → sync', async () => {
    const sheet = newSheet({ A1: { value: 1 }, B1: { value: '=ECHO(A1)' } });
    expect(sheet.resolveAll()).toBe(1);

    // Edit B1 to a sync formula (still a formula, but no async call).
    sheet.update({ diff: { B1: { value: '=A1*2' } } });
    expect(sheet.resolveAll()).toBe(0);

    // And back to async → re-added.
    sheet.update({ diff: { B1: { value: '=ECHO(A1)' } } });
    expect(sheet.resolveAll()).toBe(1);
  });

  it('indexes async calls nested inside a sync formula', async () => {
    // The top-level op is arithmetic, but the cell still calls an async fn, so
    // it must fire eagerly.
    const sheet = newSheet({ A1: { value: 5 }, B1: { value: '=ECHO(A1)' }, C1: { value: '=ECHO(A1) & "!"' } });
    expect(sheet.resolveAll()).toBe(2);
  });

  it('exposes the eager flag per sheet', () => {
    const eagerSheet = newSheet({ A1: { value: 1 } }, true);
    const lazySheet = newSheet({ A1: { value: 1 } }, false);
    expect(eagerSheet.eager).toBe(true);
    expect(lazySheet.eager).toBe(false);
  });
});
