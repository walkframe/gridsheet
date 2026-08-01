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

// mode: 'inherit-light' / 'inherit-dark' keep the sheet transparent so it blends into the
// host background; pick the variant matching the background's lightness.
const PANELS: { bg: string; color: string; label: string; mode: ModeType }[] = [
  { bg: '#ffffff', color: '#1f2328', label: 'On white — inherit-light', mode: 'inherit-light' },
  { bg: '#0f172a', color: '#e2e8f0', label: 'On dark navy — inherit-dark', mode: 'inherit-dark' },
  { bg: '#fef3c7', color: '#78350f', label: 'On amber — inherit-light', mode: 'inherit-light' },
];

const InheritDemo = () => {
  const books = [useSpellbook(), useSpellbook(), useSpellbook()];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 16 }}>
      {PANELS.map(({ bg, color, label, mode }, i) => (
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
            options={{ mode, matrixAlignment: 'both', sheetResize: 'both' }}
          />
        </div>
      ))}
    </div>
  );
};

const INHERIT_DESCRIPTION = [
  "`mode: 'inherit-light'` / `'inherit-dark'` keep the sheet background transparent so it",
  'blends into whatever it is placed on, while using a concrete light or dark palette for the',
  'text, grid lines, and the (portaled) editor and menus. Pick the variant matching the host',
  "background's lightness. Override `--gs-bg` / `--gs-accent` etc. to fine-tune.",
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
