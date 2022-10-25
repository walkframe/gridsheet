import React from "react";
import { generateInitial, GridSheet } from "../../../src";

export default {
  title: "Formula",
};

export const SimpleCalculation = () => {
  return (
    <>
      <GridSheet
        initial={generateInitial({
          matrixes: {
            A1: [
              ["'=100 + 5", "'=A2 - 60", "'=B2 * A2"],
              ["=100 + 5", "=A2-60", "=B2 * A2"],
            ],
            A4: [
              ["'=100 / 5", "'=A5 ^ 3", "'=B5 * -4"],
              ["=100 / 5", "=A5 ^ 3", "=B5 * -4"],
            ],
            A7: [
              ["'=(10 + 4) * 5", "'=A8 - 14 / 2", "'=(A8 - 14) / 2"],
              ["=(10 + 4) * 5", "=A8 - 14 / 2", "=(A8 - 14) / 2"],
            ],
            A10: [
              [
                `'=500 * 10 ^ 12 & "円"`,
                `'=A11 & "ほしい！"`,
                `'="とても" & B11`,
              ],
              [`=500 * 10 ^ 12 & "円"`, `=A11 & "ほしい！"`, `="とても" & B11`],
            ],
            A13: [
              [`'=100 = 100`, `'=100 = 200`, `'=100 <> 100`, `'=100 <> 200`],
              [`=100 = 100`, `=100 = 200`, `=100 <> 100`, `=100 <> 200`],
            ],
            A16: [
              [`'=100 > 99`, `'=100 > 101`, `'=100 >= 100`, `'=100 >= 101`],
              [`=100 > 99`, `=100 > 101`, `=100 >= 100`, `=100 >= 101`],
            ],
            A19: [
              [`'=100 < 99`, `'=100 < 101`, `'=100 <= 100`, `'=100 <= 99`],
              [`=100 < 99`, `=100 < 101`, `=100 <= 100`, `=100 <= 99`],
            ],
            A22: [
              [
                `'=MOD(8, 3)`,
                `'=MOD(8, 2)`,
                `'=MOD(8, 10)`,
                `'=MOD(-8, 3)`,
                `'=MOD(8, -3)`,
              ],
              [
                `=MOD(8, 3)`,
                `=MOD(8, 2)`,
                `=MOD(8, 10)`,
                `=MOD(-8, 3)`,
                `=MOD(8, -3)`,
              ],
            ],
          },
          cells: {
            default: {
              width: 250,
            },
          },
          ensured: { numRows: 100, numCols: 100 },
        })}
        options={{
          sheetHeight: 600,
        }}
      />
    </>
  );
};