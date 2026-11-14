import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/react-core/spellbook';

const meta: Meta = {
  title: 'Formula/Precedence',
};
export default meta;

const DESCRIPTION = [
  'Operator precedence and rounding, matching Excel / Google Sheets.',
  'Negation binds tighter than `^` (`=-2^2` is 4), while subtraction does not (`=0-2^2` is -4).',
  'ROUND has no floating-point scaling error and rounds half away from zero.',
  'Column D compares the result (B) with the expected value (C).',
  'See https://github.com/walkframe/gridsheet/issues/163',
].join('\n\n');

// [formula, expected]
const PRECEDENCE_CASES: [string, number | boolean][] = [
  // negation inside a binary expression
  ['=10 + -2 * 3', 4],
  ['=10 + -2 ^ 2', 14],
  ['=2 * -3 ^ 2', 18],
  ['=(10 + -2 * 3)', 4],
  ['=SUM(1, -2 * 3, 10)', 5],
  // leading negation binds tighter than ^
  ['=-2 ^ 2', 4],
  ['=0 + -2 ^ 2', 4],
  ['=0 - 2 ^ 2', -4],
  ['=-50%', -0.5],
  // three or more precedence levels
  ['=1 = 2 + 3 * 4 - 5', false],
  ['=1 + 2 * 3 ^ 2 - 4 / 2', 17],
  // left associativity
  ['=10 - 3 - 2', 5],
  ['=2 ^ 3 ^ 2', 64],
  // rounding
  ['=ROUND(1.005, 2)', 1.01],
  ['=ROUND(35.855, 2)', 35.86],
  ['=ROUND(-2.5, 0)', -3],
  ['=ROUNDDOWN(0.29, 2)', 0.29],
];

const PrecedenceSheet = () => {
  const book = useSpellbook();
  return (
    <GridSheet
      book={book}
      initialCells={buildInitialCells({
        matrices: {
          A1: PRECEDENCE_CASES.map(([f, expected], i) => [f, f, expected, `=B${i + 1}=C${i + 1}`]),
        },
        cells: {
          A: { width: 220, formulaEnabled: false, label: 'formula' },
          B: { width: 120, label: 'result' },
          C: { width: 120, label: 'expected' },
          D: { width: 80, label: 'OK?' },
        },
        ensured: { numRows: PRECEDENCE_CASES.length + 2, numCols: 4 },
        flattenAs: undefined,
      })}
      options={{ sheetHeight: 600 }}
    />
  );
};

export const Precedence: StoryObj = {
  render: () => <PrecedenceSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
