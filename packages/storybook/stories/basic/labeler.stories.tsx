import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GridSheet, buildInitialCells, Policy } from '@gridsheet/react-core';

import { useSpellbook } from '@gridsheet/react-core/spellbook';

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
  const book = useSpellbook({
    policies: {
      hiragana: new Policy({ mixins: [{ renderColHeaderLabel: (n) => 'あいうえおかきくけこ'.slice(n - 1, n) }] }),
      katakana: new Policy({ mixins: [{ renderRowHeaderLabel: (n) => 'アイウエオカキクケコ'.slice(n - 1, n) }] }),
    },
  });

  return (
    <GridSheet
      book={book}
      initialCells={buildInitialCells({
        cells: {
          A: { policy: 'hiragana' },
          B: { policy: 'hiragana' },
          C: { policy: 'hiragana' },
          D: { policy: 'hiragana' },
          E: { policy: 'hiragana' },
          1: { policy: 'katakana' },
          2: { policy: 'katakana' },
          3: { policy: 'katakana' },
          4: { policy: 'katakana' },
          5: { policy: 'katakana' },
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
