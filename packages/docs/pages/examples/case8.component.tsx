'use client';

import * as React from 'react';
import { GridSheet, buildInitialCells } from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/react-core/spellbook';

const NUM_ROWS = 200000;
const NUM_COLS = 10;

const generateHugeData = () => {
  const data: any[][] = [];
  for (let i = 1; i <= NUM_ROWS; i++) {
    data.push([
      i,
      `Row ${i}`,
      Math.floor(Math.random() * 10000),
      Math.floor(Math.random() * 10000),
      Math.floor(Math.random() * 10000),
      Math.floor(Math.random() * 10000),
      Math.floor(Math.random() * 10000),
      ['Alpha', 'Beta', 'Gamma', 'Delta'][Math.floor(Math.random() * 4)],
      ['Active', 'Inactive', 'Pending'][Math.floor(Math.random() * 3)],
      `Note ${i}`,
    ]);
  }
  return data;
};

export default function LargeDatasetDemo() {
  const book = useSpellbook();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [ready, setReady] = React.useState(false);

  const sheetHeight = 400;
  const sheetWidth = typeof window !== 'undefined' ? Math.min(800, window.innerWidth - 60) : 800;

  const initialCells = React.useMemo(
    () =>
      buildInitialCells({
        matrices: { A1: generateHugeData() },
        cells: {
          A0: { label: 'ID' },
          B0: { label: 'Name' },
          C0: { label: 'Value1' },
          D0: { label: 'Value2' },
          E0: { label: 'Value3' },
          F0: { label: 'Value4' },
          G0: { label: 'Value5' },
          H0: { label: 'Group' },
          I0: { label: 'Status' },
          J0: { label: 'Notes' },
        },
        ensured: { numRows: NUM_ROWS, numCols: NUM_COLS },
      }),
    [],
  );

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const observer = new MutationObserver(() => {
      if (el.querySelector('.gs-initialized')) {
        setReady(true);
        observer.disconnect();
      }
    });
    observer.observe(el, { attributes: true, subtree: true, attributeFilter: ['class'] });
    // Check immediately in case already initialized
    if (el.querySelector('.gs-initialized')) {
      setReady(true);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        maxWidth: 'calc(100vw - 40px)',
        minWidth: '320px',
        margin: '0 auto',
        padding: '20px',
      }}
    >
      <div ref={containerRef} style={{ position: 'relative', width: sheetWidth, height: sheetHeight }}>
        <GridSheet
          book={book}
          sheetName="large-dataset"
          initialCells={initialCells}
          options={{
            sheetHeight,
            sheetWidth,
            sheetResize: 'both',
          }}
        />
        {!ready && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                border: '3px solid #e0e0e0',
                borderTopColor: '#0077ff',
                borderRadius: '50%',
                animation: 'case8-spin 0.8s linear infinite',
              }}
            />
          </div>
        )}
      </div>
      <style>{`
        @keyframes case8-spin { to { transform: rotate(360deg); } }
        .gs-row-odd .gs-cell { background-color: #ffffff; }
        .gs-row-even .gs-cell { background-color: #f0f4f8; }
      `}</style>
    </div>
  );
}
