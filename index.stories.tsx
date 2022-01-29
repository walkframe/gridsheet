import React from "react";
import { GridSheet, Renderer, aa2oa, MatrixType, Parser } from "./src";
import { createMatrix, matrixIntoCells } from "./src/api/matrix";
import { defaultParser } from "./src/parsers/core";
import { defaultRenderer } from "./src/renderers/core";
// import { GridSheet, Renderer, aa2oa } from "../dist";

type Obj = {v: any};

class ObjectRenderer extends Renderer {
  object(value: Obj): any {
    return value.v;
  }
  stringify(value: Obj): string {
    return "" + (value?.v || "");
  }
}

class ObjectParser<T extends Obj> extends Parser {
  callback(value: any, old: T): T {
    console.log("callback", old, value, "=>", {...old, v: value});
    return {...old, v: value};
  }
};

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

const initialData = [
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

const initialCells = matrixIntoCells(createMatrix(1000, 50), {})

export const showIndex = () => {

  return (
    <>
      <div>aaaaa</div>

      <GridSheet
        cells={matrixIntoCells(initialData, {
          default: { style: { fontStyle: "italic" } },
          A1: { data: 1, style: { color: "#008888" } },
          B: { label: "ビー" },
          D: { width: 300, style: { textAlign: "right" } },
          "2": {
            label: "二",
            style: { borderBottom: "double 4px #000000" },
            renderer: "kanji",
          },
          "3": {
            height: 100,
            label: (row) => `${row}行目`,
            style: {
              fontWeight: "bold",
              color: "#ff0000",
              backgroundColor: "rgba(255, 200, 200, 0.5)",
            },
          },
          "4": {
            label: "よん",
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
          historySize: 100,
          mode: "dark",
          //stickyHeaders: "horizontal",
          onSave: (table, positions) => {
            console.log(
              "matrix on save:",
              aa2oa(table.matrix() || [], ["A", "B", "C", "D", "E", "F"])
            );
            console.log("positions on save", positions);
          },
          onChange: (table, positions) => {
            console.log(
              "matrix on change:",
              table.matrixFlatten()
            );
            if (typeof positions !== "undefined") {
              console.log("positions on change", positions);
            }
          },
          onChangeDiff: (table, positions) => {
            console.log(
              "matrix on change diff:",
              table.top(),
              //table.rows(),
              table.rowsFlatten(),
            );
          },
          onSelect: (table, positions) => {
            console.log("positions on select", positions)
          },
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
                  cells={matrixIntoCells([["resizable", "both", "!"], [1, 2, 3], [undefined, 5, 6]], {A3: {data: "four"}})}
                  options={{ sheetResize: "both" }}
                />
              </td>
              <td>
                {" "}
                <GridSheet
                  style={{ maxWidth: "100%", maxHeight: "150px" }}
                  cells={matrixIntoCells([["resizable", "vertically", "!"], [1, 2, 3], [4, undefined, 6]], {B3: {data: "five"}})}
                  options={{ sheetResize: "vertical" }}
                />
              </td>
            </tr>
            <tr>
              <td>
                {" "}
                <GridSheet
                  style={{ maxWidth: "100%", maxHeight: "150px" }}
                  cells={matrixIntoCells([["resizable", "horizontally", "!"], [1, 2, 3], [4, 5, undefined]], {C3: {data: "six"}})}
                  options={{ sheetResize: "horizontal" }}
                />
              </td>
              <td>
                {" "}
                <GridSheet
                  style={{ maxWidth: "100%", maxHeight: "150px" }}
                  cells={matrixIntoCells([["not", "resizable", "!!!"], [1, 2, 3], [4, 5, 6]], {A3: {data: "four"}})}
                  options={{ sheetResize: "none" }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      )}
      <div>object value</div>
      <GridSheet
        cells={{
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
            console.log(
              "matrix on change diff:",
              table.objectFlatten(),
            );
          },
        }}
      />



      <GridSheet
        style={{ maxWidth: "100%", maxHeight: "150px" }}
        cells={initialCells}
        options={{ sheetResize: "both" }}
      />
    </>
  );
};
