import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet, useHub } from '@gridsheet/react-core';
import { allFunctions } from '@gridsheet/functions';

const meta: Meta = {
  title: 'Formula/ColRow',
};
export default meta;

const DESCRIPTION = [
  'This demo showcases the ROW() and COLUMN() functions in GridSheet.',
  'ROW() returns the row number (1-based) of the cell where it is used.',
  'COLUMN() returns the column number (1-based) of the cell where it is used.',
].join('\n\n');

// ROW() examples are placed in columns A-C
// COLUMN() examples are placed in columns E-H
const ColRowSheet = () => {
  const hub = useHub({
    additionalFunctions: allFunctions,
  });
  return (
    <GridSheet
      hub={hub}
      initialCells={buildInitialCells({
        cells: {
          // ROW()
          A1: { value: '=ROW()' },
          A2: { value: '=ROW()' },
          B1: { value: '=ROW()' },
          C5: { value: '=ROW()' },
          C6: { value: '=ROW(A3)' },
          H2: { value: '=ARRAYFORMULA(ROW(B1:D3))' },
          // COLUMN()
          E1: { value: '=COLUMN()' },
          E2: { value: '=COLUMN()' },
          F1: { value: '=COLUMN()' },
          G5: { value: '=COLUMN()' },
          G6: { value: '=COLUMN(A3)' },
          H6: { value: '=ARRAYFORMULA(COLUMN(B1:D3))' },
        },
        ensured: { numRows: 20, numCols: 15 },
      })}
      options={{}}
    />
  );
};

export const ColRow: StoryObj = {
  render: () => <ColRowSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
