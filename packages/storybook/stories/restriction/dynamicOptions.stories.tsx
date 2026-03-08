import React, { useMemo, useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  GridSheet,
  Policy,
  AutocompleteOption,
  buildInitialCells,
  buildInitialCellsFromOrigin,
  operations,
  useHub,
  type SelectProps,
} from '@gridsheet/react-core';
import { allFunctions } from '@gridsheet/functions';

const meta: Meta = {
  title: 'Restriction/DynamicOptions',
};
export default meta;

const DESCRIPTION = [
  '## Example',
  'This demo showcases dynamic policy options that can be updated in real-time.',
  'The top grid displays cells with a framework policy that shows dropdown options.',
  'The bottom grid allows you to edit the available options, and changes are immediately reflected in the top grid.',

  '## How it works',
  'This demonstrates how policies can be dynamically configured for interactive data validation and user experience enhancement.',
  '1. The framework policy provides dropdown options for framework selection.',
  '2. The option matrix is managed in state and can be updated dynamically.',
  '3. Changes to the option matrix immediately update the available options in the policy.',
  '4. This creates a responsive and interactive data validation system.',
].join('\n\n');

const DynamicOptionsComponent: React.FC = () => {
  const [optionMatrix, setOptionMatrix] = useState<[string, string][]>([
    ['nextjs', 'Next.js'],
    ['nuxtjs', 'Nuxt.js'],
    ['sveltekit', 'SvelteKit'],
    ['angular', 'Angular'],
  ]);

  const fwPolicy = useMemo(
    () =>
      new Policy({
        mixins: [
          {
            getSelectOptions(): AutocompleteOption[] {
              return optionMatrix.map(([value, label]) => ({ value, label }));
            },
            select({ next }: SelectProps) {
              const { value } = next ?? {};
              const isValid = optionMatrix.some(([v]) => v === value);
              const style = isValid ? undefined : { color: '#f88' };
              return { value, style };
            },
          },
        ],
      }),
    [optionMatrix],
  );
  const hub = useHub({
    additionalFunctions: allFunctions,
    policies: {
      fw: fwPolicy,
    },
    onChange: ({ table, points }) => {
      if (table.sheetName === 'options') {
        const matrix = table.toValueMatrix() as [string, string][];
        setOptionMatrix(matrix);
      }
    },
  });

  return (
    <>
      <GridSheet
        hub={hub}
        initialCells={buildInitialCells({
          cells: {
            default: { policy: 'fw', width: 150 },
          },
          ensured: { numRows: 4, numCols: 3 },
        })}
        options={{}}
      />
      <hr />

      <GridSheet
        sheetName="options"
        hub={hub}
        initialCells={buildInitialCellsFromOrigin({
          matrix: optionMatrix,
          cells: {
            A: {
              label: 'Value',
            },
            B: {
              label: 'Label',
            },
            default: {
              prevention: operations.InsertCols,
            },
          },
        })}
        options={{}}
      />
    </>
  );
};

export const DynamicOptions: StoryObj = {
  render: () => <DynamicOptionsComponent />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
