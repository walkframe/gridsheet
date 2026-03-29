import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, createSheetRef, GridSheet, updateSheet } from '@gridsheet/react-core';

import { useSpellbook } from '@gridsheet/react-core/spellbook';

const meta: Meta = {
  title: 'Basic/Header',
};
export default meta;

const DESCRIPTION = [
  'This demo showcases how to customize header height and width in GridSheet.',
  'It demonstrates dynamic header sizing with interactive controls.',
].join('\n\n');

const sheetRef = createSheetRef();

const HeaderSheet = () => {
  const [headerHeight, setHeaderHeight] = useState(40);
  const [headerWidth, setHeaderWidth] = useState(60);
  const book = useSpellbook();

  useEffect(() => {
    if (sheetRef.current) {
      const { sheet, apply } = sheetRef.current;
      apply(sheet.setHeaderHeight(headerHeight));
    }
  }, [headerHeight]);

  useEffect(() => {
    if (sheetRef.current) {
      const { sheet, apply } = sheetRef.current;
      apply(sheet.setHeaderWidth(headerWidth));
    }
  }, [headerWidth]);

  const handleSetHeaderHeight = () => {
    if (sheetRef.current) {
      const { sheet, apply } = sheetRef.current;
      apply(sheet.setHeaderHeight(60));
    }
  };

  const handleSetHeaderWidth = () => {
    if (sheetRef.current) {
      const { sheet, apply } = sheetRef.current;
      apply(sheet.setHeaderWidth(80));
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        Header height:{' '}
        <input
          name="header-height"
          type="number"
          step={10}
          value={headerHeight}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value) && value > 0) {
              setHeaderHeight(value);
            }
          }}
          style={{ width: '80px', marginRight: '20px' }}
        />
        <br />
        Header width:{' '}
        <input
          name="header-width"
          type="number"
          step={10}
          value={headerWidth}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value) && value > 0) {
              setHeaderWidth(value);
            }
          }}
          style={{ width: '80px' }}
        />
      </div>

      <GridSheet
        book={book}
        sheetRef={sheetRef}
        initialCells={buildInitialCells({
          matrices: {
            A1: [
              ['A1', 'B1', 'C1', 'D1', 'E1'],
              ['A2', 'B2', 'C2', 'D2', 'E2'],
              ['A3', 'B3', 'C3', 'D3', 'E3'],
              ['A4', 'B4', 'C4', 'D4', 'E4'],
              ['A5', 'B5', 'C5', 'D5', 'E5'],
            ],
          },
          cells: {
            // A column header only (y=0, x=A)
            A0: { style: { backgroundColor: 'rgb(255, 200, 200)' } },
            // Row 1 header only (y=1, x=0)
            '01': { style: { backgroundColor: 'rgb(200, 255, 200)' } },
            // All data cells in column A (A1, A2, ...)
            A: { style: { backgroundColor: 'rgb(200, 200, 255)' } },
            // All data cells in row 1 (A1, B1, ...)
            1: { style: { backgroundColor: 'rgb(255, 255, 180)' } },
            // All data cells in columns C, D, E
            'C:E': { style: { backgroundColor: 'rgb(220, 200, 255)' } },
            // Column headers F and G only
            'F0:G0': { style: { color: 'blue' } },
          },
          ensured: { numRows: 10, numCols: 8 },
        })}
        options={{}}
      />
    </div>
  );
};

export const Header: StoryObj = {
  render: () => <HeaderSheet />,
};
