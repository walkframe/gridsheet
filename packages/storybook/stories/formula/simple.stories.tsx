import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet, useHub } from '@gridsheet/react-core';
import { allFunctions } from '@gridsheet/functions';

const meta: Meta = {
  title: 'Formula/Simple',
};
export default meta;

const DESCRIPTION = [
  'This demo showcases basic formula calculations in GridSheet.',
  'Column A shows the formula text (formula evaluation disabled), and column B shows the calculated result.',
  'It also verifies that calculations with blank cells do not produce #VALUE! errors.',
].join('\n\n');

// Each entry is a formula string.
// Column A: displayed as text (formulaEnabled: false)
// Column B: evaluated as a formula
const FORMULAS = [
  // Basic arithmetic
  '=100 + 5',
  '=B1 - 60',
  '=B2 * B1',
  // Division / exponentiation
  '=100 / 5',
  '=B4 ^ 3',
  '=B5 * -4',
  // Order of operations
  '=(10 + 4) * 5',
  '=B7 - 14 / 2',
  '=(B7 - 14) / 2',
  // String concatenation
  '=500 * 10 ^ 12 & "円"',
  '=B10 & "ほしい！"',
  '="とても" & B11',
  // Equality operators
  '=100 = 100',
  '=100 = 200',
  '=100 <> 100',
  '=100 <> 200',
  // Greater-than operators
  '=100 > 99',
  '=100 > 101',
  '=100 >= 100',
  '=100 >= 101',
  // Less-than operators
  '=100 < 99',
  '=100 < 101',
  '=100 <= 100',
  '=100 <= 99',
  // MOD function
  '=MOD(8, 3)',
  '=MOD(8, 2)',
  '=MOD(8, 10)',
  '=MOD(-8, 3)',
  '=MOD(8, -3)',
  // Blank-cell arithmetic — D column is intentionally empty
  '=D1 + 100',
  '=D1 * 100',
  '=D1 & "abc"',
  '=D1 + D2',
  // Leading zero: string "0123" is parsed as number → drops leading zero
  '0123',
  // Quote prefix: "'0123" is kept as text → preserves leading zero
  "'0123",
];

const matrix = FORMULAS.map((f) => [f, f]);

const SimpleCalculationSheet = () => {
  const hub = useHub({
    additionalFunctions: allFunctions,
  });
  return (
    <GridSheet
      hub={hub}
      initialCells={buildInitialCells({
        matrices: { A1: matrix },
        cells: {
          A: { width: 200, formulaEnabled: false, label: 'formula (text)' },
          B: { width: 280, label: 'result' },
        },
        ensured: { numRows: 100, numCols: 10 },
        flattenAs: undefined,
      })}
      options={{
        sheetHeight: 600,
      }}
    />
  );
};

export const SimpleCalculation: StoryObj = {
  render: () => <SimpleCalculationSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
