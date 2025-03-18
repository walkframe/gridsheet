import React from "react";
import { ComponentStory } from "@storybook/react";
import { GridSheet, constructInitialCells, createTableRef, HistoryType, Table } from "@gridsheet/react-core";

export default {
  title: "Table operations",
};


export const Rewrite = () => {
  const tableRef = createTableRef();

  return (
    <>
      <GridSheet
        tableRef={tableRef}
        initialCells={constructInitialCells({
          cells: {},
          ensured: {
            numRows: 50,
            numCols: 50,
          },
        })}
      />
      <br />
      <button onClick={() => {
        const dispatch = tableRef.current?.dispatch;
        if (dispatch == null) {
          return;
        }
        
        const table = new Table({});
        table.initialize(constructInitialCells({
          cells: {},
          matrices: {
            A1: [
              [1, 2, 3],
              [6, 7, 8],
            ],
          },
        }))
        dispatch(table);
      }}>
        Rewrite
      </button>
    </>
  );
};

