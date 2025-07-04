import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  buildInitialCells,
  GridSheet,
  Renderer,
  RendererMixinType,
  CheckboxRendererMixin,
  RenderProps,
  p2a,
  useHub,
} from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Basic/Renderer',
};
export default meta;

const DESCRIPTION = [
  'This demo showcases custom renderers in GridSheet.',
  'It demonstrates how to create custom rendering logic for different data types.',
  'The example shows a kanji renderer that converts numbers to Japanese kanji characters.',
].join('\n\n');

const kanjiMap: { [s: string]: string } = {
  '0': '〇',
  '1': '一',
  '2': '二',
  '3': '三',
  '4': '四',
  '5': '五',
  '6': '六',
  '7': '七',
  '8': '八',
  '9': '九',
  '.': '.',
};

const RenderToKanjiSheet = () => {
  const hub = useHub({
    renderers: {
      kanji: new Renderer({
        mixins: [
          {
            string({ value }: RenderProps<string>): string {
              return value!;
            },
            number({ value }: RenderProps<number>) {
              const minus = value! < 0;

              let kanji = '';
              let [int, fraction] = String(Math.abs(value!)).split('.');
              for (let i = 0; i < int.length; i++) {
                const j = int.length - i;
                if (j % 3 === 0 && i !== 0) {
                  kanji += ',';
                }
                kanji += kanjiMap[int[i]];
              }
              if (fraction == null) {
                return minus ? <span>{kanji}</span> : <span>{kanji}</span>;
              }
              kanji += '.';
              for (let i = 0; i < fraction.length; i++) {
                kanji += kanjiMap[fraction[i]];
              }
              return minus ? <span>{kanji}</span> : <span>{kanji}</span>;
            },
          },
          {
            null({ cell, point }: RenderProps<null>) {
              return <span style={{ opacity: 0.3 }}>{p2a(point!)}</span>;
            },
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
          A1: [[true, false, 64]],
          B3: [[100], [200, 300], [400, 500, 600], [800, 900, 1000, 1100]],
        },
        cells: {
          default: {
            renderer: 'kanji',
          },
          B10: {
            value: '=B6+10000',
          },
        },
        ensured: { numRows: 30, numCols: 20 },
      })}
    />
  );
};

export const RenderToKanji: StoryObj = {
  render: () => <RenderToKanjiSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
