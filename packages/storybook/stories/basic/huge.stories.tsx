import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet, Policy } from '@gridsheet/react-core';

import { useSpellbook } from '@gridsheet/react-core/spellbook';

const meta: Meta = {
  title: 'Basic/Huge',
};
export default meta;

const DESCRIPTION = [
  'This demo showcases GridSheet performance with a huge empty grid: 500,000 rows × 10 columns.',
].join('\n\n');

const HugeSheet = () => {
  const rawPolicy = new Policy({
    mixins: [{ renderColHeaderLabel: (n) => String(n), renderRowHeaderLabel: (n) => String(n) }],
  });
  const book = useSpellbook({
    policies: { raw: rawPolicy },
  });

  return (
    <>
      <div style={{ marginBottom: '10px' }}>
        <h3>Huge Grid Performance Test</h3>
        <p>Grid size: 500,000 rows × 10 columns</p>
      </div>

      <GridSheet
        book={book}
        initialCells={buildInitialCells({
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
          ensured: { numRows: 500000, numCols: 10 },
        })}
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
