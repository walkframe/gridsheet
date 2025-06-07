import React, { type CSSProperties } from 'react';
import {
  GridSheet,
  Policy,
  PolicyOption,
  PolicyMixinType,
  CellsByAddressType,
  constructInitialCells,
  TimeDelta,
} from '@gridsheet/react-core';

export const Options = () => {
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
        callback({ patch, table, point }) {
          let { value } = patch ?? {};
          if (value == null) {
            value = table.getByPoint(point)?.value;
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
        callback({ patch }) {
          const { value, width } = patch ?? {};
          return { value, width };
        },
      },
    ],
  });

  return (
    <GridSheet
      options={{
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
      }}
      initialCells={constructInitialCells({
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

export default {
  title: 'Policy',
  component: Options,
};
