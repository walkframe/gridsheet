import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Formula/Row',
};
export default meta;

const DESCRIPTION = [
  'This demo showcases the ROW() function in GridSheet.',
  'It demonstrates how to get the row number of the current cell or a specified cell.',
  'The ROW() function returns the row number (1-based) of the cell where it is used.',
].join('\n\n');

const RowSheet = () => {
  return (
    <GridSheet
      initialCells={buildInitialCells({
        cells: {
          A1: { value: '=ROW()' },
          A2: { value: '=ROW()' },
          B1: { value: '=ROW()' },
          C5: { value: '=ROW()' },
          C6: { value: '=ROW(A3)' },
        },
        ensured: { numRows: 100, numCols: 100 },
      })}
      options={{}}
    />
  );
};

export const Row: StoryObj = {
  render: () => <RowSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
