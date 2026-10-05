'use client';

import * as React from 'react';
import { GridSheet, buildInitialCells, type AutoExpandType } from '@gridsheet/react-core';
import { useStarlightMode } from './useStarlightMode';

const MODES: { value: AutoExpandType; label: string }[] = [
  { value: 'none', label: "'none' (default)" },
  { value: 'vertical', label: "'vertical'" },
  { value: 'horizontal', label: "'horizontal'" },
  { value: 'both', label: "'both'" },
];

// Tab-separated, so it pastes as a 4×3 block from the clipboard.
const SAMPLE_TSV = ['Mon\t12\t3', 'Tue\t15\t4', 'Wed\t9\t2', 'Thu\t18\t5'].join('\n');

// A small 6×5 sheet with a block of data and a numeric series, so overflowing it is easy.
// Theme-independent cell styles only (see useStarlightMode): they're baked once here.
const initialCells = buildInitialCells({
  matrices: {
    A1: [
      ['Day', 'Visits', 'Signups'],
      ['Fri', 20, 6],
      ['Sat', 11, 1],
    ],
    E1: [[1], [2], [3]],
  },
  cells: {
    defaultCol: { width: 80 },
    1: { style: { fontWeight: 'bold' } },
    E1: { style: { backgroundColor: 'rgba(0, 119, 255, 0.12)' } },
    E2: { style: { backgroundColor: 'rgba(0, 119, 255, 0.12)' } },
    E3: { style: { backgroundColor: 'rgba(0, 119, 255, 0.12)' } },
  },
  ensured: { numRows: 6, numCols: 5 },
});

export default function AutoExpandDemo() {
  const inheritMode = useStarlightMode();
  const [autoExpand, setAutoExpand] = React.useState<AutoExpandType>('both');
  // Remount on mode change so every mode starts from the same 6×5 sheet.
  const [version, setVersion] = React.useState(0);
  const choose = (value: AutoExpandType) => {
    setAutoExpand(value);
    setVersion((v) => v + 1);
  };

  return (
    <div style={{ padding: '10px', fontSize: 13 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
        <strong>autoExpand:</strong>
        {MODES.map(({ value, label }) => (
          <label key={value} style={{ cursor: 'pointer' }}>
            <input
              type="radio"
              name="case13-auto-expand"
              checked={autoExpand === value}
              onChange={() => choose(value)}
              style={{ marginRight: 4 }}
            />
            <code>{label}</code>
          </label>
        ))}
      </div>

      <ol style={{ margin: '0 0 10px', paddingLeft: 20, lineHeight: 1.7 }}>
        <li>
          <strong>Paste:</strong> select <code>A1:C3</code>, copy it (Ctrl/Cmd+C), click <code>D5</code> and paste. It
          runs past the last row and column.
        </li>
        <li>
          <strong>Clipboard:</strong> copy the text below, click <code>A5</code> and paste — a 4-row block into a 6-row
          sheet.
        </li>
        <li>
          <strong>Autofill:</strong> select <code>E1:E3</code> and drag its fill handle (the small square) below the
          sheet and hold. Provisional rows appear — faster the further you pull — and are added when you release.
        </li>
      </ol>

      <textarea
        readOnly
        value={SAMPLE_TSV}
        rows={4}
        onFocus={(e) => e.currentTarget.select()}
        style={{
          // Block-level, so the sheet below gets the full row (inline, it squeezed the grid).
          display: 'block',
          width: 200,
          fontFamily: 'monospace',
          fontSize: 12,
          marginBottom: 10,
          resize: 'none',
          color: 'var(--sl-color-white)',
          background: 'var(--sl-color-gray-6)',
          border: '1px solid var(--sl-color-gray-5)',
          borderRadius: 4,
          padding: '4px 6px',
        }}
      />

      <GridSheet
        key={version}
        sheetName="auto-expand"
        initialCells={initialCells}
        options={{
          autoExpand,
          limits: { maxRows: 200, maxCols: 26 },
          sheetResize: 'both',
          showFormulaBar: true,
          mode: inheritMode,
        }}
      />
      <p style={{ marginTop: 8, opacity: 0.75 }}>
        Undo (Ctrl/Cmd+Z) removes the added rows/columns together with the pasted or filled values.
      </p>
    </div>
  );
}
