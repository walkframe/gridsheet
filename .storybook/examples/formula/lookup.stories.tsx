import React from "react";
import { generateInitial, GridSheet } from "../../../src";

export default {
  title: "Formula",
};

export const LookUp = () => {
  return (
    <>
      <h1>HLOOKUP</h1>
      <GridSheet
        initial={generateInitial({
          cells: {
            1: { style: { backgroundColor: "#ddd" } },
            A4: { style: { backgroundColor: "#ddd" } },
            B4: { style: { backgroundColor: "#ddd" } },
            C4: { style: { backgroundColor: "#ddd" } },
          },
          ensured: { numRows: 10, numCols: 10 },
          matrixes: {
            A1: [
              [
                0,
                "=A1+60",
                "=B1+10",
                "=C1+10",
                "=D1+10",
                "=E1+5",
                "",
                "",
                "",
                "",
              ],
              ["E", "D", "C", "B", "A", "S", "", "", "", ""],
              ["", "", "", "", "", "", "", "", "", ""],
              ["Name", "Point", "Rank", "", "", "", "", "", "", ""],
              [
                "apple",
                50,
                "=HLOOKUP(B5, $A$1:$F$2, 2, true)",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
              ],
              [
                "orange",
                82,
                "=HLOOKUP(B6, A1:F2, 2, true)",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
              ],
              [
                "grape",
                75,
                "=HLOOKUP(B7, A1:F2, 2, true)",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
              ],
              [
                "melon",
                98,
                "=HLOOKUP(B8, A1:F2, 2, true)",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
              ],
              [
                "banana",
                65,
                "=HLOOKUP(B9, A1:F2, 2, true)",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
              ],
            ],
          },
        })}
        options={{}}
      />
      <h1>VLOOKUP</h1>
      <GridSheet
        initial={generateInitial({
          cells: {
            A: { width: 30 },
            C: { width: 40 },
            D: { width: 50, style: { textAlign: "right" } },
            E: { width: 130 },
          },
          matrixes: {
            A1: [
              [0, "子🐭"],
              [1, "丑🐮"],
              [2, "寅🐯"],
              [3, "卯🐰"],
              [4, "辰🐲"],
              [5, "巳🐍"],
              [6, "午🐴"],
              [7, "未🐑"],
              [8, "申🐵"],
              [9, "酉🐔"],
              [10, "戌🐶"],
              [11, "亥🐗"],
            ],
            D1: [
              [
                2022,
                "年(西暦)の干支:",
                `=VLOOKUP(MOD(D1 - 4, 12), $A$1:$B$12, 2, false)`,
              ],
              [
                2021,
                "年(西暦)の干支:",
                `=VLOOKUP(MOD(D2 - 4, 12), $A$1:$B$12, 2, false)`,
              ],
              [
                2020,
                "年(西暦)の干支:",
                `=VLOOKUP(MOD(D3 - 4, 12), $A$1:$B$12, 2, false)`,
              ],
              [
                2019,
                "年(西暦)の干支:",
                `=VLOOKUP(MOD(D4 - 4, 12), $A$1:$B$12, 2, false)`,
              ],
              [
                2018,
                "年(西暦)の干支:",
                `=VLOOKUP(MOD(D5 - 4, 12), $A$1:$B$12, 2, false)`,
              ],
            ],
          },
        })}
      />
    </>
  );
};
