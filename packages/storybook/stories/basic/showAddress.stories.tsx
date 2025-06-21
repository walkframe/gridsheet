import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';

const Sheet = () => {
  const [showAddress, setShowAddress] = useState(false);
  return (
    <>
      <label>
        <input type="checkbox" checked={showAddress} onChange={(e) => setShowAddress(e.target.checked)} />
        Show Address
      </label>
      <GridSheet
        initialCells={buildInitialCells({
          ensured: { numRows: 100, numCols: 100 },
        })}
        options={{ showAddress }}
      />
    </>
  );
};

export const ShowAddress: StoryObj<typeof Sheet> = {};

export default {
  title: 'Basic',
  component: Sheet,
};
