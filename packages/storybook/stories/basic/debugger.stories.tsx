import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  GridSheet,
  useHub,
  BaseFunctionAsync,
  buildInitialCells,
  ensureNumber,
  p2a,
  solveTable,
  Table,
} from '@gridsheet/react-core';
import { Debugger } from '@gridsheet/react-dev';

const meta: Meta = {
  title: 'Basic/Debugger (Dev tool)',
};
export default meta;

const DESCRIPTION = [
  '## Debugger Component',
  'Shows internal `wire` state of the grid. Click around to see selection/data changes.',
].join('\n\n');

const DebuggerSheet = () => {
  const hub = useHub({
    additionalFunctions: {
      sum_delay_inflight: SumDelayInflightFunction,
    },
  });
  const [sheetName1, setSheetName1] = React.useState('First Sheet');
  const [sheetName2, setSheetName2] = React.useState('Second Sheet');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
            <input type="text" value={sheetName1} onChange={(e) => setSheetName1(e.target.value)} />
          </div>
          <GridSheet
            hub={hub}
            sheetName={sheetName1}
            options={{
              sheetResize: 'both',
            }}
            initialCells={buildInitialCells({
              cells: {
                A1: { value: 'Hello' },
                B1: { value: 'World' },
                A2: { value: 123 },
                B2: { value: '=A2 * 2' },
                A3: { value: '=SUM_DELAY_INFLIGHT(10, 20)' },
                B3: { value: '=SUM_DELAY_INFLIGHT(A3, 100)' },
                C3: { value: '=SUM_DELAY_INFLIGHT(A3, 100)' },
                A4: { value: '=SUM(A3, B3)' },
              },
              ensured: { numRows: 8, numCols: 4 },
            })}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
            <input type="text" value={sheetName2} onChange={(e) => setSheetName2(e.target.value)} />
          </div>
          <GridSheet
            hub={hub}
            sheetName={sheetName2}
            options={{
              sheetResize: 'both',
              mode: 'dark',
            }}
            initialCells={buildInitialCells({
              cells: {
                A1: { value: 'Tab 2 Data' },
                B1: { value: 999 },
                C1: { value: '=B1 + 1' },
              },
              ensured: { numRows: 8, numCols: 4 },
            })}
          />
        </div>
      </div>
      <div>
        <Debugger hub={hub} />
      </div>
    </div>
  );
};

/**
 * SUM_DELAY_INFLIGHT: async version of SUM that returns the result after 2 seconds.
 * Tracks inflight promises to prevent redundant executions.
 */
class SumDelayInflightFunction extends BaseFunctionAsync {
  example = 'SUM_DELAY_INFLIGHT(1, 2, 3)';
  helpTexts = ['Returns the sum of values after a 2-second delay.'];
  helpArgs = [{ name: 'value1', description: 'Numbers to sum.' }];
  useInflight = true;

  ttlMilliseconds = 60000;

  protected validate() {
    const spreaded: number[] = [];
    this.bareArgs.forEach((arg) => {
      if (arg instanceof Table) {
        spreaded.push(
          ...solveTable({ table: arg })
            .reduce((a: any[], b: any[]) => a.concat(b))
            .map((v: any) => ensureNumber(v, { ignore: true })),
        );
        return;
      }
      spreaded.push(ensureNumber(arg, { ignore: true }));
    });
    this.bareArgs = spreaded;
  }

  async main(...values: number[]) {
    const msg = `SUM_DELAY_INFLIGHT called with [${values.join(', ')}] at ${p2a(this.origin!)}`;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('SUM_DELAY_INFLIGHT_LOG', { detail: msg }));
    }
    if (values.length === 0) {
      throw new Error('SUM_DELAY_INFLIGHT requires at least one argument.');
    }
    await new Promise((resolve) => setTimeout(resolve, 10000));
    return values.reduce((a, b) => a + b, 0);
  }
}

export const App: StoryObj = {
  render: () => <DebuggerSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
