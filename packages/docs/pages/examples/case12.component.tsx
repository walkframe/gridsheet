'use client';

import * as React from 'react';
import { GridSheet, buildInitialCells } from '@gridsheet/react-core';

// Build a grid large enough that it overflows and scrolls inside the parent.
const initialCells = buildInitialCells({
  matrices: {
    A1: Array.from({ length: 50 }, (_, y) =>
      Array.from({ length: 12 }, (_, x) => `R${y + 1}C${x + 1}`),
    ),
  },
  cells: {
    default: { width: 90, height: 28 },
    ...Object.fromEntries(
      Array.from({ length: 12 }, (_, x) => [
        `${String.fromCharCode(65 + x)}0`,
        { label: `Col ${x + 1}` },
      ]),
    ),
  },
});

export default function FillParent() {
  // The parent box is user-resizable. The GridSheet tracks its size automatically
  // because sheetWidth / sheetHeight are given as CSS strings ('100%').
  return (
    <div style={{ padding: '10px' }}>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
        Drag the bottom-right corner of the box below to resize it. The sheet fills the parent and
        re-measures itself on every resize.
      </p>
      <div
        style={{
          width: '100%',
          height: 320,
          minWidth: 240,
          minHeight: 160,
          resize: 'both',
          overflow: 'hidden',
          border: '2px dashed #007bff',
          borderRadius: 6,
          boxSizing: 'border-box',
        }}
      >
        <GridSheet
          sheetName="fill-parent"
          initialCells={initialCells}
          options={{
            sheetWidth: '100%',
            sheetHeight: '100%',
            showFormulaBar: true,
          }}
        />
      </div>
    </div>
  );
}
