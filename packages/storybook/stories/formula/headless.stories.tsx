import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  BaseFunctionAsync,
  createRegistry,
  Sheet,
  toValueMatrix,
  FunctionArgumentDefinition,
} from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Formula/Headless',
};
export default meta;

/**
 * An async function resolved by whatever the caller injects — here a fake "AI"
 * that answers after a short delay. The engine never hardcodes who resolves it.
 */
class AiFunction extends BaseFunctionAsync {
  example = 'AI("prompt")';
  description = 'Resolves a prompt asynchronously (demo resolver).';
  defs: FunctionArgumentDefinition[] = [{ name: 'prompt', description: 'prompt', acceptedTypes: ['any'] }];

  async main(prompt: any) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return `AI(${prompt}) → 42`;
  }
}

const toTsv = (matrix: any[][]): string =>
  matrix.map((row) => row.map((cell) => (cell == null ? '' : String(cell))).join('\t')).join('\n');

/**
 * Resolve a sheet with NO spreadsheet UI.
 *
 * Nothing here renders <GridSheet>: we build a Sheet straight from the engine,
 * resolve sync + async formulas explicitly (`resolveAll()` + `waitForPending()`),
 * and dump two matrices via `toValueMatrix`:
 *   - RAW      → the source cells, formulas left un-evaluated (`=A1+B1`, `=AI(A2)`)
 *   - RESOLVED → the same cells after evaluation (`30`, `AI(...) → 42`)
 * so you can compare the input formulas against the materialized output.
 */
const resolveHeadless = async (): Promise<{ raw: string; resolved: string }> => {
  const registry = createRegistry({ additionalFunctions: { ai: AiFunction } });
  const sheet = new Sheet({ name: 'Headless', registry, eager: true });
  sheet.initialize({
    A1: { value: 10 },
    B1: { value: 20 },
    C1: { value: '=A1+B1' }, // sync
    A2: { value: 'summarize sales' },
    C2: { value: '=SUM(A1:B1)' }, // sync
    C3: { value: '=AI(A2)' }, // async, injected resolver
  });
  // Wire the sheet into its registry the way the React store would, so
  // references resolve outside a live UI.
  registry.contextsBySheetId[sheet.id] = {
    store: { sheetReactive: { current: sheet } },
    dispatch: () => {},
  } as any;
  sheet.resolveFormulas();

  // Snapshot the un-evaluated formulas BEFORE resolving.
  const raw = toTsv(toValueMatrix(sheet, { resolution: 'RAW' }));

  sheet.resolveAll(); // fire async formulas explicitly (no render)
  await sheet.waitForPending(); // await async completion

  const resolved = toTsv(toValueMatrix(sheet, { resolution: 'RESOLVED' }));
  return { raw, resolved };
};

const boxStyle: React.CSSProperties = {
  width: '100%',
  height: 160,
  fontFamily: 'monospace',
  fontSize: 12,
  whiteSpace: 'pre',
};

const HeadlessResolve: React.FC = () => {
  const [tsv, setTsv] = React.useState<{ raw: string; resolved: string }>({
    raw: 'resolving…',
    resolved: 'resolving…',
  });
  React.useEffect(() => {
    let alive = true;
    resolveHeadless().then((out) => {
      if (alive) {
        setTsv(out);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div style={{ maxWidth: 920 }}>
      <h3>Resolve formulas without the spreadsheet UI</h3>
      <p>
        This story renders <strong>no &lt;GridSheet&gt;</strong>. It builds a <code>Sheet</code> straight from the
        engine, resolves sync and async formulas via <code>resolveAll()</code> + <code>waitForPending()</code>, and
        dumps two TSV snapshots with <code>toValueMatrix</code>: the <strong>RAW</strong> formulas (
        <code>resolution: 'RAW'</code>) and the <strong>RESOLVED</strong> values (<code>resolution: 'RESOLVED'</code>).
      </p>
      <ul style={{ fontSize: 13, lineHeight: 1.6 }}>
        <li>
          <code>C1 = A1+B1</code> → 30 (sync)
        </li>
        <li>
          <code>C2 = SUM(A1:B1)</code> → 30 (sync)
        </li>
        <li>
          <code>C3 = AI(A2)</code> → async, resolved by the injected resolver
        </li>
      </ul>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#333', marginBottom: 4 }}>Before — RAW formulas (TSV):</div>
          <textarea className="headless-tsv-raw" readOnly value={tsv.raw} style={boxStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#333', marginBottom: 4 }}>After — RESOLVED values (TSV):</div>
          <textarea className="headless-tsv" readOnly value={tsv.resolved} style={boxStyle} />
        </div>
      </div>
    </div>
  );
};

export const Headless: StoryObj = {
  render: () => <HeadlessResolve />,
  parameters: {
    docs: {
      description: {
        story:
          'Formula resolution with **no spreadsheet UI**. The engine resolves sync + async formulas headlessly; the RAW formula TSV and the RESOLVED value TSV are shown side by side for comparison — the CLI / extension-host / backend use case, shown in a story.',
      },
    },
  },
};
