import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet, useHub } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Formula/Disabled',
};
export default meta;

const DESCRIPTION = [
  'This demo showcases disabled formula functionality in GridSheet.',
  'It demonstrates how to disable formula evaluation for specific cells.',
  'The demo compares cells with formulas enabled and disabled to show the difference.',
].join('\n\n');

const DisabledSheet = () => {
  const hub = useHub({
    labelers: {
      disabled: (n) => {
        return 'disabled formula';
      },
    },
  });
  return (
    <GridSheet
      hub={hub}
      initialCells={buildInitialCells({
        cells: {
          A: { labeler: 'disabled', width: 150 },
          A1: { value: '=1+1', disableFormula: true },
          B1: { value: '=1+1' },
          A2: { value: "'quote", disableFormula: true },
          B2: { value: "'quote" },
          A3: { value: "'0123", disableFormula: true },
          B3: { value: "'0123" },
          A4: { value: '0123', disableFormula: true },
          B4: { value: '0123' },
          A5: { value: 123, disableFormula: true },
          B5: { value: 123 },
        },
        ensured: { numRows: 5, numCols: 5 },
      })}
    />
  );
};

export const Disabled: StoryObj = {
  render: () => <DisabledSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
