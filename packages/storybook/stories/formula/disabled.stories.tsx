import React from 'react';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';

export default {
  title: 'Formula',
};

export const Disabled = () => {
  return (
    <>
      <GridSheet
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
        options={{
          labelers: {
            disabled: (n) => {
              return 'disabled formula';
            },
          },
        }}
      />
    </>
  );
};
