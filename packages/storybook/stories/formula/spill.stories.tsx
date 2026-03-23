import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  BaseFunctionAsync,
  buildInitialCells,
  GridSheet,
  Spilling,
  FunctionArgumentDefinition,
} from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/functions';
import { Debugger } from '@gridsheet/react-dev';

const meta: Meta = {
  title: 'Formula/Spill',
};
export default meta;

class Range1DFunction extends BaseFunctionAsync {
  example = 'RANGE.1D(5)';
  description = 'Returns a 1D array that spills downward.';
  defs: FunctionArgumentDefinition[] = [{ name: 'length', description: 'The length of the array.' }];

  async main(length: number) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const result = [];
    for (let i = 0; i < length; i++) {
      result.push(i + 1);
    }
    return new Spilling(result);
  }
}

// ---------------------------------------------------------------------------
// DelaySequence: async version of SEQUENCE that spills after 0.5 seconds
// ---------------------------------------------------------------------------
class DelaySequenceFunction extends BaseFunctionAsync {
  example = 'DELAY_SEQUENCE(4, 3, 1, 1)';
  description = 'Async version of SEQUENCE. Returns the same rows×cols matrix after a 0.5-second delay.';
  defs: FunctionArgumentDefinition[] = [
    { name: 'rows', description: 'The number of rows to return.', acceptedTypes: ['number'] },
    {
      name: 'columns',
      description: 'The number of columns to return. Defaults to 1.',
      optional: true,
      acceptedTypes: ['number'],
    },
    {
      name: 'start',
      description: 'The starting value of the sequence. Defaults to 1.',
      optional: true,
      acceptedTypes: ['number'],
    },
    {
      name: 'step',
      description: 'The increment between each value. Defaults to 1.',
      optional: true,
      acceptedTypes: ['number'],
    },
  ];

  async main(rows: number, cols: number = 1, start: number = 1, step: number = 1) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const matrix: number[][] = [];
    let current = start;
    for (let y = 0; y < rows; y++) {
      const row: number[] = [];
      for (let x = 0; x < cols; x++) {
        row.push(current);
        current += step;
      }
      matrix.push(row);
    }
    return new Spilling(matrix);
  }
}

// ---------------------------------------------------------------------------
// Shared cell layout helper
// Normal cases + overflow check (J1: SEQUENCE(6) — spills beyond the 10-col boundary)
// ---------------------------------------------------------------------------
function makeInitialCells(prefix: 'SEQUENCE' | 'DELAY_SEQUENCE') {
  return buildInitialCells({
    cells: {
      default: { width: 80 },
      // ---- Label row (row 1) ----
      A1: { value: `${prefix}(4)` },
      C1: { value: `${prefix}(3, 2)` },
      F1: { value: `${prefix}(3, 3, 10, 5)` },
      // ---- Formulas (start from row 2) ----
      A2: { value: `=${prefix}(4)` },
      C2: { value: `=${prefix}(3, 2)` },
      F2: { value: `=${prefix}(3, 3, 10, 5)` },
      // ---- Overflow check: spill runs off the right edge ----
      // SEQUENCE(1, 4) starting at column J (col 10); sheet has 10 cols so K/L/M are out of bounds
      J1: { value: `overflow →` },
      J2: { value: `=${prefix}(1, 4)` },

      C10: { value: '=SUM(C2:D4)' },
      E10: { value: '=RANGE.1D(5)' },
    },
    ensured: { numRows: 10, numCols: 10 },
  });
}

// ---------------------------------------------------------------------------
// Side-by-side view (Sync left / Async right) — single book
// ---------------------------------------------------------------------------
const SpillSideBySide: React.FC = () => {
  const book = useSpellbook({
    onChange: (change) => {
      console.log('Book change:', change);
    },
    additionalFunctions: {
      'range.1d': Range1DFunction,
      delay_sequence: DelaySequenceFunction,
    },
  });
  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', overflow: 'auto' }}>
      <div>
        <h3 style={{ margin: '0 0 0.5rem' }}>Sync: SEQUENCE</h3>
        <GridSheet
          book={book}
          sheetName="SpillSync"
          initialCells={makeInitialCells('SEQUENCE')}
          options={{ sheetHeight: 300 }}
        />
      </div>
      <div>
        <h3 style={{ margin: '0 0 0.5rem' }}>Async: DELAY_SEQUENCE (0.5 s)</h3>
        <GridSheet
          book={book}
          sheetName="SpillAsync"
          initialCells={makeInitialCells('DELAY_SEQUENCE')}
          options={{ sheetHeight: 300 }}
        />
      </div>
      <Debugger book={book} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Blocked / error cases
// A1: SEQUENCE(3,2) — A3 is pre-filled with "BLOCK" → #REF! (value obstruction)
// D1: SEQUENCE(3,2) and D2: SEQUENCE(3,2) — spill ranges overlap → D2 origin → #REF!
// ---------------------------------------------------------------------------
const SpillBlockedSheet: React.FC = () => {
  const book = useSpellbook({
    onChange: (change) => {
      console.log('Book change:', change);
    },
  });
  return (
    <>
      <GridSheet
        book={book}
        sheetName="SpillBlocked"
        initialCells={buildInitialCells({
          cells: {
            default: { width: 100 },
            // ---- Case 1: existing value blocks the spill ----
            A1: { value: '=SEQUENCE(3, 1)' },
            // A3 sits inside the 3×2 spill range (A1:B3), so A1 → #REF!
            A3: { value: 'BLOCK' },
            B1: { value: '=ARRAYFORMULA(A1:A3+2)' },
            // ---- Case 2: overlapping spill ranges ----
            // D1 spills into D1:E3 (3 rows × 2 cols).
            // E2 also tries to spill into E2:F4, which overlaps D1's range at E2/E3.
            // D1 is evaluated first and claims E2/E3; E2's spill is therefore blocked → #REF!
            D1: { value: '=SEQUENCE(3, 2)' },
            C2: { value: '=SEQUENCE(3, 2)' },
          },
          ensured: { numRows: 8, numCols: 8 },
        })}
        options={{ sheetHeight: 300 }}
      />
      <Debugger book={book} />
    </>
  );
};

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------
export const SpillSequence: StoryObj = {
  render: () => <SpillSideBySide />,
  parameters: {
    docs: {
      description: {
        story: [
          'Left: sync `SEQUENCE`. Right: async `DELAY_SEQUENCE` (resolves after 0.5 s).',
          '',
          '- **A1**: `=SEQUENCE(4)` / `=DELAY_SEQUENCE(4)` → spills 1–4 downward (A1:A4)',
          '- **C1**: `=SEQUENCE(3, 2)` / `=DELAY_SEQUENCE(3, 2)` → 3×2 matrix (C1:D3)',
          '- **F1**: `=SEQUENCE(3, 3, 10, 5)` / `=DELAY_SEQUENCE(3, 3, 10, 5)` → 3×3 starting at 10, step 5 (F1:H3)',
          '- **J9**: `=SEQUENCE(1, 4)` / `=DELAY_SEQUENCE(1, 4)` → overflow beyond the right edge (cols K–M are out of bounds)',
          '',
          'Both sheets should display identical final values. Scroll horizontally to observe the overflow behaviour.',
        ].join('\n'),
      },
    },
  },
};

export const SpillBlocked: StoryObj = {
  render: () => <SpillBlockedSheet />,
  parameters: {
    docs: {
      description: {
        story: [
          '### Spill blocked → `#REF!`',
          '',
          '- **A1** `=SEQUENCE(3, 2)` — **A3** is pre-filled with `"BLOCK"`, which sits inside the',
          '  spill range (A1:B3). The origin cell A1 shows `#REF!`.',
          '- **D1** `=SEQUENCE(3, 2)` and **E2** `=SEQUENCE(3, 2)` — the two spill ranges overlap.',
          "  D1 spills into D1:E3 first and claims E2/E3; E2's spill is blocked → E2 shows `#REF!`.",
        ].join('\n'),
      },
    },
  },
};
