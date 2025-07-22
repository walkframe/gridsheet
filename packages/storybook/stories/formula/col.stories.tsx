import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Formula/Col',
};
export default meta;

const DESCRIPTION = [
  'This demo showcases the COL() function in GridSheet.',
  'It demonstrates how to get the column number of the current cell or a specified cell.',
  'The COL() function returns the column number (1-based) of the cell where it is used.',
].join('\n\n');

const ColSheet = () => {
  return (
    <GridSheet
      initialCells={buildInitialCells({
        cells: {
          A1: { value: '=COL()' },
          A2: { value: '=COL()' },
          B1: { value: '=COL()' },
          C5: { value: '=COL()' },
          C6: { value: '=COL(A3)' },
        },
        ensured: { numRows: 100, numCols: 100 },
      })}
      options={{}}
    />
  );
};

export const Col: StoryObj = {
  render: () => <ColSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
