import React, { useMemo, useState, type CSSProperties } from 'react';
import {
  GridSheet,
  Policy,
  PolicyOption,
  buildInitialCells,
  buildInitialCellsOrigin,
  operations,
} from '@gridsheet/react-core';

export const DynamicOptions = () => {
  const [optionMatrix, setOptionMatrix] = useState<[string, string][]>([
    ['nextjs', 'Next.js'],
    ['nuxtjs', 'Nuxt.js'],
    ['svelte', 'SvelteKit'],
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
            callback({ patch, table, point }) {
              const { value, style } = patch ?? {};
              return { value, style };
            },
          },
        ],
      }),
    [optionMatrix],
  );

  return (
    <>
      <GridSheet
        initialCells={buildInitialCells({
          cells: {
            default: { policy: 'fw', width: 150 },
          },
          ensured: { numRows: 4, numCols: 3 },
        })}
        options={{
          policies: {
            fw: fwPolicy,
          },
        }}
      />
      <hr />

      <GridSheet
        initialCells={buildInitialCellsOrigin({
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
        options={{
          onChange: (table, positions) => {
            const matrix = table.getFieldMatrix() as [string, string][];
            setOptionMatrix(matrix);
          },
          labelers: {
            value: (n: number) => {
              return 'Value';
            },
            label: (n: number) => {
              return 'Label';
            },
          },
        }}
      />
    </>
  );
};

export default {
  title: 'Policy',
  component: DynamicOptions,
};
