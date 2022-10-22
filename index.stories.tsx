import React from "react";
import { GridSheet, Renderer, aa2oa, MatrixType, Parser } from "./src";
import { createMatrix, matrixIntoCells } from "./src/api/structs";
import { defaultParser } from "./src/parsers/core";
import { defaultRenderer } from "./src/renderers/core";
import { CellType, Dispatcher } from "./src/types";
import { BaseFunction } from "./src";
import { createTableRef } from "./src/components/GridTable";

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

type Obj = { v: any };

class ObjectRenderer extends Renderer {
  object(cell: CellType): any {
    const { value } = cell;
    return value.v;
  }
  stringify(cell: CellType): string {
    const { value } = cell;
    return "" + (value?.v || "");
  }
}

class ObjectParser<T extends Obj> extends Parser {
  callback(value: any, cell: CellType): T {
    console.log("callback", value, "=>", { v: value });
    return value;
  }
}

class KanjiRenderer extends Renderer {
  protected kanjiMap: { [s: string]: string } = {
    "0": "〇",
    "1": "一",
    "2": "二",
    "3": "三",
    "4": "四",
    "5": "五",
    "6": "六",
    "7": "七",
    "8": "八",
    "9": "九",
    ".": ".",
  };
  number(value: number): string {
    let kanji = "";
    let [int, fraction] = String(value).split(".");
    for (let i = 0; i < int.length; i++) {
      const j = int.length - i;
      if (j % 3 === 0 && i !== 0) {
        kanji += ",";
      }
      kanji += this.kanjiMap[int[i]];
    }
    if (fraction == null) {
      return kanji;
    }
    kanji += ".";
    for (let i = 0; i < fraction.length; i++) {
      kanji += this.kanjiMap[fraction[i]];
    }
    return kanji;
  }
}

export default {
  title: "grid sheet",
};

const initialDataForFormula = [
  [0, "=A1+60", "=B1+10", "=C1+10", "=D1+10", "=E1+5", "", "", "", ""],
  ["E", "D", "C", "B", "A", "S", "", "", "", ""],
  ["", "", "", "", "", "NOW:", "=NOW()", "", "", ""],
  ["Name", "Point", "Rank", "", "", "", '=HOPE("World peace")', "", "", ""],
  ["apple", 50, "=HLOOKUP(B5, A1:F2, 2, true)", "", "", "", "", "", "", ""],
  ["orange", 82, "=HLOOKUP(B6, A1:F2, 2, true)", "", "", "", "", "", "", ""],
  [
    "grape",
    75,
    "=HLOOKUP(B7, A1:F2, 2, true)",
    "",
    "",
    "",
    "Greater than",
    70,
    "",
    "",
  ],
  [
    "meron",
    98,
    "=HLOOKUP(B8, A1:F2, 2, true)",
    "",
    "",
    "",
    '\'=countif(B5:B9, ">" & H7)',
    '=countif(B5:B9, ">" & H7)',
    "",
    "",
  ],
  ["banana", 65, "=HLOOKUP(B9, A1:F2, 2, true)", "", "", "", "", "", "", ""],
];

const initialData = [
  [
    123456,
    "'=1+2+3+4",
    "=1+2+3+4",
    "d",
    "e",
    "aa",
    "bb",
    "cc",
    [1, 2, 3],
    "ee",
  ],
  ["a", "b", 789, "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "=test()", "aa", "bb", "cc", "dd", "ee"],
  ["=C2", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  [true, "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  [false, "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  [123456, "b", "c", "d", "e", "aa", "bb", "cc", [1, 2, 3], "ee"],
  ["a", "b", 789, "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  [true, "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  [false, "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  [123456, "b", "c", "d", "e", "aa", "bb", "cc", [1, 2, 3], "ee"],
  ["a", "b", 789, "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  ["a", "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  [true, "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
  [false, "b", "c", "d", "e", "aa", "bb", "cc", "dd", "ee"],
];

const initialCells = matrixIntoCells(createMatrix(1000, 50), {});

export const showIndex = () => {
  const ref = createTableRef();
  /*
  setInterval(() => {
    if (ref.current) {
      ref.current.dispatch(
        ref.current.table.update({ A1: { value: new Date() } }, true)
      );
    }
  }, 10000);
  */
  return (
    <>
      <div>aaaaa</div>

      <GridSheet
        initial={matrixIntoCells(initialDataForFormula, {
          1: { style: { backgroundColor: "#aaa" } },
          2: { style: { backgroundColor: "#eee" } },
          3: { style: {} },
          A: { width: 50 },
          B: { width: 50 },
          C: { width: 50 },
          D: { width: 50 },
          E: { width: 50 },
          F: { width: 50 },
          G: { width: 200 },
          H7: { style: { backgroundColor: "#ffeeee" } },
          A4: {
            style: { backgroundColor: "#dddddd", borderBottomStyle: "double" },
          },
          B4: {
            style: { backgroundColor: "#dddddd", borderBottomStyle: "double" },
          },
          C4: {
            style: { backgroundColor: "#dddddd", borderBottomStyle: "double" },
          },
        })}
        additionalFunctions={{
          hope: HopeFunction,
        }}
      />

      <GridSheet
        tableRef={ref}
        additionalFunctions={{
          test: TestFunction,
        }}
        initial={matrixIntoCells(initialData, {
          default: { style: { fontStyle: "italic" } },
          A1: { value: 1, style: { color: "#008888" } },
          B: { labeler: "b" },
          D: { width: 300, style: { textAlign: "right" } },
          "2": {
            labeler: "2",
            style: { borderBottom: "double 4px #000000" },
            renderer: "kanji",
          },
          "3": {
            height: 100,
            labeler: "rowNumber",
            style: {
              fontWeight: "bold",
              color: "#ff0000",
              backgroundColor: "rgba(255, 200, 200, 0.5)",
            },
          },
          "4": {
            height: 50,
            verticalAlign: "bottom",
          },
          "5": {
            height: 100,
            style: {
              fontWeight: "bold",
              color: "#000fff",
              backgroundColor: "rgba(0, 200, 200, 0.5)",
            },
          },
          "6": {
            height: 100,
            style: {
              fontWeight: "bold",
              color: "#ff0000",
              backgroundColor: "rgba(255, 200, 200, 0.5)",
            },
          },
        })}
        options={{
          // cellLabel: false,
          // headerWidth: 50,
          numCols: 10,
          numRows: 10,
          headerHeight: 40,
          historyLimit: 100,
          mode: "dark",
          labelers: {
            rowNumber: (row) => `${row}行目`,
            b: (n) => "ビー",
            "2": (n) => "二",
          },
          //stickyHeaders: "horizontal",
          /*
          onSave: (table, positions) => {
            console.log(
              "matrix on save:",
              aa2oa(table.matrix() || [], ["A", "B", "C", "D", "E", "F"])
            );
            console.log("positions on save", positions);
          },
          onChange: (table, positions) => {
            console.log("matrix on change:", table.matrixFlatten());
            if (typeof positions !== "undefined") {
              console.log("positions on change", positions);
            }
          },
          onChangeDiff: (table, positions) => {
            console.log(
              "matrix on change diff:",
              table.top(),
              //table.rows(),
              table.objectFlatten()
            );
          },
          onChangeDiffNumMatrix: (coordinate) => {
            console.log("add or remove", coordinate);
          },
          onSelect: (table, positions) => {
            console.log("positions on select", positions);
          },
          */
          renderers: {
            kanji: new KanjiRenderer(),
          },
        }}
      />
      <br />
      <br />
      <hr />

      {true && (
        <table style={{ width: "100%", tableLayout: "fixed" }}>
          <tbody>
            <tr>
              <td>
                {" "}
                <GridSheet
                  style={{ maxWidth: "100%", maxHeight: "150px" }}
                  initial={matrixIntoCells(
                    [
                      ["resizable", "both", "!"],
                      [1, 2, 3],
                      [undefined, 5, 6],
                    ],
                    { A3: { value: "four" } }
                  )}
                  options={{ sheetResize: "both", historyLimit: 2 }}
                />
              </td>
              <td>
                {" "}
                <GridSheet
                  style={{ maxWidth: "100%", maxHeight: "150px" }}
                  initial={matrixIntoCells(
                    [
                      ["resizable", "vertically", "!"],
                      [1, 2, 3],
                      [4, undefined, 6],
                    ],
                    { B3: { value: "five" } }
                  )}
                  options={{ sheetResize: "vertical", historyLimit: 2 }}
                />
              </td>
            </tr>
            <tr>
              <td>
                {" "}
                <GridSheet
                  style={{ maxWidth: "100%", maxHeight: "150px" }}
                  initial={matrixIntoCells(
                    [
                      ["resizable", "horizontally", "!"],
                      [1, 2, 3],
                      [4, 5, undefined],
                    ],
                    { C3: { value: "six" } }
                  )}
                  options={{ sheetResize: "horizontal", historyLimit: 2 }}
                />
              </td>
              <td>
                {" "}
                <GridSheet
                  style={{ maxWidth: "100%", maxHeight: "150px" }}
                  initial={matrixIntoCells(
                    [
                      ["not", "resizable", "!!!"],
                      [1, 2, 3],
                      [4, 5, 6],
                    ],
                    { A3: { value: "four" } }
                  )}
                  options={{ sheetResize: "none", historyLimit: 2 }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      )}
      <div>object value</div>
      <GridSheet
        initial={{
          default: {
            renderer: "obj",
            parser: "obj",
          },
          B4: {
            renderer: "default",
            parser: "default",
          },
        }}
        options={{
          renderers: {
            obj: new ObjectRenderer(),
            default: defaultRenderer,
          },
          parsers: {
            obj: new ObjectParser(),
            default: defaultParser,
          },
          onChange: (table, positions) => {
            if (typeof positions !== "undefined") {
              console.log("positions on change", positions);
            }
          },
          onChangeDiff: (table, positions) => {
            console.log("matrix on change diff:", table.getObjectFlatten());
          },
        }}
      />

      <GridSheet
        style={{ maxWidth: "100%", maxHeight: "150px" }}
        initial={initialCells}
        options={{
          sheetResize: "both",
          onChange: (table, positions) => {
            console.log(
              "diff",
              table.getObjectFlatten({
                filter: (cell) =>
                  !!cell?.changedAt && cell.changedAt > table.lastChangedAt!,
              })
            );
          },
        }}
      />
    </>
  );
};
