
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet, TimeDelta, useHub } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Feature/Basic/Two',
  tags: ['autodocs'],
};
export default meta;

const DESCRIPTION = [
  '## Example',
  'This demo is smallest simple grid sheet with a few cells for debug.',
].join('\n\n');

export const Sheet: StoryObj = {
  render: () => {
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
  },
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
}
