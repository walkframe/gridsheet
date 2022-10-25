import React from "react";
import { generateInitial, GridSheet, Renderer } from "../../../src";

export default {
  title: "Basic",
};

class KanjiRenderer extends Renderer {
  protected kanjiMap: { [s: string]: string } = {
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
  number(value: number): string {
    const minus = value < 0;

    let kanji = "";
    let [int, fraction] = String(Math.abs(value)).split(".");
    for (let i = 0; i < int.length; i++) {
      const j = int.length - i;
      if (j % 3 === 0 && i !== 0) {
        kanji += ",";
      }
      kanji += this.kanjiMap[int[i]];
    }
    if (fraction == null) {
      return minus ? `-${kanji}` : kanji;
    }
    kanji += ".";
    for (let i = 0; i < fraction.length; i++) {
      kanji += this.kanjiMap[fraction[i]];
    }
    return minus ? `-${kanji}` : kanji;
  }
}

export const RenderToKanji = () => {
  return (
    <>
      <GridSheet
        initial={generateInitial({
          matrixes: {
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
            kanji: new KanjiRenderer(),
          },
        }}
      />
    </>
  );
};
