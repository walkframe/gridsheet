import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet, ModeType } from '@gridsheet/react-core';

import { useSpellbook } from '@gridsheet/react-core/spellbook';

type Props = {
  mode: ModeType;
};

const Sheet = ({ mode }: Props) => {
  const book = useSpellbook();
  return (
    <GridSheet
      book={book}
      initialCells={buildInitialCells({
        ensured: { numRows: 10, numCols: 10 },
      })}
      options={{
        matrixAlignment: 'both',
        mode,
      }}
    />
  );
};

const meta: Meta<typeof Sheet> = {
  title: 'Basic/Theme',
  component: Sheet,
};
export default meta;

const DESCRIPTION = [
  'This demo showcases the dark theme mode of the GridSheet component.',
  'The grid automatically applies dark styling with appropriate contrast for better visibility in low-light environments.',
].join('\n\n');

export const Dark: StoryObj<typeof Sheet> = {
  args: { mode: 'dark' },
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};

// mode: 'inherit' keeps the sheet transparent and derives its text and grid lines from the
// surrounding `color`, so it blends into whatever background it is placed on.
const PANELS = [
  { bg: '#ffffff', color: '#1f2328', label: 'On white — inherits near-black text' },
  { bg: '#0f172a', color: '#e2e8f0', label: 'On dark navy — inherits light text' },
  { bg: '#fef3c7', color: '#78350f', label: 'On amber — inherits brown text' },
];

const InheritDemo = () => {
  const books = [useSpellbook(), useSpellbook(), useSpellbook()];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 16 }}>
      {PANELS.map(({ bg, color, label }, i) => (
        <div key={i} style={{ background: bg, color, padding: 24, borderRadius: 12 }}>
          <div style={{ marginBottom: 12, fontWeight: 600 }}>{label}</div>
          <GridSheet
            book={books[i]}
            initialCells={buildInitialCells({
              cells: {
                A1: { value: 'Revenue' },
                B1: { value: 120 },
                A2: { value: 'Cost' },
                B2: { value: 80 },
                A3: { value: 'Profit' },
                B3: { value: '=B1-B2' },
              },
              ensured: { numRows: 6, numCols: 4 },
            })}
            options={{ mode: 'inherit' }}
          />
        </div>
      ))}
    </div>
  );
};

const INHERIT_DESCRIPTION = [
  "`mode: 'inherit'` makes the sheet transparent and derives its foreground (text) and grid",
  'lines from the surrounding `currentColor`, so the same grid blends into whatever background',
  'it is placed on. Only the accent (selection) stays fixed. Set the parent `background` and',
  '`color`, or override `--gs-bg` / `--gs-accent`, to control it.',
].join(' ');

export const Inherit: StoryObj = {
  render: () => <InheritDemo />,
  parameters: {
    docs: {
      description: {
        story: INHERIT_DESCRIPTION,
      },
    },
  },
};
