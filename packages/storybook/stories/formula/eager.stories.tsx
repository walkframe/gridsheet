import React, { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  BaseFunctionAsync,
  buildInitialCells,
  GridSheet,
  useSheetRef,
  ensureNumber,
  toValueMatrix,
  type FunctionArgumentDefinition,
} from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/react-core/spellbook';

const meta: Meta = {
  title: 'Formula/Eager',
};
export default meta;

const NUM_ROWS = 60;
// Tall data + short viewport → only a handful of rows are rendered, so the
// async cells in the other ~50 rows are off-screen.
const VIEWPORT_HEIGHT = 300;

/**
 * DELAY_DOUBLE(x): async ×2 after a short delay. Each call dispatches a window
 * event tagged with the sheet name so the demo can count how many off-screen
 * cells actually fired.
 */
class DelayDoubleFunction extends BaseFunctionAsync {
  example = 'DELAY_DOUBLE(A1)';
  description = 'Doubles its argument after a short async delay.';
  defs: FunctionArgumentDefinition[] = [{ name: 'value', description: 'A number to double.' }];
  useInflight = false;

  protected validate(args: any[]): any[] {
    return args.map((a) => ensureNumber(a, { ignore: true }));
  }

  async main(value: number) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('EAGER_FIRE', { detail: this.sheet.name }));
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    return value * 2;
  }
}

const makeCells = () => {
  const cells: Record<string, any> = {
    A0: { value: 'n', width: 60 },
    B0: { value: 'doubled', width: 200 },
  };
  for (let y = 1; y <= NUM_ROWS; y++) {
    cells[`A${y}`] = { value: y };
    cells[`B${y}`] = { value: `=DELAY_DOUBLE(A${y})` };
  }
  return buildInitialCells({ cells, ensured: { numRows: NUM_ROWS, numCols: 2 } });
};

const DESCRIPTION = [
  '## Eager resolution',
  `Both sheets share one book and hold ${NUM_ROWS} rows of \`=DELAY_DOUBLE(A{row})\` (async), but only a few rows fit in the ${VIEWPORT_HEIGHT}px viewport.`,
  '',
  '- **Left (default)**: virtualized. Only the async cells in *rendered* rows fire; scroll down and more fire on demand. The fire counter stays small.',
  '- **Right (`options.eager`)**: every async cell fires on mount regardless of the visible range — the counter jumps to ~all rows.',
  '',
  'The flag is **per sheet** (`options.eager` / `Sheet.eager`), not per book — that is why one shared book can drive both behaviors.',
  '',
  'The button calls `sheet.resolveAll()` + `await sheet.waitForPending()` on the left (default) sheet on demand, then dumps `toValueMatrix` — note off-screen rows come back resolved without enabling eager mode.',
].join('\n');

const EagerSheets = () => {
  const book = useSpellbook({ additionalFunctions: { delay_double: DelayDoubleFunction } });
  const lazyRef = useSheetRef();
  const [fires, setFires] = useState<Record<string, number>>({});
  const [dump, setDump] = useState('');

  useEffect(() => {
    const onFire = (e: any) => setFires((prev) => ({ ...prev, [e.detail]: (prev[e.detail] ?? 0) + 1 }));
    window.addEventListener('EAGER_FIRE', onFire);
    return () => window.removeEventListener('EAGER_FIRE', onFire);
  }, []);

  const resolveLazyOnDemand = async () => {
    const handle = lazyRef.current;
    if (!handle) {
      return;
    }
    const { sheet } = handle;
    sheet.resolveAll();
    await sheet.waitForPending();
    const col = toValueMatrix(sheet, { area: { top: 1, left: 2, bottom: NUM_ROWS, right: 2 } });
    setDump(col.map((r, i) => `B${i + 1} = ${r[0]}`).join('\n'));
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <div className="eager-off">
          <h3>default (virtualized)</h3>
          <p>fired: {fires['EagerLazy'] ?? 0} cells</p>
          <GridSheet
            book={book}
            sheetRef={lazyRef}
            sheetName="EagerLazy"
            initialCells={makeCells()}
            options={{ sheetHeight: VIEWPORT_HEIGHT, sheetWidth: 300 }}
          />
          <button style={{ marginTop: 8 }} onClick={resolveLazyOnDemand}>
            resolveAll() + waitForPending() → dump
          </button>
        </div>

        <div className="eager-on">
          <h3>options.eager = true</h3>
          <p>fired: {fires['EagerOn'] ?? 0} cells</p>
          <GridSheet
            book={book}
            sheetName="EagerOn"
            initialCells={makeCells()}
            options={{ eager: true, sheetHeight: VIEWPORT_HEIGHT, sheetWidth: 300 }}
          />
        </div>

        <div className="eager-dump">
          <h3>on-demand dump (left sheet)</h3>
          <textarea
            readOnly
            style={{ width: 220, height: VIEWPORT_HEIGHT }}
            placeholder="Press the button to resolve every row and dump toValueMatrix"
            value={dump}
          />
        </div>
      </div>
    </div>
  );
};

export const Eager: StoryObj = {
  render: () => <EagerSheets />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
