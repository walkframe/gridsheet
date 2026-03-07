import React, { useEffect, useState } from 'react';
import type { HubType } from '@gridsheet/react-core';
import { a2p, x2c, Lexer, FormulaParser } from '@gridsheet/react-core';

export type DebuggerProps = {
  hub: HubType;
  intervalMs?: number;
};

export const Debugger: React.FC<DebuggerProps> = ({ hub, intervalMs = 500 }) => {
  const { wire } = hub;
  const [snapshot, setSnapshot] = useState<any>({});
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [topHeight, setTopHeight] = useState<number>(() => {
    const saved = sessionStorage.getItem('debugger_top_height');
    return saved ? Number(saved) : 200;
  });
  const [bottomHeight, setBottomHeight] = useState<number>(() => {
    const saved = sessionStorage.getItem('debugger_bottom_height');
    return saved ? Number(saved) : 200;
  });

  useEffect(() => {
    const updateSnapshot = () => {
      if (!wire) {
        return;
      }

      const {
        choosingAddress,
        choosingSheetId,
        editingAddress,
        editingSheetId,
        ready,
        sheetIdsByName,
        sheetHead,
        cellHead,
        paletteBySheetName,
        solvedCaches,
        copyingSheetId,
        copyingZone,
        cutting,
        historyIndex,
        historyLimit,
        histories,
        asyncPending,
        asyncInflight,
      } = wire;

      setSnapshot({
        asyncPending,
        asyncInflight,
        ready,
        sheetIdsByName,
        sheetHead,
        cellHead,
        paletteBySheetName,
        solvedCaches,
        choosingAddress,
        choosingSheetId,
        editingAddress,
        editingSheetId,
        copyingSheetId,
        copyingZone,
        cutting,
        historyIndex,
        historyLimit,
        histories,
      });
    };

    updateSnapshot();

    const intervalId = setInterval(updateSnapshot, intervalMs);
    return () => clearInterval(intervalId);
  }, [wire, intervalMs]);

  const sheets = snapshot.sheetIdsByName
    ? Object.entries(snapshot.sheetIdsByName)
        .map(([name, id]) => ({ id: id as number, name }))
        .sort((a, b) => a.id - b.id)
    : [];

  useEffect(() => {
    if (activeTabId === null && sheets.length > 0) {
      setActiveTabId(sheets[0].id);
    }
  }, [sheets.length, activeTabId]);

  let activeStoreData = null;
  let activeTableData = null;

  // Cell data for wire.choosingSheetId / choosingAddress
  let wireCellData = null;
  let wireCellAddress = wire?.choosingAddress || '';
  let wireCellSheetName = '';
  let wireFormulaExpr = null;
  let wireFormulaTokens = null;

  if (wire && activeTabId !== null) {
    const { contextsBySheetId } = wire;
    const context = contextsBySheetId[activeTabId];

    if (context) {
      activeStoreData = context.store;

      const table = context.store.tableReactive.current;
      if (table) {
        activeTableData = table;
      }
    }
  }

  // Resolve cell data for wire.choosingSheetId / choosingAddress
  if (wire && wire.choosingSheetId != null) {
    const { contextsBySheetId } = wire;
    const choosingContext = contextsBySheetId[wire.choosingSheetId];

    // Resolve sheet name
    if (wire.sheetIdsByName) {
      const entry = Object.entries(wire.sheetIdsByName).find(([, id]) => id === wire.choosingSheetId);
      if (entry) {
        wireCellSheetName = entry[0];
      }
    }

    if (choosingContext) {
      const table = choosingContext.store.tableReactive.current;
      const store = choosingContext.store;
      if (table) {
        const rawTable = (table as any).__raw__ || table;
        const idMatrix = rawTable.idMatrix;

        // When a header is selected, refer to y=0 (top) or x=0 (left) header cell
        const isTopHeaderSelecting = store.topHeaderSelecting;
        const isLeftHeaderSelecting = store.leftHeaderSelecting;
        const pos = isTopHeaderSelecting
          ? { y: 0, x: store.choosing.x }
          : isLeftHeaderSelecting
            ? { y: store.choosing.y, x: 0 }
            : a2p(wire.choosingAddress);

        if (isTopHeaderSelecting) {
          wireCellAddress = `header:${x2c(store.choosing.x)}`;
        } else if (isLeftHeaderSelecting) {
          wireCellAddress = `header:${store.choosing.y}`;
        }

        if (pos && idMatrix[pos.y]) {
          const id = idMatrix[pos.y][pos.x];
          if (id) {
            wireCellData = wire.data[id];

            // Parse formula
            const text = wireCellData?.value;
            if (typeof text === 'string' && text.startsWith('=')) {
              try {
                const lexer = new Lexer(text.substring(1));
                lexer.tokenize();
                wireFormulaTokens = lexer.tokens;
                const parser = new FormulaParser(lexer.tokens);
                wireFormulaExpr = parser.build();
              } catch (e) {
                wireFormulaExpr = { error: String(e) };
              }
            }
          }
        }
      }
    }
  }

  const jsonReplacer = (key: string, value: any) => {
    // Avoid circular refs, noise, and React RefObjects
    if (
      key === 'wire' ||
      key === '__raw__' ||
      (value && typeof value === 'object' && 'current' in value && Object.keys(value).length === 1) // basic heuristic to skip ref objects
    ) {
      return undefined;
    }
    if (value instanceof Map) {
      return Object.fromEntries(value.entries());
    }
    if (value instanceof Set) {
      return Array.from(value);
    }
    return value;
  };

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = topHeight;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const h = Math.max(100, startHeight + moveEvent.clientY - startY);
      setTopHeight(h);
      sessionStorage.setItem('debugger_top_height', String(h));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const startDragBottom = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = bottomHeight;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const h = Math.max(100, startHeight + moveEvent.clientY - startY);
      setBottomHeight(h);
      sessionStorage.setItem('debugger_bottom_height', String(h));
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#212529',
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        overflow: 'hidden',
      }}
    >
      {/* 上段: Wire State | Wire Cell | Formula Expressions | Formula Tokens */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: `${topHeight}px`,
          overflow: 'hidden',
        }}
      >
        {/* Wire State */}
        <div
          style={{
            flex: 1,
            borderRight: '1px solid #dee2e6',
            backgroundColor: '#fafafa',
            overflow: 'auto',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              background: '#fafafa',
              zIndex: 1,
              padding: '8px 12px',
              fontWeight: 'bold',
              borderBottom: '2px solid #ccc',
            }}
          >
            Wire State
          </div>
          <pre style={{ margin: 0, padding: '12px' }}>{JSON.stringify(snapshot, jsonReplacer, 2)}</pre>
        </div>

        {/* Wire Cell Value: wire.choosingSheetId / choosingAddress のセルデータ */}
        <div
          style={{
            flex: 1,
            borderRight: '1px solid #dee2e6',
            overflow: 'auto',
            backgroundColor: '#f0f8f0',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              background: '#f0f8f0',
              zIndex: 1,
              padding: '8px 12px',
              fontWeight: 'bold',
              borderBottom: '2px solid #ccc',
            }}
          >
            Cell: {wireCellSheetName && `${wireCellSheetName}!`}
            {wireCellAddress} {wire?.choosingSheetId != null && `(SheetID: ${wire.choosingSheetId})`}
          </div>
          {wireCellData ? (
            <pre style={{ margin: 0, padding: '12px' }}>{JSON.stringify(wireCellData, null, 2)}</pre>
          ) : (
            <div style={{ fontStyle: 'italic', color: '#6c757d', padding: '12px' }}>No cell data</div>
          )}
        </div>

        {/* Formula Expressions */}
        <div
          style={{
            flex: 1,
            borderRight: '1px solid #dee2e6',
            overflow: 'auto',
            backgroundColor: '#fffbf0',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              background: '#fffbf0',
              zIndex: 1,
              padding: '8px 12px',
              fontWeight: 'bold',
              borderBottom: '2px solid #ccc',
            }}
          >
            Formula Expressions
          </div>
          {wireFormulaExpr ? (
            <pre style={{ margin: 0, padding: '12px' }}>{JSON.stringify(wireFormulaExpr, null, 2)}</pre>
          ) : (
            <div style={{ fontStyle: 'italic', color: '#6c757d', padding: '12px' }}>
              {wireCellData ? 'Not a formula' : 'No cell selected'}
            </div>
          )}
        </div>

        {/* Formula Tokens: lexer.tokens */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#f5f0ff', position: 'relative' }}>
          <div
            style={{
              position: 'sticky',
              top: 0,
              background: '#f5f0ff',
              zIndex: 1,
              padding: '8px 12px',
              fontWeight: 'bold',
              borderBottom: '2px solid #ccc',
            }}
          >
            Formula Tokens
          </div>
          {wireFormulaTokens ? (
            <pre style={{ margin: 0, padding: '12px' }}>{JSON.stringify(wireFormulaTokens, null, 2)}</pre>
          ) : (
            <div style={{ fontStyle: 'italic', color: '#6c757d', padding: '12px' }}>
              {wireCellData ? 'Not a formula' : 'No cell selected'}
            </div>
          )}
        </div>
      </div>

      {/* Resizer for Top Pane */}
      <div
        onMouseDown={startDrag}
        style={{
          height: '6px',
          backgroundColor: '#dee2e6',
          cursor: 'row-resize',
          transition: 'background-color 0.2s',
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#adb5bd';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#dee2e6';
        }}
      />

      {/* Sheet Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #dee2e6',
          borderTop: '1px solid #dee2e6',
          backgroundColor: '#f8f9fa',
        }}
      >
        {sheets.map((sheet) => (
          <div
            key={sheet.id}
            onClick={() => setActiveTabId(sheet.id)}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: 'bold',
              borderBottom: activeTabId === sheet.id ? '2px solid #0d6efd' : '2px solid transparent',
              color: activeTabId === sheet.id ? '#0d6efd' : '#495057',
            }}
          >
            {sheet.name} (ID: {sheet.id})
          </div>
        ))}
        {sheets.length === 0 && <div style={{ padding: '8px 16px', color: '#6c757d' }}>No sheets detected</div>}
      </div>

      {/* 下段: Table Data | Store Data */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: `${bottomHeight}px`,
          backgroundColor: '#fff',
          overflow: 'hidden',
        }}
      >
        <div style={{ flex: 1, borderRight: '1px solid #dee2e6', overflow: 'auto', position: 'relative' }}>
          <div
            style={{
              position: 'sticky',
              top: 0,
              background: '#fff',
              zIndex: 1,
              padding: '8px 12px',
              fontWeight: 'bold',
              borderBottom: '2px solid #ccc',
            }}
          >
            Table Data
          </div>
          {activeTableData ? (
            <pre style={{ margin: 0, padding: '12px' }}>{JSON.stringify(activeTableData, jsonReplacer, 2)}</pre>
          ) : (
            <div style={{ fontStyle: 'italic', color: '#6c757d', padding: '12px' }}>Table instance not found</div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: '#fdfdfe',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              background: '#fdfdfe',
              zIndex: 1,
              padding: '8px 12px',
              fontWeight: 'bold',
              borderBottom: '2px solid #ccc',
            }}
          >
            Store Data
          </div>
          {activeStoreData ? (
            <pre style={{ margin: 0, padding: '12px' }}>{JSON.stringify(activeStoreData, jsonReplacer, 2)}</pre>
          ) : (
            <div style={{ fontStyle: 'italic', color: '#6c757d', padding: '12px' }}>Store state not found</div>
          )}
        </div>
      </div>

      {/* Resizer for Bottom Pane */}
      <div
        onMouseDown={startDragBottom}
        style={{
          height: '6px',
          backgroundColor: '#dee2e6',
          cursor: 'row-resize',
          transition: 'background-color 0.2s',
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#adb5bd';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#dee2e6';
        }}
      />
    </div>
  );
};
