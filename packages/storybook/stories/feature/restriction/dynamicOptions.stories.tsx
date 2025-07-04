import React, { useMemo, useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  GridSheet,
  Policy,
  PolicyOption,
  buildInitialCells,
  buildInitialCellsFromOrigin,
  operations,
  useHub,
} from '@gridsheet/react-core';

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
            getDefault({ value }) {
              return { value, style: { color: '#f88' } };
            },
            getOptions(): PolicyOption[] {
              return optionMatrix.map(([value, label]) => ({ value, label }));
            },
            validate({ patch, table, point }) {
              const { value, style } = patch ?? {};
              return { value, style };
            },
          },
        ],
      }),
    [optionMatrix],
  );
  const hub = useHub({
    policies: {
      fw: fwPolicy,
    },
    labelers: {
      value: (n: number) => {
        return 'Value';
      },
      label: (n: number) => {
        return 'Label';
      },
    },
    onChange: ({ table, points }) => {
      const matrix = table.getFieldMatrix() as [string, string][];
      setOptionMatrix(matrix);
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
        hub={hub}
        initialCells={buildInitialCellsFromOrigin({
          matrix: optionMatrix,
          cells: {
            A: {
              labeler: 'value',
            },
            B: {
              labeler: 'label',
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
