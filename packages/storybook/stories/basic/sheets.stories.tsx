import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet, useHubReactive } from '@gridsheet/react-core';

type Props = {
  numRows: number;
  numCols: number;
  defaultWidth: number;
};

const Sheets = ({ numRows, numCols, defaultWidth }: Props) => {
  const [sheet1, setSheet1] = React.useState('Sheet1');
  const [sheet2, setSheet2] = React.useState('Sheet2');
  const [sheet3, setSheet3] = React.useState('Sheet 3');
  const [sheet4, setSheet4] = React.useState('Sheet4');
  const hubReactive = useHubReactive();
  return (
    <div>
      <table style={{ borderCollapse: 'collapse' }}>
        <tr>
          <td style={{ border: '3px solid #aaa', padding: '5px' }}>
            <GridSheet
              hubReactive={hubReactive}
              sheetName={sheet1}
              initialCells={buildInitialCells({
                cells: {
                  default: { width: defaultWidth },
                  A1: {
                    value: '=Sheet2!A1+100',
                  },
                  A2: {
                    value: '=SUM(Sheet2!B2:B4)',
                  },
                  A3: {
                    value: "='Sheet 3'!A1 + 1000",
                  },
                  A5: {
                    value: '=C5+100'
                  },
                  B1: {
                    value: "=SUM('Invalid Sheet'!B2:B3)",
                  },
                  C1: {
                    value: 333,
                  },
                  C2: {
                    value: '=$C$1+100',
                  },
                  C3: {
                    value: '=C2+200',
                  },
                  B5: {
                    value: '=A5+300',
                  },
                  C5: {
                    value: 500,
                  },
                },
                ensured: { numRows, numCols },
              })}
            />
            <br />
            <input id="input1" value={sheet1} onChange={(e) => setSheet1(e.target.value)} />
          </td>
          <td style={{ border: '3px solid #aaa', padding: '5px' }}>
            <GridSheet
              hubReactive={hubReactive}
              sheetName={sheet2}
              initialCells={buildInitialCells({
                cells: {
                  A1: { value: 50 },
                  A2: { value: `=${sheet1}!C3` },
                  B1: { value: 999 },
                  B2: { value: 1200 },
                  B3: { value: 30 },
                },
                ensured: { numRows, numCols },
              })}
              options={{
                sheetResize: 'both',
              }}
            />
            <br />
            <input id="input2" value={sheet2} onChange={(e) => setSheet2(e.target.value)} />
          </td>
        </tr>
        <tr>
          <td style={{ border: '3px solid #aaa', padding: '5px' }}>
            <GridSheet
              hubReactive={hubReactive}
              sheetName={sheet3}
              initialCells={buildInitialCells({
                cells: {
                  A1: { value: `='${sheet1}'!C3` },
                  A2: { value: `=SUM('${sheet1}'!C2:C3) + 10` },
                  A3: { value: `=SUM('${sheet1}'!B3:C3) + 20` },
                },
                ensured: { numRows, numCols },
              })}
            />
            <br />
            <input id="input3" value={sheet3} onChange={(e) => setSheet3(e.target.value)} />
          </td>
          <td style={{ border: '3px solid #aaa', padding: '5px' }}>
            <GridSheet
              sheetName={sheet4}
              initialCells={buildInitialCells({
                cells: {
                  A1: { value: `=${sheet1}!C3` },
                },
                ensured: { numRows, numCols },
              })}
              options={{
                mode: 'dark',
              }}
            />
            <br />
            Independent <input id="input4" value={sheet4} onChange={(e) => setSheet4(e.target.value)} />
          </td>
        </tr>
      </table>
    </div>
  );
};

export const MultipleSheet: StoryObj<typeof Sheets> = {
  args: { numRows: 5, numCols: 3, defaultWidth: 100 },
};

export default {
  title: 'Basic',
  component: Sheets,
};
