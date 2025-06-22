import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet, ModeType } from '@gridsheet/react-core';

type Props = {
  mode: ModeType;
};

const Sheet = ({ mode }: Props) => {
  return (
    <>
      <GridSheet
        initialCells={buildInitialCells({
          ensured: { numRows: 10, numCols: 10 },
        })}
        options={{ mode }}
      />
    </>
  );
};

export const Dark: StoryObj<typeof Sheet> = {
  args: { mode: 'dark' },
};

export default {
  title: 'Basic',
  component: Sheet,
};
