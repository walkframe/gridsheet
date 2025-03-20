import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { constructInitialCells, GridSheet } from '@gridsheet/react-core';

type Props = {
  showAddress: boolean;
};

const Sheet = ({ showAddress }: Props) => {
  return (
    <>
      <GridSheet
        initialCells={constructInitialCells({
          ensured: { numRows: 100, numCols: 100 },
        })}
        options={{ showAddress }}
      />
    </>
  );
};

export const ShowAddress: StoryObj<typeof Sheet> = {
  args: { showAddress: true },
};

export default {
  title: 'Basic',
  component: Sheet,
};
