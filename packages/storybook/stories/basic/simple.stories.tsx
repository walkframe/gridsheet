import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet, Time, useBook, Policy } from '@gridsheet/react-core';
import { allFunctions } from '@gridsheet/functions';

const meta: Meta = {
  title: 'Basic/Simple',
};
export default meta;

const DESCRIPTION = [
  '## Example',
  'This demo showcases a small simple grid sheet with a few cells filled with various data types.',
  'It includes text, numbers, dates, and formulas to demonstrate the basic functionality of GridSheet.',
].join('\n\n');

const SimpleSheet = () => {
  const rawPolicy = new Policy({
    mixins: [{ renderColHeaderLabel: (n) => String(n), renderRowHeaderLabel: (n) => String(n) }],
  });
  const book = useBook({
    additionalFunctions: allFunctions,
    policies: { raw: rawPolicy },
  });
  return (
    <GridSheet
      book={book}
      options={{
        sheetResize: 'both',
      }}
      initialCells={buildInitialCells({
        cells: {
          default: { width: 150, policy: 'raw' },
          A1: {
            value: 'A1',
          },
          B1: {
            value: 'B1',
          },
          B2: {
            value: 2,
          },
          C3: {
            value: 3,
          },
          A4: {
            value: new Date('2022-03-05T12:34:56+09:00'),
          },
          B4: {
            value: Time.create(11, 11, 11),
          },
          C4: {
            value: '=A4 + B4',
          },
          A5: {
            value: '=A4 - 13/24',
          },
        },
        ensured: { numRows: 6, numCols: 4 },
      })}
    />
  );
};

export const Sheet: StoryObj = {
  render: () => <SimpleSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
