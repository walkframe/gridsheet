import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet, TimeDelta, useHub } from '@gridsheet/react-core';

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
  const hub = useHub({
    labelers: {
      raw: (n) => String(n),
    },
  });
  return (
    <GridSheet
      hub={hub}
      options={{
        sheetResize: 'both',
      }}
      initialCells={buildInitialCells({
        cells: {
          default: { width: 150, labeler: 'raw' },
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
            value: TimeDelta.create(11, 11, 11),
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
