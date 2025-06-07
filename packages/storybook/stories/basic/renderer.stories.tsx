import React from 'react';
import {
  buildInitialCells,
  GridSheet,
  Renderer,
  RendererMixinType,
  CheckboxRendererMixin,
  RenderProps,
  p2a,
} from '@gridsheet/react-core';

export default {
  title: 'Basic',
};

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

const NullMixin: RendererMixinType = {
  null({ cell, point }: RenderProps<null>) {
    return <span style={{ opacity: 0.3 }}>{p2a(point!)}</span>;
  },
};

const KanjiRendererMixin: RendererMixinType = {
  string({ cell }: RenderProps<string>): string {
    return cell.value!;
  },
  number({ cell }: RenderProps<number>) {
    const minus = cell.value! < 0;

    let kanji = '';
    let [int, fraction] = String(Math.abs(cell.value!)).split('.');
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
};

export const RenderToKanji = () => {
  return (
    <>
      <GridSheet
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
        options={{
          renderers: {
            kanji: new Renderer({
              mixins: [KanjiRendererMixin, NullMixin],
            }),
          },
        }}
      />
    </>
  );
};
