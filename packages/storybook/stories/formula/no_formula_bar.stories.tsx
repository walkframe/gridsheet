import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet, useHub } from '@gridsheet/react-core';
import { allFunctions } from '@gridsheet/functions';

const meta: Meta = {
  title: 'Formula/NoFormulaBar',
};
export default meta;

const DESCRIPTION = [
  'This demo showcases GridSheet without the formula bar.',
  'It demonstrates how to hide the formula bar for a cleaner interface.',
  'The grid functions normally but without the formula input area at the top.',
].join('\n\n');

const NoFormulaBarSheet = () => {
  const hub = useHub({
    additionalFunctions: allFunctions,
  });
  return (
    <GridSheet
      hub={hub}
      initialCells={buildInitialCells({
        matrices: {},
        cells: {
          default: {
            width: 50,
          },
        },
        ensured: { numRows: 10, numCols: 10 },
      })}
      options={{
        sheetHeight: 600,
        showFormulaBar: false,
      }}
    />
  );
};

export const NoFormulaBar: StoryObj = {
  render: () => <NoFormulaBarSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
