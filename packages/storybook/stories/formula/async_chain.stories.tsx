import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  BaseFunctionAsync,
  buildInitialCells,
  GridSheet,
  ensureNumber,
  Sheet,
  p2a,
  FunctionArgumentDefinition,
} from '@gridsheet/react-core';
import { Debugger } from '@gridsheet/react-dev';
import { useSpellbook } from '@gridsheet/functions';

const meta: Meta = {
  title: 'Formula/AsyncChain',
};
export default meta;

/**
 * SUM_DELAY: async version of SUM that returns the result after 2 seconds.
 */
class SumDelayFunction extends BaseFunctionAsync {
  example = 'SUM_DELAY(1, 2, 3)';
  description = 'Returns the sum of values after a 2-second delay.';
  defs: FunctionArgumentDefinition[] = [{ name: 'value1', description: 'Numbers to sum.' }];
  useInflight = false;

  ttlMilliseconds = 5000;

  protected validate(args: any[]): any[] {
    const spreaded: number[] = [];
    args.forEach((arg) => {
      if (arg instanceof Sheet) {
        spreaded.push(
          ...arg
            .solve({ at: this.at })
            .reduce((a: any[], b: any[]) => a.concat(b))
            .map((v: any) => ensureNumber(v, { ignore: true })),
        );
        return;
      }
      spreaded.push(ensureNumber(arg, { ignore: true }));
    });
    return spreaded;
  }

  async main(...values: number[]) {
    const origin = this.sheet.getPointById(this.at);
    const msg = `SUM_DELAY called with [${values.join(', ')}] at ${p2a(origin!)}`;
    //console.log(msg);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('SUM_DELAY_LOG', { detail: msg }));
    }
    if (values.length === 0) {
      throw new Error('SUM_DELAY requires at least one argument.');
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
    return values.reduce((a, b) => a + b, 0);
  }
}

class SumDelayFunctionInflight extends BaseFunctionAsync {
  example = 'SUM_DELAY(1, 2, 3)';
  description = 'Returns the sum of values after a 2-second delay.';
  defs: FunctionArgumentDefinition[] = [
    { name: 'value1', description: 'Numbers to sum.', acceptedTypes: ['any'] },
    {
      name: 'value2',
      description: 'Additional numbers to sum.',
      acceptedTypes: ['any'],
      optional: true,
      variadic: true,
    },
  ];

  ttlMilliseconds = 5000;

  protected validate(args: any[]): any[] {
    const spreaded: number[] = [];
    args.forEach((arg) => {
      if (arg instanceof Sheet) {
        spreaded.push(
          ...arg
            .solve({ at: this.at })
            .reduce((a: any[], b: any[]) => a.concat(b))
            .map((v: any) => ensureNumber(v, { ignore: true })),
        );
        return;
      }
      spreaded.push(ensureNumber(arg, { ignore: true }));
    });
    return spreaded;
  }

  async main(...values: number[]) {
    const origin = this.sheet.getPointById(this.at);
    const msg = `SUM_DELAY_INFLIGHT called with [${values.join(', ')}] at ${p2a(origin!)}`;
    //console.log(msg);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('SUM_DELAY_INFLIGHT_LOG', { detail: msg }));
    }
    if (values.length === 0) {
      throw new Error('SUM_DELAY_INFLIGHT requires at least one argument.');
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
    return values.reduce((a, b) => a + b, 0);
  }
}

const ASYNC_CHAIN_DESCRIPTION = [
  '## Async Chain',
  'Demonstrates chained dependencies and multiple async calls within a single cell.',
  '- **A1**: `=SUM_DELAY(10, 20)` → 30 — async, root',
  '- **A2**: `=SUM_DELAY(A1, 100)` → 130 — async, depends on A1',
  '- **A3**: `=SUM_DELAY(A2, 200)` → 330 — async, depends on A2',
  '- **A4**: `=SUM_DELAY(A3, A1)` → 360 — async, depends on A3 and A1',
  '- **A5**: `=SUM_DELAY(10, 20) + SUM_DELAY(10, 20)` → 60 — same async call twice in one cell (same args)',
  '- **A6**: `=SUM_DELAY(10, 20) + SUM_DELAY(30, 40)` → 100 — different async calls in one cell (diff args)',
  '- **A7**: `=SUM(SUM_DELAY(10, 20), SUM_DELAY(30, 40))` → 100 — sync wrapper around multiple async calls',
  '- **A8**: `=SUM_DELAY()` → #ASYNC! — async error case',
  '- **A9**: `=SUM(A1:A2)` → 160 — sync SUM over range containing async results',
  '',
  'All cells should show a pending animation until SUM_DELAY resolves, then cascade to their computed values.',
].join('\n\n');

const AsyncChainSheet = () => {
  const book = useSpellbook({
    additionalFunctions: {
      sum_delay: SumDelayFunction,
      sum_delay_inflight: SumDelayFunctionInflight,
    },
  });
  const [logs1, setLogs1] = useState<string[]>([]);
  const [logs2, setLogs2] = useState<string[]>([]);

  useEffect(() => {
    const handle1 = (e: any) => setLogs1((prev) => [`${prev.length + 1}: ${e.detail}`, ...prev]);
    const handle2 = (e: any) => setLogs2((prev) => [`${prev.length + 1}: ${e.detail}`, ...prev]);

    window.addEventListener('SUM_DELAY_LOG', handle1);
    window.addEventListener('SUM_DELAY_INFLIGHT_LOG', handle2);

    return () => {
      window.removeEventListener('SUM_DELAY_LOG', handle1);
      window.removeEventListener('SUM_DELAY_INFLIGHT_LOG', handle2);
    };
  }, []);

  return (
    <>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div className="async-inflight-false">
          <h3>inflight = false</h3>
          <GridSheet
            book={book}
            sheetName="AsyncChain"
            initialCells={buildInitialCells({
              cells: {
                defaultCol: { width: 350 },
                A0: { width: 100 },
                A1: { value: '=SUM_DELAY(10, 20)' },
                A2: { value: '=SUM_DELAY(A1, 100)' },
                A3: { value: '=SUM_DELAY(A2, 200)' },
                A4: { value: '=SUM_DELAY(A3, A1)' },
                A5: { value: '=SUM_DELAY(10, 20) + SUM_DELAY(10, 20)' },
                A6: { value: '=SUM_DELAY(10, 20) + SUM_DELAY(30, 40)' },
                A7: { value: '=SUM(SUM_DELAY(10, 20), SUM_DELAY(30, 40))' },
                A8: { value: '=SUM_DELAY()' },
                A9: { value: '=SUM(A1:A2)' },
                B1: { value: 'SUM_DELAY(10,20) → 30' },
                B2: { value: 'SUM_DELAY(A1,100) → 130' },
                B3: { value: 'SUM_DELAY(A2,200) → 330' },
                B4: { value: 'SUM_DELAY(A3,A1) → 360' },
                B5: { value: 'same async ×2 in cell → 60' },
                B6: { value: 'diff async ×2 in cell → 100' },
                B7: { value: 'SUM(async, async) → 100' },
                B8: { value: 'SUM_DELAY() → #ASYNC!' },
                B9: { value: 'SUM(A1:A2) → 160' },
              },
              ensured: { numRows: 9, numCols: 2 },
            })}
          />
          <textarea
            readOnly
            className="logs"
            style={{ width: '100%', height: 200 }}
            placeholder="AsyncChain history"
            value={logs1.join('\n')}
          ></textarea>
        </div>
        <div className="async-inflight-true">
          <h3>inflight = true</h3>
          <GridSheet
            book={book}
            sheetName="AsyncChainInflight"
            initialCells={buildInitialCells({
              cells: {
                defaultCol: { width: 400 },
                A0: { width: 100 },
                A1: { value: '=SUM_DELAY_INFLIGHT(10, 20)' },
                A2: { value: '=SUM_DELAY_INFLIGHT(A1, 100)' },
                A3: { value: '=SUM_DELAY_INFLIGHT(A2, 200)' },
                A4: { value: '=SUM_DELAY_INFLIGHT(A3, A1)' },
                A5: { value: '=SUM_DELAY_INFLIGHT(10, 20) + SUM_DELAY_INFLIGHT(10, 20)' },
                A6: { value: '=SUM_DELAY_INFLIGHT(10, 20) + SUM_DELAY_INFLIGHT(30, 40)' },
                A7: { value: '=SUM(SUM_DELAY_INFLIGHT(10, 20), SUM_DELAY_INFLIGHT(30, 40))' },
                A8: { value: '=SUM_DELAY_INFLIGHT()' },
                A9: { value: '=SUM(A1:A2)' },
                B1: { value: 'SUM_DELAY_INFLIGHT(10,20) → 30' },
                B2: { value: 'SUM_DELAY_INFLIGHT(A1,100) → 130' },
                B3: { value: 'SUM_DELAY_INFLIGHT(A2,200) → 330' },
                B4: { value: 'SUM_DELAY_INFLIGHT(A3,A1) → 360' },
                B5: { value: 'same async ×2 in cell → 60' },
                B6: { value: 'diff async ×2 in cell → 100' },
                B7: { value: 'SUM(async, async) → 100' },
                B8: { value: 'SUM_DELAY_INFLIGHT() → #ASYNC!' },
                B9: { value: 'SUM(A1:A2) → 160' },
              },
              ensured: { numRows: 9, numCols: 2 },
            })}
          />
          <textarea
            readOnly
            className="logs"
            style={{ width: '100%', height: 200 }}
            placeholder="AsyncChainInflight history"
            value={logs2.join('\n')}
          ></textarea>
        </div>
      </div>
      <Debugger book={book} />
    </>
  );
};

export const AsyncChain: StoryObj = {
  render: () => <AsyncChainSheet />,
  parameters: {
    docs: {
      description: {
        story: ASYNC_CHAIN_DESCRIPTION,
      },
    },
  },
};
