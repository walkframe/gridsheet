import React from "react";
import { BaseFunction } from "../../../src";
import { constructInitialCells, GridSheet } from "../../../src";

export default {
  title: "Formula",
};

class HopeFunction extends BaseFunction {
  main(text: string) {
    return `😸${text}😸`;
  }
}

class TestFunction extends BaseFunction {
  main() {
    return "てすとだよ";
  }
}

export const CustomFunction = () => {
  return (
    <>
      <GridSheet
        initialCells={constructInitialCells({
          cells: {
            default: { width: 200 },
            B2: { value: '=HOPE("WORLD PEACE") & "!"' },
            A3: { value: "=test()" },
          },
          ensured: {
            numRows: 10,
            numCols: 10,
          },
        })}
        additionalFunctions={{
          hope: HopeFunction,
          test: TestFunction,
        }}
      />
    </>
  );
};
