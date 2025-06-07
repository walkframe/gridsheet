import React from 'react';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';

export default {
  title: 'Formula',
};

export const Col = () => {
  return (
    <>
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
    </>
  );
};
