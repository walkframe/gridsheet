import React from "react";
import { BaseFunction } from "../../../src";
import { generateInitial, GridSheet } from "../../../src";

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
        initial={generateInitial({
          cells: {
            default: { width: 200 },
            B2: { value: '=HOPE("WORLD PEACE") & "!"' },
            A3: { value: "=test()" },
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
