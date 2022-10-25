import React from "react";
import { generateInitial, GridSheet } from "../../../src";

export default {
  title: "Basic",
};

export const Style = () => {
  return (
    <>
      <GridSheet
        initial={generateInitial({
          matrixes: {
            A1: [
              ["a", "b", "c", "d", "e"],
              ["aa", "bb", "cc", "dd", "ee"],
              ["aaa", "bbb", "ccc", "ddd", "eee"],
              ["aaaa", "bbbb", "cccc", "dddd", "eeee"],
              ["aaaaa", "bbbbb", "ccccc", "ddddd", "eeeee"],
            ],
          },
          cells: {
            default: {
              value: "DEFAULT",
              style: {
                fontStyle: "italic",
                backgroundColor: "#000",
                color: "#777",
              },
            },
            A: {
              style: { backgroundColor: "#ffffff" },
            },
            B: {
              style: { backgroundColor: "#eeeeee" },
              width: 200,
            },
            C: {
              style: { backgroundColor: "#dddddd" },
            },
            D: {
              style: { backgroundColor: "#cccccc" },
            },
            E: {
              style: { backgroundColor: "#bbbbbb" },
            },
            1: {
              style: { color: "#333" },
            },
            2: {
              style: { color: "#F00" },
            },
            3: {
              style: { color: "#0C0" },
              height: 250,
            },
            4: {
              style: { color: "#00F" },
            },
            E5: {
              style: {
                backgroundColor: "#F0F",
              },
            },
            F6: {
              value: "F6",
            },
          },
          ensured: { numRows: 50, numCols: 10 },
        })}
        options={{}}
      />
    </>
  );
};
