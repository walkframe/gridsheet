import React from 'react';
import { constructInitialCells, GridSheet } from '@gridsheet/react-core';

export default {
  title: 'Formula',
};

export const NoFormulaBar = () => {
  return (
    <>
      <GridSheet
        initialCells={constructInitialCells({
          matrices: {},
          cells: {
            default: {
              width: 50,
            },
          },
          ensured: { numRows: 10, numCols: 10 },
        })}
        options={{
          sheetHeight: 600,
          showFormulaBar: false,
        }}
      />
    </>
  );
};
