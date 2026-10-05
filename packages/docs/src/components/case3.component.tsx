'use client';

import * as React from 'react';
import { GridSheet, buildInitialCells, useSheetRef, useStoreRef, clip, p2a } from '@gridsheet/react-core';
import type { CellsByAddressType } from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/react-core/spellbook';
import { useStarlightMode } from './useStarlightMode';

// Color palette
const COLORS = [
  '#FF0000',
  '#FF4500',
  '#FFA500',
  '#FFFF00',
  '#32CD32',
  '#00FF00',
  '#00FFFF',
  '#0000FF',
  '#8A2BE2',
  '#FF00FF',
  '#FF69B4',
  '#FFC0CB',
  '#FFFFFF',
  '#C0C0C0',
  '#808080',
  '#000000',
  '#8B4513',
  '#A0522D',
  '#CD853F',
  '#F4A460',
];

// Initial pixel art: one string per row, starting at A3.
// 'R' = red outline, 'p' = pink fill, '.' = empty.
const HEART = [
  '..RR.........RR..',
  '.RppR.......RppR.',
  'RppppR.....RppppR',
  'RpppppR...RpppppR',
  'RppppppR.RppppppR',
  'RpppppppRpppppppR',
  '.RpppppppppppppR.',
  '..RpppppppppppR..',
  '...RpppppppppR...',
  '....RpppppppR....',
  '.....RpppppR.....',
  '......RpppR......',
  '.......RpR.......',
  '........R........',
];
const PIXEL_COLORS: { [ch: string]: string } = { R: 'red', p: 'pink' };

// address -> color, e.g. { C3: 'red', B4: 'red', C4: 'pink', ... }
type ColorMap = { [address: string]: string };

const heartColors: ColorMap = {};
HEART.forEach((line, i) => {
  [...line].forEach((ch, j) => {
    if (PIXEL_COLORS[ch]) {
      heartColors[p2a({ y: i + 3, x: j + 1 })] = PIXEL_COLORS[ch];
    }
  });
});

const toCells = (colors: ColorMap): CellsByAddressType =>
  Object.fromEntries(
    Object.entries(colors).map(([address, color]) => [address, { style: { backgroundColor: color } }]),
  );

const GRID_SIZE = 50;
const STORAGE_KEY = 'demo3';

const initialCells = buildInitialCells({
  cells: {
    defaultRow: { height: 25 },
    defaultCol: { width: 25 },
    ...toCells(heartColors),
  },
  ensured: {
    numRows: GRID_SIZE,
    numCols: GRID_SIZE,
  },
});

export default function PixelArt() {
  const inheritMode = useStarlightMode();
  const sheetRef = useSheetRef();
  const storeRef = useStoreRef();
  const [selectedColor, setSelectedColor] = React.useState('#FF0000');

  // Repaint the whole canvas: cells in `colors` get that color, every other cell is cleared.
  const paint = React.useCallback((colors: ColorMap, historicize = true) => {
    if (!sheetRef.current) {
      return;
    }
    const { sheet, apply } = sheetRef.current;
    const diff: CellsByAddressType = {};
    for (let y = 1; y <= GRID_SIZE; y++) {
      for (let x = 1; x <= GRID_SIZE; x++) {
        const address = p2a({ y, x });
        diff[address] = { style: colors[address] ? { backgroundColor: colors[address] } : {} };
      }
    }
    apply(sheet.update({ diff, historicize }));
  }, []);

  const saveData = React.useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      if (sheetRef.current) {
        const { sheet } = sheetRef.current;

        // Extract only cells with colors
        const coloredCells: ColorMap = {};
        for (let row = sheet.top; row <= sheet.bottom; row++) {
          for (let col = sheet.left; col <= sheet.right; col++) {
            const cell = sheet.getCell({ y: row, x: col });
            if (cell?.style?.backgroundColor) {
              coloredCells[p2a({ y: row, x: col })] = cell.style.backgroundColor;
            }
          }
        }

        const dataToSave = {
          cells: coloredCells,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, []);

  const book = useSpellbook({
    onChange: saveData,
  });

  // Restore a saved drawing once, after mount (the server render always shows the heart).
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const cells: ColorMap | undefined = saved ? JSON.parse(saved).cells : undefined;
      if (cells) {
        paint(cells, false);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, [paint]);

  // Reset to the initial heart in place (undoable with Ctrl/Cmd+Z); onChange re-saves it.
  const resetData = () => {
    paint(heartColors);
  };

  // Function to fill selected cells
  const fillSelectedCells = () => {
    if (!sheetRef.current || !storeRef.current) {
      return;
    }

    const { sheet, apply } = sheetRef.current;
    const { store } = storeRef.current;

    // Get current selection area
    const area = clip(store);
    if (!area) {
      return;
    }

    const diff: any = {};

    // Fill all cells in the selection area
    for (let row = area.top; row <= area.bottom; row++) {
      for (let col = area.left; col <= area.right; col++) {
        const cellAddress = p2a({ y: row, x: col });
        diff[cellAddress] = {
          style: { backgroundColor: selectedColor },
        };
      }
    }

    apply(sheet.update({ diff }));
  };

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: 'calc(100vw - 40px)',
        minWidth: '320px',
        margin: '0 auto',
      }}
    >
      {/* Color palette */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: '8px',
            maxWidth: '400px',
            marginBottom: '10px',
          }}
        >
          {COLORS.map((color, index) => (
            <button
              key={index}
              onClick={() => setSelectedColor(color)}
              style={{
                width: '30px',
                height: '30px',
                backgroundColor: color,
                border: selectedColor === color ? '3px solid #333' : '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              title={color}
            />
          ))}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <span>Selected Color: </span>
          <span
            style={{
              display: 'inline-block',
              width: '20px',
              height: '20px',
              backgroundColor: selectedColor,
              border: '1px solid #ccc',
              verticalAlign: 'middle',
              marginLeft: '5px',
            }}
          ></span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fillSelectedCells}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Fill Selected Cells
          </button>
          <button
            onClick={resetData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            🔄 Reset
          </button>
        </div>
      </div>

      <GridSheet
        sheetRef={sheetRef}
        storeRef={storeRef}
        book={book}
        initialCells={initialCells}
        options={{
          matrixAlignment: 'both',
          sheetResize: 'both',
          showFormulaBar: false,
          // Size the sheet itself (not a style on its root): a root-only width fought the
          // sheet's own content-based width, so the box came out 500 or 1000px at random.
          sheetWidth: 500,
          sheetHeight: 500,
          mode: inheritMode,
        }}
      />
    </div>
  );
}
