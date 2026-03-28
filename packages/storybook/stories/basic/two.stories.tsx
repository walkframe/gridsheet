import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/functions';

const meta: Meta = {
  title: 'Basic/Two',
};
export default meta;

const DESCRIPTION = ['## Example', 'This demo is smallest simple grid sheet with a few cells for debug.'].join('\n\n');

const TwoSheet = () => {
  const book = useSpellbook();
  return (
    <GridSheet
      book={book}
      options={{
        sheetResize: 'both',
      }}
      initialCells={buildInitialCells({
        cells: {
          A1: {
            value: 'a',
          },
          B1: {
            value: 'b',
          },
        },
      })}
    />
  );
};

export const Sheet: StoryObj = {
  render: () => <TwoSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
