import { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet, Policy } from '@gridsheet/react-core';

import { useSpellbook } from '@gridsheet/react-core/spellbook';

const meta: Meta = {
  title: 'Basic/Huge',
};
export default meta;

const NUM_ROWS = 200000;

const DESCRIPTION = [
  `This demo showcases GridSheet performance with ${NUM_ROWS.toLocaleString()} rows × 10 columns (${(NUM_ROWS * 10).toLocaleString()} cells).`,
].join('\n\n');

const generateHugeData = () => {
  const data: any[][] = [];
  for (let i = 1; i <= NUM_ROWS; i++) {
    data.push([
      i,
      `Row ${i}`,
      Math.floor(Math.random() * 10000),
      Math.floor(Math.random() * 10000),
      Math.floor(Math.random() * 10000),
      Math.floor(Math.random() * 10000),
      Math.floor(Math.random() * 10000),
      ['Alpha', 'Beta', 'Gamma', 'Delta'][Math.floor(Math.random() * 4)],
      ['Active', 'Inactive', 'Pending'][Math.floor(Math.random() * 3)],
      `Note ${i}`,
    ]);
  }
  return data;
};

const HugeSheet = () => {
  const rawPolicy = new Policy({
    mixins: [{ renderColHeaderLabel: (n) => String(n), renderRowHeaderLabel: (n) => String(n) }],
  });
  const book = useSpellbook({
    policies: { raw: rawPolicy },
  });

  const initialCells = useMemo(() => buildInitialCells({
    matrices: { A1: generateHugeData() },
    cells: {
      defaultCol: { width: 120 },
      defaultRow: { height: 24 },
      default: { policy: 'raw' },
      A0: { width: 60, label: 'ID' },
      B0: { width: 150, label: 'Name' },
      C0: { width: 100, label: 'Value1' },
      D0: { width: 100, label: 'Value2' },
      E0: { width: 100, label: 'Value3' },
      F0: { width: 100, label: 'Value4' },
      G0: { width: 100, label: 'Value5' },
      H0: { width: 80, label: 'Group' },
      I0: { width: 80, label: 'Status' },
      J0: { width: 200, label: 'Notes' },
    },
    ensured: { numRows: NUM_ROWS, numCols: 10 },
  }), []);

  return (
    <>
      <div style={{ marginBottom: '10px' }}>
        <h3>Huge Dataset Performance Test</h3>
        <p>Grid size: {NUM_ROWS.toLocaleString()} rows × 10 columns ({(NUM_ROWS * 10).toLocaleString()} cells)</p>
      </div>

      <GridSheet
        book={book}
        initialCells={initialCells}
        options={{
          sheetHeight: 600,
          sheetWidth: 1200,
          sheetResize: 'both',
        }}
      />
    </>
  );
};

export const Sheet: StoryObj = {
  render: () => <HugeSheet />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
