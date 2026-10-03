import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet, operations } from '@gridsheet/react-core';

import { useSpellbook } from '@gridsheet/react-core/spellbook';

const meta: Meta = {
  title: 'Basic/Merge',
};
export default meta;

const DESCRIPTION = [
  'Merged cells. A merge is stored on its top-left (anchor) cell as `merge: { rows, cols }`;',
  'the other cells in the range are covered and empty.',
  'Select a range and right-click → "Merge cells" / "Unmerge cells". Undo/redo restore the previous layout.',
  '`prevention: operations.Merge` forbids merging a range that contains the cell (H2), or unmerging a merge anchored on it (H5:I6).',
].join('\n\n');

const MergeSheet = () => {
  const book = useSpellbook();
  return (
    <GridSheet
      book={book}
      initialCells={buildInitialCells({
        matrices: {
          A5: [
            [1, 2, 3, 4],
            [5, 6, 7, 8],
            [9, 10, 11, 12],
          ],
        },
        cells: {
          B2: {
            value: 'Merged B2:D3',
            merge: { rows: 2, cols: 3 },
            justifyContent: 'center',
            alignItems: 'center',
            style: { backgroundColor: 'rgba(0, 160, 255, 0.12)' },
          },
          F2: { value: 'Tall F2:F6', merge: { rows: 5, cols: 1 }, alignItems: 'center' },
          A8: { value: '=SUM(A5:D7)' },
          H2: {
            value: 'No merge',
            prevention: operations.Merge,
            style: { backgroundColor: 'rgba(255, 80, 80, 0.12)' },
          },
          H5: {
            value: 'Locked merge',
            merge: { rows: 2, cols: 2 },
            prevention: operations.Merge,
            style: { backgroundColor: 'rgba(255, 80, 80, 0.12)' },
          },
        },
        ensured: { numRows: 60, numCols: 12 },
      })}
      options={{ sheetHeight: 400, sheetWidth: 800 }}
    />
  );
};

export const Sheet: StoryObj = {
  render: () => <MergeSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
