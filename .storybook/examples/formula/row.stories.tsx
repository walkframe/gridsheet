import React from "react";
import { generateInitial, GridSheet } from "../../../src";

export default {
  title: "Formula",
};

export const Row = () => {
  return (
    <>
      <GridSheet
        initial={generateInitial({
          cells: {
            A1: { value: "=ROW()" },
            A2: { value: "=ROW()" },
            B1: { value: "=ROW()" },
            C5: { value: "=ROW()" },
            C6: { value: "=ROW(A3)" },
          },
          ensured: { numRows: 100, numCols: 100 },
        })}
        options={{}}
      />
    </>
  );
};
