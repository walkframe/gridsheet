import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GridSheet, buildInitialCells, useConnector, HistoryType, useHub } from '@gridsheet/react-core';

type Props = {
  x: number;
  y: number;
  value: string;
};

const meta: Meta = {
  title: 'Control/Write',
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
  '1. Use connector to access the table instance and sync function.',
  '2. The write operation sets a value at a specific point (x, y coordinates).',
  '3. Writing can be triggered by props changes or user interactions.',
  '4. The operation is applied through the sync function to maintain consistency.',
].join('\n\n');

const WriteComponent: React.FC<Props> = ({ x, y, value }: Props) => {
  const connector = useConnector();

  const hub = useHub({
    onKeyUp: ({ e, points }) => {
      console.log('onKeyUp', e.currentTarget.value, points.pointing);
    },
    onInit: (table) => {
      console.debug('onInit', table);
    },
  });

  React.useEffect(() => {
    if (connector?.current == null) {
      return;
    }
    const { tableManager } = connector.current;
    const { table, sync } = tableManager;
    sync(table.write({ point: { x, y }, value }));
  }, [x, y, value, connector]);

  return (
    <GridSheet
      connector={connector}
      hub={hub}
      initialCells={buildInitialCells({
        cells: {},
        ensured: {
          numRows: 10,
          numCols: 10,
        },
      })}
      options={{}}
    />
  );
};

export const Write: StoryObj<Props> = {
  render: ({ x, y, value }: Props) => <WriteComponent x={x} y={y} value={value} />,
  args: { x: 2, y: 2, value: 'something' },
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
