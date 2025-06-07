import React from 'react';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';

export default {
  title: 'Formula',
};

export const Row = () => {
  return (
    <>
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
    </>
  );
};
