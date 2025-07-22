import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet, operations, useHub } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Formula/Lookup',
};
export default meta;

const DESCRIPTION = [
  'This demo demonstrates lookup functions (HLOOKUP and VLOOKUP) in GridSheet.',
  'The HLOOKUP example shows how to create a grading system that automatically assigns letter grades based on numerical scores.',
  'The VLOOKUP example demonstrates cross-sheet references to determine Chinese zodiac animals for different years.',
].join('\n\n');

const LookUpSheet = () => {
  const hub = useHub({ historyLimit: 10 });
  return (
    <>
      <h1>HLOOKUP</h1>
      <GridSheet
        initialCells={buildInitialCells({
          cells: {
            1: { style: { backgroundColor: '#ddd' } },
            '2:3': { style: {} },
            'A:E': { width: 50 },
            'A4:C4': {
              prevention: operations.Write,
              style: {
                backgroundColor: '#ddd',
                borderTop: 'solid 1px black',
                borderLeft: 'solid 1px black',
                borderRight: 'solid 1px black',
                borderBottom: 'double 3px black',
                fontWeight: 'bold',
              },
            },
            'A5:C9': {
              style: {
                borderTop: 'solid 1px black',
                borderBottom: 'solid 1px black',
                borderLeft: 'solid 1px black',
                borderRight: 'solid 1px black',
              },
            },
          },
          ensured: { numRows: 10, numCols: 10 },
          matrices: {
            A1: [
              [0, '=A1+60', '=B1+10', '=C1+10', '=D1+10', '=E1+5', '', '', '', ''],
              ['E', 'D', 'C', 'B', 'A', 'S', '', '', '', ''],
              ['', '', '', '', '', '', '', '', '', ''],
              ['Name', 'Point', 'Rank', '', '', '', '', '', '', ''],
              ['apple', 50, '=HLOOKUP(B5, $A$1:$F$2, 2, true)', '', '', '', '', '', '', ''],
              ['orange', 82, '=HLOOKUP(B6, A1:F2, 2, true)', '', '', '', '', '', '', ''],
              ['grape', 75, '=HLOOKUP(B7, A1:F2, 2, true)', '', '', '', '', '', '', ''],
              ['melon', 98, '=HLOOKUP(B8, A1:F2, 2, true)', '', '', '', '', '', '', ''],
              ['banana', 65, '=HLOOKUP(B9, A1:F2, 2, true)', '', '', '', '', '', '', ''],
            ],
          },
        })}
        options={{}}
      />
      <h1>VLOOKUP</h1>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 10, width: '100%' }}>
        <div style={{ width: 160 }}>
          <GridSheet
            hub={hub}
            sheetName="eto"
            initialCells={buildInitialCells({
              cells: {
                A: { width: 50 },
                B: { width: 50 },
              },
              matrices: {
                A1: [
                  [0, '子🐭'],
                  [1, '丑🐮'],
                  [2, '寅🐯'],
                  [3, '卯🐰'],
                  [4, '辰🐲'],
                  [5, '巳🐍'],
                  [6, '午🐴'],
                  [7, '未🐑'],
                  [8, '申🐵'],
                  [9, '酉🐔'],
                  [10, '戌🐶'],
                  [11, '亥🐗'],
                ],
              },
            })}
          />
        </div>
        <div style={{ flex: 1 }}>
          <GridSheet
            hub={hub}
            sheetName="year"
            initialCells={buildInitialCells({
              cells: {
                A: { width: 50 },
                B: { width: 120 },
              },
              matrices: {
                A1: [
                  [2018, `=VLOOKUP(MOD(A1 - 4, 12), 'eto'!$A$1:$B$12, 2, false)`],
                  [2019, `=VLOOKUP(MOD(A2 - 4, 12), 'eto'!$A$1:$B$12, 2, false)`],
                  [2020, `=VLOOKUP(MOD(A3 - 4, 12), 'eto'!$A$1:$B$12, 2, false)`],
                  [2021, `=VLOOKUP(MOD(A4 - 4, 12), 'eto'!$A$1:$B$12, 2, false)`],
                  [2022, `=VLOOKUP(MOD(A5 - 4, 12), 'eto'!$A$1:$B$12, 2, false)`],
                  [2023],
                  [2024],
                  [2025],
                  [2026],
                ],
              },
              ensured: { numRows: 12, numCols: 5 },
            })}
          />
        </div>
      </div>
    </>
  );
};

export const LookUp: StoryObj = {
  render: () => <LookUpSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
