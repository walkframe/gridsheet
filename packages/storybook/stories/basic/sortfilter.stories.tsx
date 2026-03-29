import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GridSheet, buildInitialCells, Policy, CheckboxPolicyMixin } from '@gridsheet/react-core';

import { useSpellbook } from '@gridsheet/react-core/spellbook';

const meta: Meta = {
  title: 'Basic/SortFilter',
};
export default meta;

const DESCRIPTION = [
  '## Sort & Filter',
  'This demo showcases sorting and filtering functionality in GridSheet.',
  'Click the ⋮ button on the column header to open the column menu.',
  'You can sort rows ascending/descending or apply filters to show/hide rows.',
  'Column A uses a checkbox renderer for boolean values.',
].join('\n\n');

const SortFilterSheet = () => {
  const book = useSpellbook({
    policies: {
      checkbox: new Policy({ mixins: [CheckboxPolicyMixin] }),
    },
  });
  return (
    <GridSheet
      book={book}
      options={{
        sheetResize: 'both',
      }}
      initialCells={buildInitialCells({
        cells: {
          defaultCol: { width: 120 },
          A0: { label: 'Active', width: 60 },
          A: { policy: 'checkbox' },
          B0: { label: 'Name' },
          C0: { label: 'Score' },
          D0: { label: 'Grade' },
          A1: { value: true },
          B1: { value: 'Alice' },
          C1: { value: 90 },
          D1: { value: 'A' },
          A2: { value: false },
          B2: { value: 'Bob' },
          C2: { value: 75 },
          D2: { value: 'B' },
          A3: { value: true },
          B3: { value: 'Charlie' },
          C3: { value: 60 },
          D3: { value: 'C' },
          A4: { value: true },
          B4: { value: 'Diana' },
          C4: { value: 85 },
          D4: { value: 'A' },
          A5: { value: false },
          B5: { value: 'Eve' },
          C5: { value: 40 },
          D5: { value: 'D' },
          B6: { value: 'Total' },
          C6: { value: '=SUM(C1:C5)' },
          '6': { style: { borderTop: '3px double #555' } },
          '06': { sortFixed: true, filterFixed: true },
        },
        ensured: { numRows: 6, numCols: 4 },
      })}
    />
  );
};

export const Sheet: StoryObj = {
  render: () => <SortFilterSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
