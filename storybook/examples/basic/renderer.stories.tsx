import React from "react";
import { constructInitialCells, GridSheet, Renderer, RendererMixinType, CheckboxRendererMixin } from "@gridsheet/react-core";

export default {
  title: "Basic",
};

const kanjiMap: { [s: string]: string } = {
  "0": "〇",
  "1": "一",
  "2": "二",
  "3": "三",
  "4": "四",
  "5": "五",
  "6": "六",
  "7": "七",
  "8": "八",
  "9": "九",
  ".": ".",
};

const KanjiRendererMixin: RendererMixinType = {
  number(value: number): string {
    const minus = value < 0;

    let kanji = "";
    let [int, fraction] = String(Math.abs(value)).split(".");
    for (let i = 0; i < int.length; i++) {
      const j = int.length - i;
      if (j % 3 === 0 && i !== 0) {
        kanji += ",";
      }
      kanji += kanjiMap[int[i]];
    }
    if (fraction == null) {
      return minus ? `-${kanji}` : kanji;
    }
    kanji += ".";
    for (let i = 0; i < fraction.length; i++) {
      kanji += kanjiMap[fraction[i]];
    }
    return minus ? `-${kanji}` : kanji;
  }
}

export const RenderToKanji = () => {
  return (
    <>
      <GridSheet
        initialCells={constructInitialCells({
          matrices: {
            A1: [[true, false]],
            B3: [[100], [200, 300], [400, 500, 600], [800, 900, 1000, 1100]],
          },
          cells: {
            default: {
              renderer: "kanji",
            },
          },
          ensured: { numRows: 30, numCols: 20 },
        })}
        options={{
          renderers: {
            kanji: new Renderer({
              mixins: [
                KanjiRendererMixin,
                CheckboxRendererMixin,
              ]
            }),
          },
        }}
      />
    </>
  );
};
