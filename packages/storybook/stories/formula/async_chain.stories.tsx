import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  BaseFunctionAsync,
  buildInitialCells,
  GridSheet,
  useHub,
  ensureNumber,
  solveTable,
  Table,
  p2a,
} from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Formula/AsyncChain',
};
export default meta;

/**
 * SUM_DELAY: async version of SUM that returns the result after 2 seconds.
 */
class SumDelayFunction extends BaseFunctionAsync {
  example = 'SUM_DELAY(1, 2, 3)';
  helpTexts = ['Returns the sum of values after a 2-second delay.'];
  helpArgs = [{ name: 'value1', description: 'Numbers to sum.' }];
  useInflight = false;

  ttlMilliseconds = 5000;

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
    const msg = `SUM_DELAY called with [${values.join(', ')}] at ${p2a(this.origin!)}`;
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
  helpTexts = ['Returns the sum of values after a 2-second delay.'];
  helpArgs = [{ name: 'value1', description: 'Numbers to sum.' }];

  ttlMilliseconds = 5000;

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
  'Demonstrates chained dependencies on an async formula.',
  '- **A1**: `=SUM_DELAY(10, 20)` — async function with 5s delay',
  '- **A2**: `=SUM_DELAY(A1, 100)` — async, depends on A1',
  '- **A3**: `=SUM_DELAY(A2, 200)` — async, depends on A2',
  '- **A4**: `=SUM_DELAY(A3, A1)` — async, depends on A3 and A1',
  '- **A5**: `=SUM(A1:A4)` — depends on all above',
  '',
  'All cells should show a pending animation until SUM_DELAY resolves, then cascade to their computed values.',
].join('\n\n');

const AsyncChainSheet = () => {
  const hub = useHub({
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
    <div style={{ display: 'flex', gap: '1rem' }}>
      <div className="async-inflight-false">
        <h3>inflight = false</h3>
        <GridSheet
          hub={hub}
          sheetName="AsyncChain"
          initialCells={buildInitialCells({
            cells: {
              default: {
                width: 250,
              },
              A: { width: 100 },
              A1: { value: '=SUM_DELAY(10, 20)' },
              A2: { value: '=SUM_DELAY(A1, 100)' },
              A3: { value: '=SUM_DELAY(A2, 200)' },
              A4: { value: '=SUM_DELAY(A3, A1)' },
              A5: { value: '=SUM_DELAY(A3, A1)' },
              A6: { value: '=SUM(A1:A4)' },
              A7: { value: '=SUM_DELAY()' },
              B1: { value: 'SUM_DELAY(10,20) → 30' },
              B2: { value: 'SUM_DELAY(A1,100) → 130' },
              B3: { value: 'SUM_DELAY(A2,200) → 330' },
              B4: { value: 'SUM_DELAY(A3,A1) → 360' },
              B5: { value: 'SUM_DELAY(A3,A1) → 360 (B4)' },
              B6: { value: 'SUM(A1:A4) → 850' },
              B7: { value: 'SUM_DELAY() → #ASYNC! ' },
            },
            ensured: { numRows: 6, numCols: 2 },
          })}
        />
        <textarea
          readOnly
          className="logs"
          style={{ width: '100%', height: 200 }}
          placeholder="AsyncChain history"
          value={logs1.join('\n')}
        ></textarea>
        When inflight = false, A4 and A5 are computed independently.
      </div>
      <div className="async-inflight-true">
        <h3>inflight = true</h3>
        <GridSheet
          hub={hub}
          sheetName="AsyncChainInflight"
          initialCells={buildInitialCells({
            cells: {
              default: {
                width: 300,
              },
              A: { width: 100 },
              A1: { value: '=SUM_DELAY_INFLIGHT(10, 20)' },
              A2: { value: '=SUM_DELAY_INFLIGHT(A1, 100)' },
              A3: { value: '=SUM_DELAY_INFLIGHT(A2, 200)' },
              A4: { value: '=SUM_DELAY_INFLIGHT(A3, A1)' },
              A5: { value: '=SUM_DELAY_INFLIGHT(A3, A1)' },
              A6: { value: '=SUM(A1:A4)' },
              A7: { value: '=SUM_DELAY_INFLIGHT()' },
              B1: { value: 'SUM_DELAY_INFLIGHT(10,20) → 30' },
              B2: { value: 'SUM_DELAY_INFLIGHT(A1,100) → 130' },
              B3: { value: 'SUM_DELAY_INFLIGHT(A2,200) → 330' },
              B4: { value: 'SUM_DELAY_INFLIGHT(A3,A1) → 360' },
              B5: { value: 'SUM_DELAY_INFLIGHT(A3,A1) → 360 (B4)' },
              B6: { value: 'SUM(A1:A4) → 850' },
              B7: { value: 'SUM_DELAY_INFLIGHT() → #ASYNC! ' },
            },
            ensured: { numRows: 6, numCols: 2 },
          })}
        />
        <textarea
          readOnly
          className="logs"
          style={{ width: '100%', height: 200 }}
          placeholder="AsyncChainInflight history"
          value={logs2.join('\n')}
        ></textarea>
        When inflight = true, A4 and A5 are computed only once.
      </div>
    </div>
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
