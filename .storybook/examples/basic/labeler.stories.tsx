import React from "react";
import { generateInitial, GridSheet } from "../../../src";

export default {
  title: "Basic",
};

export const Labeler = () => {
  return (
    <>
      <GridSheet
        initial={generateInitial({
          cells: {
            A: { labeler: "hiragana" },
            B: { labeler: "hiragana" },
            C: { labeler: "hiragana" },
            D: { labeler: "hiragana" },
            E: { labeler: "hiragana" },
            1: { labeler: "katakana" },
            2: { labeler: "katakana" },
            3: { labeler: "katakana" },
            4: { labeler: "katakana" },
            5: { labeler: "katakana" },
            A1: {value: "=SUM($B$1:B2)"}
          },
          ensured: { numRows: 100, numCols: 100 },
        })}
        options={{
          labelers: {
            hiragana: (n) => "あいうえおかきくけこ".slice(n - 1, n),
            katakana: (n) => "アイウエオカキクケコ".slice(n - 1, n),
          },
        }}
      />
    </>
  );
};
