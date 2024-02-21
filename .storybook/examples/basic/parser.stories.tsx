import React from "react";
import { constructInitialCells, GridSheet, Parser, Renderer } from "../../../src";

export default {
  title: "Basic",
};

class ListRenderer extends Renderer {
  array(value: any[]) {
    return (
      <ul>
        {value.map((v, i) => (
          <li key={i}>{v}</li>
        ))}
      </ul>
    );
  }
  stringify({ value }: { value: any[] }): string {
    if (Array.isArray(value)) {
      return value.join("\n");
    }
    return value == null ? "" : String(value);
  }
}

const ListParserMixin = {
  functions: [
    (value: string) => value.split(/\n/g),
  ],
};

export const ParseAsList = () => {
  return (
    <>
      <GridSheet
        initialCells={constructInitialCells({
          matrices: {
            A1: [
              [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
              ],
              [
                [10, 11, 12],
                [13, 14, 15],
                [16, 17, 18],
              ],
              [
                [19, 20, 21],
                [22, 23, 24],
                [25, 26, 27],
              ],
            ],
          },
          cells: {
            default: {
              height: 100,
              renderer: "list",
              parser: "list",
            },
          },
          ensured: { numRows: 30, numCols: 20 },
        })}
        options={{
          renderers: {
            list: new ListRenderer(),
          },
          parsers: {
            list: new Parser({mixins: [ListParserMixin]}),
          },
        }}
      />
    </>
  );
};
