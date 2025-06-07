import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet, operations } from '@gridsheet/react-core';

type Props = {
  numRows: number;
  numCols: number;
  defaultWidth: number;
};

const Sheet = ({ numRows, numCols, defaultWidth }: Props) => {
  return (
    <>
      <GridSheet
        options={{
          headerHeight: 50,
          headerWidth: 150,
        }}
        initialCells={buildInitialCells({
          cells: {
            default: { width: defaultWidth },
            4: {
              prevention: operations.DeleteRow,
            },
            1: {
              prevention: operations.Resize,
              style: { backgroundColor: '#eeeeee' },
            },
            'A:B': {
              prevention: operations.AddCol | operations.DeleteCol,
              style: { backgroundColor: '#dddddd' },
            },
            A: {
              prevention: operations.Resize,
              style: { backgroundColor: '#eeeeee' },
            },
            C: {
              style: { backgroundColor: '#ffffff' },
            },
            B2: {
              value: 'READONLY',
              prevention: operations.ReadOnly,
              style: { backgroundColor: '#aaaaaa' },
            },
          },
          ensured: { numRows, numCols },
        })}
      />
    </>
  );
};

export const Prevention: StoryObj<typeof Sheet> = {
  args: { numRows: 50, numCols: 20, defaultWidth: 50 },
};

export default {
  title: 'Protection',
  component: Sheet,
};
