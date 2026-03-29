import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GridSheet, buildInitialCells, useSheetRef, HistoryType } from '@gridsheet/react-core';

import { useSpellbook } from '@gridsheet/react-core/spellbook';

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
  'It demonstrates how to write values to cells using coordinates and the sheet API.',
  'The demo shows how to programmatically set cell values after the grid is initialized.',

  '## How it works',
  'Programmatic writing allows you to set cell values from external sources or user interactions.',
  '1. Use connector to access the sheet instance and sync function.',
  '2. The write operation sets a value at a specific point (x, y coordinates).',
  '3. Writing can be triggered by props changes or user interactions.',
  '4. The operation is applied through the sync function to maintain consistency.',
].join('\n\n');

const WriteComponent: React.FC<Props> = ({ x, y, value }: Props) => {
  const sheetRef = useSheetRef();

  const book = useSpellbook({
    onKeyUp: ({ e, points }) => {
      console.log('onKeyUp', e.currentTarget.value, points.pointing);
    },
    onInit: (sheet) => {
      console.debug('onInit', sheet);
    },
  });

  React.useEffect(() => {
    if (sheetRef?.current == null) {
      return;
    }
    const { sheet, apply } = sheetRef.current;
    apply(sheet.write({ point: { x, y }, value }));
  }, [x, y, value, sheetRef]);

  return (
    <GridSheet
      sheetRef={sheetRef}
      book={book}
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
