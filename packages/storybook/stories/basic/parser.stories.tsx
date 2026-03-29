import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CellType, buildInitialCells, GridSheet, Policy, RenderProps } from '@gridsheet/react-core';

import { useSpellbook } from '@gridsheet/react-core/spellbook';
import { Debugger } from '@gridsheet/react-dev';

const meta: Meta = {
  title: 'Basic/Parser',
};
export default meta;

const DESCRIPTION = [
  'This demo showcases custom parsers in GridSheet.',
  'It demonstrates how to create custom parsing logic for converting user input into structured data.',
  'The example shows a list parser that converts text input into arrays.',
].join('\n\n');

const ParseAsListSheet = () => {
  const book = useSpellbook({
    policies: {
      list: new Policy({
        mixins: [
          {
            renderArray({ value }: RenderProps<any[]>) {
              return (
                <ul>
                  {value!.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              );
            },
            deserializeFirst: (value: string) => {
              if (value.charAt(0) === '=') {
                return { value };
              }
              return { value: value.split(/\n/g) };
            },
          },
        ],
      }),
    },
  });

  return (
    <>
      <GridSheet
        book={book}
        initialCells={buildInitialCells({
          matrices: {
            A1: [
              [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
              ],
              [
                [10, 11, 12],
                [13, 14, 15],
                [16, 17, 18],
              ],
              [
                [19, 20, 21],
                [22, 23, 24],
                [25, 26, 27],
              ],
            ],
          },
          cells: {
            default: {
              policy: 'list',
            },
            defaultRow: { height: 100 },
          },
          ensured: { numRows: 30, numCols: 20 },
        })}
      />
      <Debugger book={book} />
    </>
  );
};

export const ParseAsList: StoryObj = {
  render: () => <ParseAsListSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
