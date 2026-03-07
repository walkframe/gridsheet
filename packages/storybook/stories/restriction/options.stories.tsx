import React, { type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GridSheet, Policy, AutocompleteOption, buildInitialCells, useHub } from '@gridsheet/react-core';
import { Debugger } from '@gridsheet/react-dev';

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
    priority: 2,
    mixins: [
      {
        getOptions(): AutocompleteOption[] {
          return [
            {
              value: 'aqua', label: <span style={{ color: 'aqua' }}>Aqua</span>, guide: () => {
                return <p><b>Aqua</b><br />The color aqua is a cyan color.</p>;
              }
            },
            {
              value: 'red', label: <span style={{ color: 'red' }}>Red</span>, guide: () => {
                return <p><b>Red</b><br />The color red is a red color.</p>;
              }
            },
            {
              value: 'green', label: <span style={{ color: 'green' }}>Green</span>, guide: () => {
                return <p><b>Green</b><br />The color green is a green color.</p>;
              }
            },
            {
              value: 'blue', label: <span style={{ color: 'blue' }}>Blue</span>, guide: () => {
                return <p><b>Blue</b><br />The color blue is a blue color.</p>;
              }
            },
          ];
        },
        validate({ next, table, point, current }) {
          let { value } = next ?? {};
          if (value === 'aqua' || value === 'red' || value === 'green' || value === 'blue') {
            return { value, style: { backgroundColor: value } };
          }
          // Fall back to current cell value when invalid
          const fallbackValue = current?.value ?? null;
          if (fallbackValue != null) {
            return { value: fallbackValue, style: { backgroundColor: fallbackValue } };
          }
          return { value: null };
        },
      },
    ],
  });
  const animalPolicy = new Policy({
    priority: 1,
    mixins: [
      {
        getFallback({ value }) {
          return { value };
        },
        getOptions(): AutocompleteOption[] {
          return [{ value: 'cat' }, { value: 'dog' }, { value: 'bird' }];
        },
        validate({ next: patch }) {
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
    <div>
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
      <Debugger hub={hub} />
    </div>
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
