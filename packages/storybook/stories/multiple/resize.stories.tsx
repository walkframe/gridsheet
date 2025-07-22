import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Multiple/CompareResizers',
};
export default meta;

const DESCRIPTION = [
  '## Example',
  'This demo showcases different resize options for GridSheet components.',
  'It demonstrates how to control whether users can resize the grid horizontally, vertically, both directions, or not at all.',
].join('\n\n');

const tdStyle: React.CSSProperties = {
  width: '200px',
  height: '200px',
  verticalAlign: 'top',
};

const CompareResizersSheet = () => {
  return (
    <>
      <table style={{ tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td style={tdStyle}>
              {' '}
              <GridSheet
                initialCells={buildInitialCells({
                  matrices: {
                    A1: [
                      ['not', 'resizable', '!!!'],
                      [1, 2, 3],
                      [undefined, 5, 6],
                    ],
                  },
                  cells: { A3: { value: 'four' } },
                  ensured: { numRows: 10, numCols: 10 },
                })}
                options={{
                  mode: 'dark',
                  sheetResize: 'none',
                  sheetHeight: 200,
                  sheetWidth: 200,
                }}
              />
            </td>
            <td style={tdStyle}>
              {' '}
              <GridSheet
                initialCells={buildInitialCells({
                  matrices: {
                    A1: [
                      ['resizable', 'horizontally', '!'],
                      [1, 2, 3],
                      [4, undefined, 6],
                    ],
                  },
                  cells: { B3: { value: 'five' } },
                  ensured: { numRows: 10, numCols: 10 },
                })}
                options={{
                  sheetResize: 'horizontal',
                  sheetHeight: 200,
                  sheetWidth: 200,
                }}
              />
            </td>
          </tr>
          <tr>
            <td style={tdStyle}>
              {' '}
              <GridSheet
                initialCells={buildInitialCells({
                  matrices: {
                    A1: [
                      ['resizable', 'vertically', '!'],
                      [1, 2, 3],
                      [4, 5, undefined],
                    ],
                  },
                  cells: { C3: { value: 'six' } },
                  ensured: { numRows: 10, numCols: 10 },
                })}
                options={{
                  sheetResize: 'vertical',
                  sheetHeight: 200,
                  sheetWidth: 200,
                  showFormulaBar: false,
                }}
              />
            </td>
            <td style={tdStyle}>
              {' '}
              <GridSheet
                initialCells={buildInitialCells({
                  matrices: {
                    A1: [
                      ['resizable', 'both', '!'],
                      [1, 2, 3],
                      [4, 5, 6],
                    ],
                  },
                  cells: { A3: { value: 'four' } },
                  ensured: { numRows: 10, numCols: 10 },
                })}
                options={{
                  sheetResize: 'both',
                  sheetHeight: 200,
                  sheetWidth: 200,
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

export const CompareResizers: StoryObj = {
  render: () => <CompareResizersSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
