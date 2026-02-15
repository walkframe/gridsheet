import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  BaseFunction,
  buildInitialCells,
  GridSheet,
  useHub,
  ensureNumber,
  solveTable,
  Table,
} from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Formula/AsyncChain',
};
export default meta;

/**
 * SUM_DELAY: async version of SUM that returns the result after 5 seconds.
 */
class SumDelayFunction extends BaseFunction {
  example = 'SUM_DELAY(1, 2, 3)';
  helpTexts = ['Returns the sum of values after a 5-second delay.'];
  helpArgs = [{ name: 'value1', description: 'Numbers to sum.' }];

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
    await new Promise((resolve) => setTimeout(resolve, 5000));
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
      sum_delay: SumDelayFunction as any,
    },
  });
  return (
    <div>
      <GridSheet
        hub={hub}
        sheetName="AsyncChain"
        initialCells={buildInitialCells({
          cells: {
            default: {
              width: 250,
            },
            A1: { value: '=SUM_DELAY(10, 20)' },
            A2: { value: '=SUM_DELAY(A1, 100)' },
            A3: { value: '=SUM_DELAY(A2, 200)' },
            A4: { value: '=SUM_DELAY(A3, A1)' },
            A5: { value: '=SUM(A1:A4)' },
            B1: { value: 'SUM_DELAY(10,20) → 30' },
            B2: { value: 'SUM_DELAY(A1,100) → 130' },
            B3: { value: 'SUM_DELAY(A2,200) → 330' },
            B4: { value: 'SUM_DELAY(A3,A1) → 360' },
            B5: { value: 'SUM(A1:A4) → 850' },
          },
          ensured: { numRows: 5, numCols: 2 },
        })}
      />
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
