'use client';

import * as React from 'react';
import { GridSheet, buildInitialCells } from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/react-core/spellbook';
import { useStarlightMode } from './useStarlightMode';

const NUM_ROWS = 500000;
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
  const inheritMode = useStarlightMode();
  const isDark = inheritMode === 'inherit-dark';
  const outerRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [ready, setReady] = React.useState(false);

  const sheetHeight = 400;
  // Size the grid to its actual container, not to window.innerWidth. The docs content
  // column is much narrower than the window (the sidebar takes ~300px), so deriving the
  // width from the window made the 800px grid overflow the column. Because the outer box
  // centers the grid, that overflow was clipped equally on both sides — hiding the left
  // row-number header and the bottom horizontal scroll handle. Measuring the box keeps the
  // grid within it at every viewport width.
  const [availWidth, setAvailWidth] = React.useState<number | null>(null);
  React.useEffect(() => {
    const el = outerRef.current;
    if (!el) {
      return;
    }
    const measure = () => {
      const style = getComputedStyle(el);
      const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      setAvailWidth(el.clientWidth - padding);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const sheetWidth = availWidth != null ? Math.min(800, Math.max(320, availWidth)) : 800;

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
      ref={outerRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        maxWidth: 'calc(100vw - 40px)',
        margin: '0 auto',
        padding: '20px',
      }}
    >
      <div ref={containerRef} style={{ position: 'relative', width: sheetWidth }}>
        <GridSheet
          book={book}
          sheetName="large-dataset"
          initialCells={initialCells}
          options={{
            matrixAlignment: 'both',
            sheetHeight,
            sheetWidth,
            sheetResize: 'both',
            mode: inheritMode,
          }}
        />
        {!ready && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: isDark ? 'rgba(17, 19, 22, 0.8)' : 'rgba(255, 255, 255, 0.8)',
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
                border: `3px solid ${isDark ? '#2c2f34' : '#e0e0e0'}`,
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
        .gs-row-odd .gs-cell { background-color: ${isDark ? '#1b1e22' : '#ffffff'}; }
        .gs-row-even .gs-cell { background-color: ${isDark ? '#22262b' : '#f0f4f8'}; }
      `}</style>
    </div>
  );
}
