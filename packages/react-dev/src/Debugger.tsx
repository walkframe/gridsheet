import React, { useEffect, useState } from 'react';
import type { HubType } from '@gridsheet/react-core';
import { p2a } from '@gridsheet/react-core';

export type DebuggerProps = {
  hub: HubType;
  intervalMs?: number;
};

export const Debugger: React.FC<DebuggerProps> = ({ hub, intervalMs = 500 }) => {
  const { wire } = hub;
  const [snapshot, setSnapshot] = useState<any>({});
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [topHeight, setTopHeight] = useState(200);
  const [bottomHeight, setBottomHeight] = useState(200);

  useEffect(() => {
    const updateSnapshot = () => {
      if (!wire) return;

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

  let activeCellData = null;
  let activeCellAddress = null;
  let activeCellId = null;
  let activeStoreData = null;
  let activeTableData = null;

  if (wire && activeTabId !== null) {
    const { contextsBySheetId } = wire;
    const context = contextsBySheetId[activeTabId];

    if (context) {
      activeStoreData = context.store;

      const table = context.store.tableReactive.current;
      if (table) {
        activeTableData = table;

        const rawTable = (table as any).__raw__ || table;
        const idMatrix = rawTable.idMatrix;
        const choosing = context.store.choosing;
        const topHeaderSelecting = context.store.topHeaderSelecting;
        const leftHeaderSelecting = context.store.leftHeaderSelecting;

        if (choosing && idMatrix) {
          let targetY = choosing.y;
          let targetX = choosing.x;

          if (topHeaderSelecting) {
            targetY = 0;
          } else if (leftHeaderSelecting) {
            targetX = 0;
          }

          if (idMatrix[targetY]) {
            const id = idMatrix[targetY][targetX];
            if (id) {
              activeCellData = wire.data[id];
              activeCellAddress = p2a({ y: targetY, x: targetX });
              activeCellId = id;
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
      setTopHeight(Math.max(100, startHeight + moveEvent.clientY - startY));
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
      setBottomHeight(Math.max(100, startHeight + moveEvent.clientY - startY));
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
      <div style={{ display: 'flex', borderBottom: '1px solid #dee2e6', backgroundColor: '#f8f9fa' }}>
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

      <div style={{ display: 'flex', flexDirection: 'row', height: `${topHeight}px`, backgroundColor: '#fff', overflow: 'hidden' }}>
        <div style={{ flex: 1, borderRight: '1px solid #dee2e6', overflow: 'auto', position: 'relative' }}>
          <div style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1, padding: '8px 12px', fontWeight: 'bold', borderBottom: '2px solid #ccc' }}>
            Table Data
          </div>
          {activeTableData ? (
            <pre style={{ margin: 0, padding: '12px' }}>{JSON.stringify(activeTableData, jsonReplacer, 2)}</pre>
          ) : (
            <div style={{ fontStyle: 'italic', color: '#6c757d', padding: '12px' }}>Table instance not found</div>
          )}
        </div>

        <div style={{ flex: 1, borderRight: '1px solid #dee2e6', overflow: 'auto', backgroundColor: '#fdfdfe', position: 'relative' }}>
          <div style={{ position: 'sticky', top: 0, background: '#fdfdfe', zIndex: 1, padding: '8px 12px', fontWeight: 'bold', borderBottom: '2px solid #ccc' }}>
            Store Data
          </div>
          {activeStoreData ? (
            <pre style={{ margin: 0, padding: '12px' }}>{JSON.stringify(activeStoreData, jsonReplacer, 2)}</pre>
          ) : (
            <div style={{ fontStyle: 'italic', color: '#6c757d', padding: '12px' }}>Store state not found</div>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#eef2f5', position: 'relative' }}>
          <div style={{ position: 'sticky', top: 0, background: '#eef2f5', zIndex: 1, padding: '8px 12px', fontWeight: 'bold', borderBottom: '2px solid #ccc' }}>
            Current Cell Data: {activeCellAddress && `${activeCellAddress}`} {activeCellId && `(ID: ${activeCellId})`}
          </div>
          {activeCellData ? (
            <pre style={{ margin: 0, padding: '12px' }}>{JSON.stringify(activeCellData, null, 2)}</pre>
          ) : (
            <div style={{ fontStyle: 'italic', color: '#6c757d', padding: '12px' }}>
              {wire?.choosingSheetId !== activeTabId && wire?.editingSheetId !== activeTabId
                ? 'Select a cell in this sheet to see data'
                : 'Selected cell has no data'}
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

      {/* Wire State now at the bottom */}
      <div style={{ backgroundColor: '#fafafa', overflow: 'auto', height: `${bottomHeight}px`, position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, background: '#fafafa', zIndex: 1, padding: '8px 12px', fontWeight: 'bold', borderBottom: '2px solid #ccc' }}>
          Wire State
        </div>
        <pre style={{ margin: 0, padding: '12px' }}>{JSON.stringify(snapshot, jsonReplacer, 2)}</pre>
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
