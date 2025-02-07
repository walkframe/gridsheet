import React from "react";
import { constructInitialCells, GridSheet } from "@gridsheet/react-core";

export default {
  title: "Basic",
};

export const ResizeSheets = () => {
  return (
    <>
      <table style={{ width: "100%", tableLayout: "fixed" }}>
        <tbody>
          <tr>
            <td>
              {" "}
              <GridSheet
                style={{ maxWidth: "100%", maxHeight: "150px" }}
                initialCells={constructInitialCells({
                  matrices: {
                    A1: [
                      ["resizable", "both", "!"],
                      [1, 2, 3],
                      [undefined, 5, 6],
                    ],
                  },
                  cells: { A3: { value: "four" } },
                })}
                options={{
                  mode: "dark",
                  sheetResize: "both",
                  sheetHeight: 500,
                  sheetWidth: 500,
                }}
              />
            </td>
            <td>
              {" "}
              <GridSheet
                style={{ maxWidth: "100%", maxHeight: "150px" }}
                initialCells={constructInitialCells({
                  matrices: {
                    A1: [
                      ["resizable", "vertically", "!"],
                      [1, 2, 3],
                      [4, undefined, 6],
                    ],
                  },
                  cells: { B3: { value: "five" } },
                })}
                options={{
                  sheetResize: "vertical",
                  sheetHeight: 500,
                  sheetWidth: 500,
                }}
              />
            </td>
          </tr>
          <tr>
            <td>
              {" "}
              <GridSheet
                style={{ maxWidth: "100%", maxHeight: "150px" }}
                initialCells={constructInitialCells({
                  matrices: {
                    A1: [
                      ["resizable", "horizontally", "!"],
                      [1, 2, 3],
                      [4, 5, undefined],
                    ],
                  },
                  cells: { C3: { value: "six" } },
                })}
                options={{
                  sheetResize: "horizontal",
                  sheetHeight: 500,
                  sheetWidth: 500,
                  showFormulaBar: false,
                }}
              />
            </td>
            <td>
              {" "}
              <GridSheet
                style={{ maxWidth: "100%", maxHeight: "150px" }}
                initialCells={constructInitialCells({
                  matrices: {
                    A1: [
                      ["not", "resizable", "!!!"],
                      [1, 2, 3],
                      [4, 5, 6],
                    ],
                  },
                  cells: { A3: { value: "four" } },
                })}
                options={{
                  sheetResize: "none",
                  sheetHeight: 500,
                  sheetWidth: 500,
                  showFormulaBar: false,
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
};
