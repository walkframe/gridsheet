import * as React from 'react';
import { GridSheet, buildInitialCells, BaseFunction, operations, useHubReactive } from '@gridsheet/react-core';

export default {
  title: 'Demo',
};

class HopeFunction extends BaseFunction {
  // @ts-ignore
  main(text: string) {
    return `😸${text}😸`;
  }
}

export function FirstDemo() {
  const hubReactive = useHubReactive();
  const [sheetName1, setSheetName1] = React.useState('criteria');
  const [sheetName2, setSheetName2] = React.useState('grades');
  const [sheetName3, setSheetName3] = React.useState('other');

  return (
    <div className="App">
      <GridSheet
        hubReactive={hubReactive}
        sheetName={sheetName1}
        initialCells={buildInitialCells({
          matrices: {
            A1: [
              [0, '=A1+60', '=B1+10', '=C1+10', '=D1+10', '=E1+5'],
              ['E🤯', 'D🥺', 'C😒', 'B😚', 'A🥰', 'S😇'],
            ],
          },
          cells: {
            default: {
              width: 50,
            },
            '1': {
              style: { backgroundColor: '#ddd' },
              prevention: operations.InsertCols,
            },
          },
        })}
        options={{
          additionalFunctions: {
            hope: HopeFunction,
          },
        }}
      />
      <br />
      Sheet name: <input value={sheetName1} onChange={(e) => setSheetName1(e.target.value)} />
      <br />
      reference points are readonly.
      <hr />
      <GridSheet
        hubReactive={hubReactive}
        sheetName={sheetName2}
        initialCells={buildInitialCells({
          matrices: {
            A1: [
              ['Name', 'Point', 'Rank', 'Comment'],
              ['apple', 50, '=HLOOKUP(B2, criteria!$A$1:$F$2, 2, true)', 'Pie'],
              ['orange', 82, '=HLOOKUP(B3, criteria!$A$1:$F$2, 2, true)'],
              ['grape', 75, '=HLOOKUP(B4, criteria!$A$1:$F$2, 2, true)'],
              ['melon', 98, '=HLOOKUP(B5, criteria!$A$1:$F$2, 2, true)'],
              ['banana', 65, '=HLOOKUP(B6, criteria!$A$1:$F$2, 2, true)'],
            ],
          },
          cells: {
            'A1:D1': {
              prevention: operations.Write,
              style: {
                borderTop: 'solid 1px black',
                borderLeft: 'solid 1px black',
                //borderRight: "solid 1px black",
                borderBottom: 'double 3px black',
                fontWeight: 'bold',
                backgroundColor: '#aaa',
              },
            },
            'A2:D6': {
              style: {
                borderTop: 'solid 1px black',
                //borderBottom: "solid 1px black",
                borderLeft: 'solid 1px black',
                //borderRight: "solid 1px black",
              },
            },
          },
        })}
        options={{
          additionalFunctions: {
            hope: HopeFunction,
          },
          sheetResize: 'both',
        }}
      />
      <br />
      Sheet name: <input value={sheetName2} onChange={(e) => setSheetName2(e.target.value)} />
      <br />
      Ranks are derived using the HLOOKUP function with a {sheetName1} sheet.
      <hr />
      <GridSheet
        hubReactive={hubReactive}
        sheetName={sheetName3}
        initialCells={buildInitialCells({
          matrices: {
            A1: [
              ['NOW:', '=NOW()'],
              ['', '=HOPE("World peace") & "!!"'],
            ],
            A4: [
              ['Greater than', 70],
              ['\'=countif(grades!B2:B6, ">" & B4)', '=countif(grades!B2:B6, ">" & B4)'],
            ],
          },
          cells: {
            default: { width: 200 },
          },
        })}
        options={{
          additionalFunctions: {
            hope: HopeFunction,
          },
          sheetResize: 'both',
        }}
      />
      <br />
      Sheet name: <input value={sheetName3} onChange={(e) => setSheetName3(e.target.value)} />
      <br />
    </div>
  );
}
