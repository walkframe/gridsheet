import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GridSheet, buildInitialCells, useTableRef, HistoryType } from '@gridsheet/react-core';

type Props = {
  x: number;
  y: number;
  value: string;
};

const meta: Meta = {
  title: 'Feature/Control/Write',
  tags: ['autodocs'],
  argTypes: {
    x: { control: 'number' },
    y: { control: 'number' },
    value: { control: 'text' },
  },
};
export default meta;

const DESCRIPTION = [
  '## Example',
  'This demo showcases programmatic writing to specific cells in GridSheet.',
  'It demonstrates how to write values to cells using coordinates and the table API.',
  'The demo shows how to programmatically set cell values after the grid is initialized.',

  '## How it works',
  'Programmatic writing allows you to set cell values from external sources or user interactions.',
  '1. Use tableRef to access the table instance and dispatch function.',
  '2. The write operation sets a value at a specific point (x, y coordinates).',
  '3. Writing can be triggered by props changes or user interactions.',
  '4. The operation is applied through the dispatch function to maintain consistency.',
].join('\n\n');

export const Write: StoryObj<Props> = {
  render: ({ x, y, value }) => {
    const tableRef = useTableRef();

    React.useEffect(() => {
      if (tableRef?.current == null) {
        return;
      }
      const { table, dispatch } = tableRef.current;
      dispatch(table.write({ point: { y, x }, value }));
    }, [x, y, value, tableRef]);

    return (
      <GridSheet
        tableRef={tableRef}
        initialCells={buildInitialCells({
          cells: {},
          ensured: {
            numRows: 10,
            numCols: 10,
          },
        })}
        options={{
          onKeyUp: (e, points) => {
            console.log('onKeyUp', e.currentTarget.value, points.pointing);
          },
          onInit: (table) => {
            console.debug('onInit', table);
          },
        }}
      />
    );
  },
  args: { x: 2, y: 2, value: 'something' },
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
