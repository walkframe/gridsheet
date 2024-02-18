import React from "react";
import { generateInitial, GridSheet } from "../../../src";

export default {
  title: "Formula",
};

export const NoFormulaBar = () => {
  return (
    <>
      <GridSheet
        initial={generateInitial({
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
