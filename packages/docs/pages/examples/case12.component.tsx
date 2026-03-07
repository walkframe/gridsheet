'use client';

import * as React from 'react';
import { GridSheet, buildInitialCells, useHub } from '@gridsheet/react-core';
import { Debugger } from '@gridsheet/react-dev';

export default function DebuggerExample() {
  const hub = useHub();
  const [sheetName, setSheetName] = React.useState('Data Sheet');
  const [sheetName2, setSheetName2] = React.useState('Summary Sheet');

  return (
    <div
      className="App"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        margin: '0 auto',
        padding: '20px',
        maxWidth: 'calc(100vw - 40px)',
        minWidth: '320px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h3
            style={{
              color: '#2c3e50',
              margin: '0 0 15px 0',
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            🐛 Target GridSheet 1
          </h3>
          <GridSheet
            hub={hub}
            sheetName={sheetName}
            options={{
              sheetResize: 'both',
            }}
            initialCells={buildInitialCells({
              cells: {
                A1: { value: 'Region A Sales' },
                B1: { value: 8000 },
                A2: { value: 'Region B Sales' },
                B2: { value: 4000 },
              },
              ensured: { numRows: 10, numCols: 5 },
            })}
          />
          <div style={{ marginTop: '10px' }}>
            <label
              style={{
                fontSize: '14px',
                color: '#7f8c8d',
                fontWeight: '500',
              }}
            >
              Rename sheet dynamically:
            </label>
            <input
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              style={{
                marginLeft: '8px',
                padding: '4px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h3
            style={{
              color: '#2c3e50',
              margin: '0 0 15px 0',
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            🐛 Target GridSheet 2 (Dark)
          </h3>
          <GridSheet
            hub={hub}
            sheetName={sheetName2}
            options={{
              sheetResize: 'both',
              mode: 'dark',
            }}
            initialCells={buildInitialCells({
              cells: {
                A1: { value: 'Global Revenue' },
                B1: { value: "='Data Sheet'!B1+'Data Sheet'!B2" },
                A2: { value: 'Global Expenses' },
                B2: { value: 4500 },
                A3: { value: 'Net Profit' },
                B3: { value: '=B1-B2' },
              },
              ensured: { numRows: 10, numCols: 5 },
            })}
          />
          <div style={{ marginTop: '10px' }}>
            <label
              style={{
                fontSize: '14px',
                color: '#7f8c8d',
                fontWeight: '500',
              }}
            >
              Rename sheet dynamically:
            </label>
            <input
              value={sheetName2}
              onChange={(e) => setSheetName2(e.target.value)}
              style={{
                marginLeft: '8px',
                padding: '4px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>
        </div>
      </div>

      <Debugger hub={hub} />
    </div>
  );
}
