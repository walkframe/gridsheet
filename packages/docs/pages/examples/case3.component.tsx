'use client';

import * as React from 'react';
import {
  GridSheet,
  buildInitialCells,
  useConnector,
  useHub,
  updateTable,
  syncers,
  clip,
  p2a,
  CellsByAddressType,
} from '@gridsheet/react-core';

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

const myHeart: CellsByAddressType = {
  C3: { style: { backgroundColor: 'red' } },
  D3: { style: { backgroundColor: 'red' } },
  O3: { style: { backgroundColor: 'red' } },
  N3: { style: { backgroundColor: 'red' } },

  B4: { style: { backgroundColor: 'red' } },
  E4: { style: { backgroundColor: 'red' } },
  M4: { style: { backgroundColor: 'red' } },
  P4: { style: { backgroundColor: 'red' } },

  A5: { style: { backgroundColor: 'red' } },
  F5: { style: { backgroundColor: 'red' } },
  L5: { style: { backgroundColor: 'red' } },
  Q5: { style: { backgroundColor: 'red' } },

  A6: { style: { backgroundColor: 'red' } },
  G6: { style: { backgroundColor: 'red' } },
  K6: { style: { backgroundColor: 'red' } },
  Q6: { style: { backgroundColor: 'red' } },

  A7: { style: { backgroundColor: 'red' } },
  H7: { style: { backgroundColor: 'red' } },
  J7: { style: { backgroundColor: 'red' } },
  Q7: { style: { backgroundColor: 'red' } },

  A8: { style: { backgroundColor: 'red' } },
  I8: { style: { backgroundColor: 'red' } },
  Q8: { style: { backgroundColor: 'red' } },

  B9: { style: { backgroundColor: 'red' } },
  P9: { style: { backgroundColor: 'red' } },

  C10: { style: { backgroundColor: 'red' } },
  O10: { style: { backgroundColor: 'red' } },

  D11: { style: { backgroundColor: 'red' } },
  N11: { style: { backgroundColor: 'red' } },

  E12: { style: { backgroundColor: 'red' } },
  M12: { style: { backgroundColor: 'red' } },

  F13: { style: { backgroundColor: 'red' } },
  L13: { style: { backgroundColor: 'red' } },

  G14: { style: { backgroundColor: 'red' } },
  K14: { style: { backgroundColor: 'red' } },

  H15: { style: { backgroundColor: 'red' } },
  J15: { style: { backgroundColor: 'red' } },

  I16: { style: { backgroundColor: 'red' } },

  // B5 - B8
  B5: { style: { backgroundColor: 'pink' } },
  B6: { style: { backgroundColor: 'pink' } },
  B7: { style: { backgroundColor: 'pink' } },
  B8: { style: { backgroundColor: 'pink' } },

  // C4 - C9
  C4: { style: { backgroundColor: 'pink' } },
  C5: { style: { backgroundColor: 'pink' } },
  C6: { style: { backgroundColor: 'pink' } },
  C7: { style: { backgroundColor: 'pink' } },
  C8: { style: { backgroundColor: 'pink' } },
  C9: { style: { backgroundColor: 'pink' } },

  // D4 - D10
  D4: { style: { backgroundColor: 'pink' } },
  D5: { style: { backgroundColor: 'pink' } },
  D6: { style: { backgroundColor: 'pink' } },
  D7: { style: { backgroundColor: 'pink' } },
  D8: { style: { backgroundColor: 'pink' } },
  D9: { style: { backgroundColor: 'pink' } },
  D10: { style: { backgroundColor: 'pink' } },

  // E5 - E11
  E5: { style: { backgroundColor: 'pink' } },
  E6: { style: { backgroundColor: 'pink' } },
  E7: { style: { backgroundColor: 'pink' } },
  E8: { style: { backgroundColor: 'pink' } },
  E9: { style: { backgroundColor: 'pink' } },
  E10: { style: { backgroundColor: 'pink' } },
  E11: { style: { backgroundColor: 'pink' } },

  // F6 - F12
  F6: { style: { backgroundColor: 'pink' } },
  F7: { style: { backgroundColor: 'pink' } },
  F8: { style: { backgroundColor: 'pink' } },
  F9: { style: { backgroundColor: 'pink' } },
  F10: { style: { backgroundColor: 'pink' } },
  F11: { style: { backgroundColor: 'pink' } },
  F12: { style: { backgroundColor: 'pink' } },

  // G7 - G13
  G7: { style: { backgroundColor: 'pink' } },
  G8: { style: { backgroundColor: 'pink' } },
  G9: { style: { backgroundColor: 'pink' } },
  G10: { style: { backgroundColor: 'pink' } },
  G11: { style: { backgroundColor: 'pink' } },
  G12: { style: { backgroundColor: 'pink' } },
  G13: { style: { backgroundColor: 'pink' } },

  // H8 - H14
  H8: { style: { backgroundColor: 'pink' } },
  H9: { style: { backgroundColor: 'pink' } },
  H10: { style: { backgroundColor: 'pink' } },
  H11: { style: { backgroundColor: 'pink' } },
  H12: { style: { backgroundColor: 'pink' } },
  H13: { style: { backgroundColor: 'pink' } },
  H14: { style: { backgroundColor: 'pink' } },

  // I9 - I15
  I9: { style: { backgroundColor: 'pink' } },
  I10: { style: { backgroundColor: 'pink' } },
  I11: { style: { backgroundColor: 'pink' } },
  I12: { style: { backgroundColor: 'pink' } },
  I13: { style: { backgroundColor: 'pink' } },
  I14: { style: { backgroundColor: 'pink' } },
  I15: { style: { backgroundColor: 'pink' } },

  // J8 - J14
  J8: { style: { backgroundColor: 'pink' } },
  J9: { style: { backgroundColor: 'pink' } },
  J10: { style: { backgroundColor: 'pink' } },
  J11: { style: { backgroundColor: 'pink' } },
  J12: { style: { backgroundColor: 'pink' } },
  J13: { style: { backgroundColor: 'pink' } },
  J14: { style: { backgroundColor: 'pink' } },

  // K7 - K13
  K7: { style: { backgroundColor: 'pink' } },
  K8: { style: { backgroundColor: 'pink' } },
  K9: { style: { backgroundColor: 'pink' } },
  K10: { style: { backgroundColor: 'pink' } },
  K11: { style: { backgroundColor: 'pink' } },
  K12: { style: { backgroundColor: 'pink' } },
  K13: { style: { backgroundColor: 'pink' } },

  // L6 - L12
  L6: { style: { backgroundColor: 'pink' } },
  L7: { style: { backgroundColor: 'pink' } },
  L8: { style: { backgroundColor: 'pink' } },
  L9: { style: { backgroundColor: 'pink' } },
  L10: { style: { backgroundColor: 'pink' } },
  L11: { style: { backgroundColor: 'pink' } },
  L12: { style: { backgroundColor: 'pink' } },

  // M5 - M11
  M5: { style: { backgroundColor: 'pink' } },
  M6: { style: { backgroundColor: 'pink' } },
  M7: { style: { backgroundColor: 'pink' } },
  M8: { style: { backgroundColor: 'pink' } },
  M9: { style: { backgroundColor: 'pink' } },
  M10: { style: { backgroundColor: 'pink' } },
  M11: { style: { backgroundColor: 'pink' } },

  // N4 - N10
  N4: { style: { backgroundColor: 'pink' } },
  N5: { style: { backgroundColor: 'pink' } },
  N6: { style: { backgroundColor: 'pink' } },
  N7: { style: { backgroundColor: 'pink' } },
  N8: { style: { backgroundColor: 'pink' } },
  N9: { style: { backgroundColor: 'pink' } },
  N10: { style: { backgroundColor: 'pink' } },

  // O4 - O9
  O4: { style: { backgroundColor: 'pink' } },
  O5: { style: { backgroundColor: 'pink' } },
  O6: { style: { backgroundColor: 'pink' } },
  O7: { style: { backgroundColor: 'pink' } },
  O8: { style: { backgroundColor: 'pink' } },
  O9: { style: { backgroundColor: 'pink' } },

  // P5 - P8
  P5: { style: { backgroundColor: 'pink' } },
  P6: { style: { backgroundColor: 'pink' } },
  P7: { style: { backgroundColor: 'pink' } },
  P8: { style: { backgroundColor: 'pink' } },
};

export default function DataManagement() {
  const connector = useConnector();
  const [selectedColor, setSelectedColor] = React.useState('#FF0000');

  // Load data from localStorage
  const loadSavedData = React.useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const savedData = localStorage.getItem('demo3');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.cells && connector.current) {
          const { tableManager } = connector.current;
          const { table: table, sync } = tableManager;
          table.update({ diff: parsedData.cells });
          sync(table);
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  const saveData = React.useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      if (connector.current) {
        const { tableManager } = connector.current;
        const { table: table } = tableManager;
        const cells = table.getObject();

        // Extract only cells with colors
        const coloredCells: { [key: string]: string } = {};
        Object.keys(cells).forEach((address) => {
          const cell = cells[address];
          if (cell?.style?.backgroundColor) {
            coloredCells[address] = cell.style.backgroundColor;
          }
        });

        const dataToSave = {
          cells: coloredCells,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem('demo3', JSON.stringify(dataToSave));
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, []);

  const hub = useHub({
    onChange: saveData,
  });

  // Reset data
  const resetData = () => {
    if (typeof window === 'undefined') {
      return;
    }
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      localStorage.removeItem('demo3');
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  // Get saved data
  const getSavedData = () => {
    if (typeof window === 'undefined') {
      return myHeart;
    }
    try {
      const savedData = localStorage.getItem('demo3');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        const savedCells = parsedData.cells || {};

        // Convert saved color data to cell format
        const cellData: { [key: string]: any } = {};
        Object.keys(savedCells).forEach((address) => {
          cellData[address] = {
            style: { backgroundColor: savedCells[address] },
          };
        });

        console.log('Loaded saved data:', savedCells);
        return cellData;
      }
    } catch (error) {
      console.error('Error getting saved data:', error);
    }
    return myHeart;
  };

  // Load initial data
  React.useEffect(() => {
    loadSavedData();
  }, []);

  const initialCells = buildInitialCells({
    cells: {
      default: { width: 20, height: 20 },
      ...getSavedData(),
    },
    ensured: {
      numRows: 50,
      numCols: 50,
    },
  });

  // Function to fill selected cells
  const fillSelectedCells = () => {
    if (!connector.current) {
      return;
    }

    const { tableManager, storeManager } = connector.current;
    const { table: table, sync } = tableManager;
    const { store: store } = storeManager;

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

    table.update({ diff });
    sync(table);
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
        connector={connector}
        hub={hub}
        initialCells={initialCells}
        options={{
          sheetResize: 'both',
          showAddress: false,
          showFormulaBar: false,
        }}
        style={{
          width: typeof window !== 'undefined' ? Math.min(400, window.innerWidth - 60) : 400,
          height: typeof window !== 'undefined' ? Math.min(400, window.innerHeight - 200) : 400,
        }}
      />
    </div>
  );
}
