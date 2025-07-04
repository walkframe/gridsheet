import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet, operations } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Restriction/Protection',
  argTypes: {
    numRows: { control: 'number' },
    numCols: { control: 'number' },
    defaultWidth: { control: 'number' },
  },
};
export default meta;

const DESCRIPTION = [
  '## Example',
  'This demo demonstrates cell and range protection features in GridSheet.',
  'Different areas of the grid are protected from various operations: row deletion, column insertion/removal, and resizing.',
  'Protected areas are visually indicated with different background colors.',

  '## How it works',
  'This is useful for creating templates or preventing accidental modifications to critical data.',
  '1. Row protection prevents deletion of specific rows.',
  '2. Column protection prevents insertion or removal of columns.',
  '3. Cell protection prevents writing to specific cells.',
  '4. Visual indicators help users understand which areas are protected.',
].join('\n\n');

const PreventionComponent: React.FC = () => {
  return (
    <GridSheet
      initialCells={buildInitialCells({
        cells: {
          4: {
            prevention: operations.RemoveRows,
          },
          1: {
            prevention: operations.Resize,
            style: { backgroundColor: '#eeeeee' },
          },
          'A:B': {
            prevention: operations.InsertCols | operations.RemoveCols,
            style: { backgroundColor: '#dddddd' },
          },
          A: {
            prevention: operations.Resize,
            style: { backgroundColor: '#eeeeee' },
          },
          C: {
            style: { backgroundColor: '#ffffff' },
          },
          B2: {
            value: 'READONLY',
            prevention: operations.ReadOnly,
            style: { backgroundColor: '#aaaaaa' },
          },
          B1: {
            value: 'Protected from row deletion',
            prevention: operations.RemoveRows | operations.RemoveCols,
          },
        },
        ensured: { numRows: 50, numCols: 20 },
      })}
    />
  );
};

export const Prevention: StoryObj = {
  args: { numRows: 50, numCols: 20, defaultWidth: 50 },
  render: () => <PreventionComponent />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
