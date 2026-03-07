import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BaseFunction, useHub } from '@gridsheet/react-core';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';
import { allFunctions } from '@gridsheet/functions';

const meta: Meta = {
  title: 'Formula/Custom',
};
export default meta;

const DESCRIPTION = [
  'This demo showcases custom functions in GridSheet.',
  'It demonstrates how to create and use custom functions that extend the formula capabilities.',
  'The example shows two custom functions: HOPE() and test().',
].join('\n\n');

const CustomFunctionSheet = () => {
  const hub = useHub({
    additionalFunctions: {
      ...allFunctions,
      hope: class HopeFunction extends BaseFunction {
        main(text: string) {
          return `😸${text}😸`;
        }
      },
      test: class TestFunction extends BaseFunction {
        main() {
          return 'てすとだよ';
        }
      },
    },
  });
  return (
    <GridSheet
      hub={hub}
      initialCells={buildInitialCells({
        cells: {
          default: { width: 200 },
          B2: { value: '=HOPE("WORLD PEACE") & "!"' },
          A3: { value: '=test()' },
        },
        ensured: {
          numRows: 10,
          numCols: 10,
        },
      })}
    />
  );
};

export const CustomFunction: StoryObj = {
  render: () => <CustomFunctionSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
