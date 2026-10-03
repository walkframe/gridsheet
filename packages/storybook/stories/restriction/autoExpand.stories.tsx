import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GridSheet, buildInitialCells, type AutoExpandType } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Restriction/AutoExpand',
};
export default meta;

const DESCRIPTION = [
  '## Example',
  'With `options.autoExpand`, a paste or an autofill that runs past the last row/column grows the sheet instead of being clipped.',
  '## How it works',
  "1. `'none'` (default) clips the overflow; `'vertical'` appends rows; `'horizontal'` appends columns; `'both'` appends either.",
  '2. While dragging the autofill handle, ghost rows/columns appear past the edge so the drag can reach cells that do not exist yet.',
  '3. Growth is capped by `limits.maxRows` / `limits.maxCols` (here 12 rows × 8 columns).',
  '4. The added rows/columns and the write undo together in a single step.',
].join('\n\n');

const MODES: AutoExpandType[] = ['none', 'vertical', 'horizontal', 'both'];

const AutoExpandComponent: React.FC = () => {
  const [mode, setMode] = React.useState<AutoExpandType>('both');
  return (
    <div>
      <div className="mode-selector" style={{ marginBottom: 8 }}>
        {MODES.map((m) => (
          <label key={m} style={{ marginRight: 12 }}>
            <input type="radio" name="autoExpand" value={m} checked={mode === m} onChange={() => setMode(m)} />
            {m}
          </label>
        ))}
      </div>
      <GridSheet
        options={{ autoExpand: mode, limits: { maxRows: 12, maxCols: 8 } }}
        initialCells={buildInitialCells({
          matrices: {
            A1: [
              [1, 'a', 'x'],
              [2, 'b', 'y'],
              [3, 'c', 'z'],
            ],
          },
          ensured: { numRows: 5, numCols: 4 },
        })}
      />
    </div>
  );
};

export const AutoExpand: StoryObj = {
  render: () => <AutoExpandComponent />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
