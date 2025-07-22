import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Basic/ShowAddress',
};
export default meta;

const DESCRIPTION = [
  'This demo demonstrates the address display functionality in GridSheet.',
  'Toggle the checkbox to show or hide cell addresses (like A1, B2, etc.) in the grid.',
].join('\n\n');

type Props = {
  initialShowAddress: boolean;
};

const ShowAddressSheet = () => {
  const [showAddress, setShowAddress] = useState(true);
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

export const ShowAddress: StoryObj<Props> = {
  args: {
    initialShowAddress: false,
  },
  render: () => <ShowAddressSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
