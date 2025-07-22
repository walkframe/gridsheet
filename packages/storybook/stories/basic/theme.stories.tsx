import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet, ModeType } from '@gridsheet/react-core';

type Props = {
  mode: ModeType;
};

const Sheet = ({ mode }: Props) => {
  return (
    <GridSheet
      initialCells={buildInitialCells({
        ensured: { numRows: 10, numCols: 10 },
      })}
      options={{ mode }}
    />
  );
};

const meta: Meta<typeof Sheet> = {
  title: 'Basic/Theme',
  component: Sheet,
};
export default meta;

const DESCRIPTION = [
  'This demo showcases the dark theme mode of the GridSheet component.',
  'The grid automatically applies dark styling with appropriate contrast for better visibility in low-light environments.',
].join('\n\n');

export const Dark: StoryObj<typeof Sheet> = {
  args: { mode: 'dark' },
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
