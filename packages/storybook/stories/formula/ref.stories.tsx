import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Formula/Ref',
};
export default meta;

const DESCRIPTION = ['## Example'].join('\n\n');

const RefsSheet = () => {
  return (
    <GridSheet
      initialCells={buildInitialCells({
        cells: {
          A: { width: 150 },
          A1: { value: '#REF!(circulating)' },
          B1: { value: '=C1' },
          C1: { value: '=D1' },
          D1: { value: '=B1' },

          A2: { value: '#REF!(refers itself)' },
          B2: { value: 1 },
          C2: { value: 2 },
          D2: { value: '=D2' },

          A3: { value: '#REF!(contains itself)' },
          B3: { value: 3 },
          C3: { value: 4 },
          D3: { value: '=SUM(A3:Z3)' },

          A4: { value: '#REF!(index to itself)' },
          B4: { value: 5 },
          C4: { value: 6 },
          D4: { value: '=INDEX(A4:D4, 1, 4)' },

          A6: { value: 'SUM(A2:D2)' },
          B6: { value: 10 },
          C6: { value: '=B6' }, //
          D6: { value: '=B6 + 1' },
          E6: { value: '=SUM(B6:D6)' },

          A7: { value: 'Fibonacci' },
          B7: { value: 1 },
          C7: { value: 1 },
          D7: { value: '=B7 + C7' },
          E7: { value: '=C7 + D7' },
          F7: { value: '=D7 + E7' },
          G7: { value: '=E7 + F7' },
          H7: { value: '=F7 + G7' },
          I7: { value: '=G7 + H7' },
          J7: { value: '=H7 + I7' },

          B9: { value: 1 },
          C9: { value: 2 },
          B10: { value: 3 },
          C10: { value: 4 },

          D9: { value: 5 },
          E9: { value: 6 },
          D10: { value: 7 },
          E10: { value: 8 },

          F9: { value: '=SUM(B9:E9)' },
          F10: { value: '=SUM(B10:E10)' },

          B11: { value: 9 },
          C11: { value: 10 },
          B12: { value: 11 },
          C12: { value: 12 },

          B13: { value: '=SUM(B9:B12)' },
          C13: { value: '=SUM(C9:C12)' },
        },
        ensured: { numRows: 10, numCols: 10 },
      })}
      options={{}}
    />
  );
};

export const Refs: StoryObj = {
  render: () => <RefsSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
