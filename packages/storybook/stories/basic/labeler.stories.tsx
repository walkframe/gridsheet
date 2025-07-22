import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GridSheet, buildInitialCells, useHub } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Basic/Labeler',
};
export default meta;

const DESCRIPTION = [
  'In this example, we have two labelers: "hiragana" and "katakana".',
  'The "hiragana" labeler converts numbers to corresponding hiragana characters, while the "katakana" labeler converts numbers to katakana characters.',
  'The cells in columns A to E use the "hiragana" labeler, while the cells in row 1 use the "katakana" labeler.',
].join('\n\n');

const LabelerSheet = () => {
  const hub = useHub({
    labelers: {
      hiragana: (n) => 'あいうえおかきくけこ'.slice(n - 1, n),
      katakana: (n) => 'アイウエオカキクケコ'.slice(n - 1, n),
    },
  });

  return (
    <GridSheet
      hub={hub}
      initialCells={buildInitialCells({
        cells: {
          A: { labeler: 'hiragana' },
          B: { labeler: 'hiragana' },
          C: { labeler: 'hiragana' },
          D: { labeler: 'hiragana' },
          E: { labeler: 'hiragana' },
          1: { labeler: 'katakana' },
          2: { labeler: 'katakana' },
          3: { labeler: 'katakana' },
          4: { labeler: 'katakana' },
          5: { labeler: 'katakana' },
          A1: { value: '=SUM($B1:C$1)' },
          B1: { value: 1 },
          C1: { value: 100 },
          D1: { value: 200 },
          A2: { value: '=$B2' },
          B2: { value: 2 },
        },
        ensured: { numRows: 7, numCols: 10 },
      })}
    />
  );
};

export const Labeler: StoryObj = {
  render: () => <LabelerSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
