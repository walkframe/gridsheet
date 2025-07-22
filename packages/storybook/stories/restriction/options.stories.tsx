import React, { type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GridSheet, Policy, PolicyOption, buildInitialCells, useHub } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Restriction/Options',
};
export default meta;

const DESCRIPTION = [
  '## Example',
  'This demo shows how to create custom dropdown options with policies.',
  'The first column uses a color policy that provides color options with visual labels and automatically applies the selected color as the cell background.',
  'The second column uses an animal policy with simple text options.',

  '## How it works',
  'This demonstrates how policies can be used to create controlled input fields with predefined options, improving data consistency and user experience.',
  '1. The color policy provides visual color options and applies the selected color as background.',
  '2. The animal policy provides simple text-based dropdown options.',
  '3. Policies ensure data consistency by limiting input to predefined values.',
  '4. Visual feedback helps users understand the available options.',
].join('\n\n');

const OptionsComponent: React.FC = () => {
  const colorPolicy = new Policy({
    mixins: [
      {
        getOptions(): PolicyOption[] {
          return [
            { value: 'aqua', label: <span style={{ color: 'aqua' }}>Aqua</span> },
            { value: 'red', label: <span style={{ color: 'red' }}>Red</span> },
            { value: 'green', label: <span style={{ color: 'green' }}>Green</span> },
            { value: 'blue', label: <span style={{ color: 'blue' }}>Blue</span> },
          ];
        },
        validate({ patch, table, point }) {
          let { value } = patch ?? {};
          if (value == null) {
            value = table.getCellByPoint(point)?.value;
          }
          return { value, style: { backgroundColor: value } };
        },
      },
    ],
  });
  const animalPolicy = new Policy({
    mixins: [
      {
        getDefault({ value }) {
          return { value };
        },
        getOptions(): PolicyOption[] {
          return [{ value: 'cat' }, { value: 'dog' }, { value: 'bird' }];
        },
        validate({ patch }) {
          const { value, width } = patch ?? {};
          return { value, width };
        },
      },
    ],
  });
  const hub = useHub({
    labelers: {
      color: (n: number) => {
        return 'Color';
      },
      animal: (n: number) => {
        return 'Animal';
      },
    },
    policies: {
      color: colorPolicy,
      animal: animalPolicy,
    },
  });

  return (
    <GridSheet
      hub={hub}
      initialCells={buildInitialCells({
        cells: {
          A: {
            labeler: 'color',
            policy: 'color',
          },
          B: {
            labeler: 'animal',
            policy: 'animal',
          },
          A3: {
            value: 'red',
            style: { backgroundColor: 'red' },
          },
          B3: {
            value: 'alpaca',
          },
          B4: {
            value: 'dog',
          },
          B8: {
            value: 'green',
          },
        },
        ensured: { numRows: 10, numCols: 10 },
      })}
    />
  );
};

export const Options: StoryObj = {
  render: () => <OptionsComponent />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
