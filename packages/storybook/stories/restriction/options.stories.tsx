import React, { type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GridSheet, Policy, AutocompleteOption, buildInitialCells, type SelectProps } from '@gridsheet/react-core';
import { Debugger } from '@gridsheet/react-dev';

import { useSpellbook } from '@gridsheet/react-core/spellbook';

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
        select({ next, current }: SelectProps) {
          const { value } = next ?? {};
          if (value === 'aqua' || value === 'red' || value === 'green' || value === 'blue') {
            return { value, style: { backgroundColor: value } };
          }
          const fallbackValue = current?.value ?? null;
          if (fallbackValue != null) {
            return { value: fallbackValue, style: { backgroundColor: fallbackValue } };
          }
          return { value: null };
        },
        getSelectOptions(): AutocompleteOption[] {
          return [
            {
              value: 'aqua',
              label: <span style={{ color: 'aqua' }}>Aqua</span>,
              tooltip: () => {
                return (
                  <p>
                    <b>Aqua</b>
                    <br />
                    The color aqua is a cyan color.
                  </p>
                );
              },
            },
            {
              value: 'red',
              label: <span style={{ color: 'red' }}>Red</span>,
              tooltip: () => {
                return (
                  <p>
                    <b>Red</b>
                    <br />
                    The color red is a red color.
                  </p>
                );
              },
            },
            {
              value: 'green',
              label: <span style={{ color: 'green' }}>Green</span>,
              tooltip: () => {
                return (
                  <p>
                    <b>Green</b>
                    <br />
                    The color green is a green color.
                  </p>
                );
              },
            },
            {
              value: 'blue',
              label: <span style={{ color: 'blue' }}>Blue</span>,
              tooltip: () => {
                return (
                  <p>
                    <b>Blue</b>
                    <br />
                    The color blue is a blue color.
                  </p>
                );
              },
            },
          ];
        },
      },
    ],
  });
  const animalPolicy = new Policy({
    priority: 1,
    mixins: [
      {
        getSelectOptions(): AutocompleteOption[] {
          return [{ value: 'cat' }, { value: 'dog' }, { value: 'bird' }];
        },
        select({ next }: SelectProps) {
          const { value, width } = next ?? {};
          return { value, width };
        },
      },
    ],
  });
  const book = useSpellbook({
    policies: {
      color: colorPolicy,
      animal: animalPolicy,
    },
  });

  return (
    <div>
      <GridSheet
        book={book}
        initialCells={buildInitialCells({
          cells: {
            A: {
              label: 'color',
              policy: 'color',
            },
            B: {
              label: 'animal',
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
      <Debugger book={book} />
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
