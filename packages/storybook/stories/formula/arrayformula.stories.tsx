import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet, useBook } from '@gridsheet/react-core';
import { allFunctions } from '@gridsheet/functions';
import { Debugger } from '@gridsheet/react-dev';

const meta: Meta = {
  title: 'Formula/Arrayformula',
};
export default meta;

// ---------------------------------------------------------------------------
// ARRAYFORMULA stories
// ---------------------------------------------------------------------------

/** Basic element-wise arithmetic over a range */
const ArrayformulaBasicSheet: React.FC = () => {
  const book = useBook({ additionalFunctions: allFunctions });
  return (
    <>
      <GridSheet
        book={book}
        sheetName="AFBasic"
        initialCells={buildInitialCells({
          cells: {
            default: { width: 100 },
            // Input data
            A1: { value: 'A' },
            B1: { value: 'B' },
            C1: { value: 'A*B' },
            D1: { value: 'A+B' },
            E1: { value: 'C:D+3' },
            A2: { value: 1 },
            A3: { value: 2 },
            A4: { value: 3 },
            A5: { value: 4 },
            B2: { value: 10 },
            B3: { value: 20 },
            B4: { value: 30 },
            B5: { value: 40 },
            // ARRAYFORMULA: element-wise product
            C2: { value: '=ARRAYFORMULA(A2:A5 * B2:B5)' },
            // ARRAYFORMULA: element-wise sum
            D2: { value: '=ARRAYFORMULA(A2:A5 + B2:B5)' },
            E2: { value: '=ARRAYFORMULA(C2:D5 + 3)' },
          },
          ensured: { numRows: 10, numCols: 6 },
        })}
        options={{ sheetHeight: 320 }}
      />
      <Debugger book={book} />
    </>
  );
};

/** ARRAYFORMULA wrapping a range passthrough */
const ArrayformulaRangeSheet: React.FC = () => {
  const book = useBook({ additionalFunctions: allFunctions });
  return (
    <GridSheet
      book={book}
      sheetName="AFRange"
      initialCells={buildInitialCells({
        cells: {
          default: { width: 140 },
          A1: { value: 'source' },
          C1: { value: 'ARRAYFORMULA(A2:A5)' },
          A2: { value: 10 },
          A3: { value: 20 },
          A4: { value: 30 },
          A5: { value: 40 },
          // Wrapping a range reference spills the range content
          C2: { value: '=ARRAYFORMULA(A2:A5)' },
        },
        ensured: { numRows: 10, numCols: 6 },
      })}
      options={{ sheetHeight: 320 }}
    />
  );
};

/** ARRAYFORMULA combined with IF for conditional element-wise output */
const ArrayformulaIfSheet: React.FC = () => {
  const book = useBook({ additionalFunctions: allFunctions });
  return (
    <GridSheet
      book={book}
      sheetName="AFWithIf"
      initialCells={buildInitialCells({
        cells: {
          default: { width: 200 },
          A1: { value: 'score' },
          B1: { value: 'ARRAYFORMULA(IF(...))' },
          A2: { value: 90 },
          A3: { value: 55 },
          A4: { value: 70 },
          A5: { value: 40 },
          // Element-wise IF inside ARRAYFORMULA
          B2: { value: '=ARRAYFORMULA(IF(A2:A5>=60,"Pass","Fail"))' },
        },
        ensured: { numRows: 10, numCols: 4 },
      })}
      options={{ sheetHeight: 320 }}
    />
  );
};

export const ArrayformulaBasic: StoryObj = {
  render: () => <ArrayformulaBasicSheet />,
  parameters: {
    docs: {
      description: {
        story: [
          '`ARRAYFORMULA(array_expr)` — evaluates an expression over an array and spills the results.',
          '',
          '- **C2**: `=ARRAYFORMULA(A2:A5 * B2:B5)` → `10, 40, 90, 160`',
          '- **D2**: `=ARRAYFORMULA(A2:A5 + B2:B5)` → `11, 22, 33, 44`',
        ].join('\n'),
      },
    },
  },
};

export const ArrayformulaRange: StoryObj = {
  render: () => <ArrayformulaRangeSheet />,
  parameters: {
    docs: {
      description: {
        story: [
          '`ARRAYFORMULA(range)` — wraps a range reference and spills its values.',
          '',
          '- **C2**: `=ARRAYFORMULA(A2:A5)` → spills `10, 20, 30, 40` downward',
        ].join('\n'),
      },
    },
  },
};

export const ArrayformulaWithIf: StoryObj = {
  render: () => <ArrayformulaIfSheet />,
  parameters: {
    docs: {
      description: {
        story: [
          '`ARRAYFORMULA(IF(range >= 60, "Pass", "Fail"))` — element-wise conditional over a range.',
          '',
          '- score 90 → `Pass`',
          '- score 55 → `Fail`',
          '- score 70 → `Pass`',
          '- score 40 → `Fail`',
        ].join('\n'),
      },
    },
  },
};
