import React from 'react';
import { GridSheet, buildInitialCells, createTableRef, Table } from '@gridsheet/react-core';

export default {
  title: 'Table operations',
};

export const Replace = () => {
  const tableRef = createTableRef();

  return (
    <>
      <GridSheet
        tableRef={tableRef}
        initialCells={buildInitialCells({
          cells: {},
          ensured: {
            numRows: 50,
            numCols: 50,
          },
        })}
      />
      <br />
      <button
        onClick={() => {
          const dispatch = tableRef.current?.dispatch;
          if (dispatch == null) {
            return;
          }

          const table = new Table({});
          table.initialize(
            buildInitialCells({
              cells: {},
              matrices: {
                A1: [
                  [1, 2, 3],
                  [6, 7, 8],
                ],
              },
            }),
          );
          dispatch(table);
        }}
      >
        Replace
      </button>
    </>
  );
};
