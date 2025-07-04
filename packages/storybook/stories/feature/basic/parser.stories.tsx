import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CellType, buildInitialCells, GridSheet, Parser, Renderer, RenderProps, useHub } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Basic/Parser',
};
export default meta;

const DESCRIPTION = [
  'This demo showcases custom parsers in GridSheet.',
  'It demonstrates how to create custom parsing logic for converting user input into structured data.',
  'The example shows a list parser that converts text input into arrays.',
].join('\n\n');

class ListRenderer extends Renderer {}

const ParseAsListSheet = () => {
  const hub = useHub({
    renderers: {
      list: new Renderer({
        mixins: [
          {
            array({ value }: RenderProps<any[]>) {
              return (
                <ul>
                  {value!.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              );
            },
            stringify(cell: CellType): string {
              const value = cell.value;
              if (Array.isArray(value)) {
                return value.join('\n');
              }
              return value == null ? '' : String(value);
            },
          },
        ],
      }),
    },
    parsers: {
      list: new Parser({
        mixins: [
          {
            functions: [(value: string) => value.split(/\n/g)],
          },
        ],
      }),
    },
  });

  return (
    <GridSheet
      hub={hub}
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
            height: 100,
            renderer: 'list',
            parser: 'list',
          },
        },
        ensured: { numRows: 30, numCols: 20 },
      })}
    />
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
