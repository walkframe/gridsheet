import React, { useEffect, useState } from 'react';
import type { BookType } from '@gridsheet/core';
import { a2p, x2c, Lexer, FormulaParser, Sheet } from '@gridsheet/core';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';
import jsonLang from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import atomOneLight from 'react-syntax-highlighter/dist/esm/styles/hljs/atom-one-light';
import tomorrowNight from 'react-syntax-highlighter/dist/esm/styles/hljs/tomorrow-night';
import solarizedDark from 'react-syntax-highlighter/dist/esm/styles/hljs/solarized-dark';
import solarizedLight from 'react-syntax-highlighter/dist/esm/styles/hljs/solarized-light';
import docco from 'react-syntax-highlighter/dist/esm/styles/hljs/docco';
import atelierSeasideLight from 'react-syntax-highlighter/dist/esm/styles/hljs/atelier-seaside-light';
import atelierHeathLight from 'react-syntax-highlighter/dist/esm/styles/hljs/atelier-heath-light';

SyntaxHighlighter.registerLanguage('json', jsonLang);

const ss = {
  get: (key: string) => (typeof window !== 'undefined' ? sessionStorage.getItem(key) : null),
  set: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(key, value);
    }
  },
};

type HljsStyle = SyntaxHighlighterProps['style'];

const JsonCode: React.FC<{ data: any; replacer?: (k: string, v: any) => any; theme: HljsStyle }> = ({
  data,
  replacer,
  theme,
}) => {
  const code = JSON.stringify(data, replacer, 2) ?? '';
  return (
    <SyntaxHighlighter
      language="json"
      style={theme}
      showLineNumbers
      customStyle={{ margin: 0, fontSize: '10px', minHeight: '100%', borderRadius: 0, whiteSpace: 'pre' }}
      codeTagProps={{ style: { display: 'block', whiteSpace: 'pre', fontSize: '10px' } }}
    >
      {code}
    </SyntaxHighlighter>
  );
};

export type DebuggerProps = {
  book: BookType;
  intervalMs?: number;
};

export const Debugger: React.FC<DebuggerProps> = ({ book, intervalMs = 500 }) => {
  const { registry } = book;
  const [snapshot, setSnapshot] = useState<any>({});
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [topHeight, setTopHeight] = useState<number>(200);
  const [bottomHeight, setBottomHeight] = useState<number>(200);
  const [formulaView, setFormulaView] = useState<'expressions' | 'tokens'>('expressions');

  useEffect(() => {
    const savedTop = ss.get('gs-debugger-top-height');
    if (savedTop) {
      setTopHeight(Number(savedTop));
    }
    const savedBottom = ss.get('gs-debugger-bottom-height');
    if (savedBottom) {
      setBottomHeight(Number(savedBottom));
    }
    const savedFormula = ss.get('gs-debugger-formula-view') as 'expressions' | 'tokens';
    if (savedFormula) {
      setFormulaView(savedFormula);
    }
  }, []);

  useEffect(() => {
    const updateSnapshot = () => {
      if (!registry) {
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
      } = registry;

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
  }, [registry, intervalMs]);

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

  // Cell data for the currently selected cell (registry.choosingSheetId / choosingAddress)
  let registryCellData = null;
  let registrySystemData = null;
  let registryCellAddress = registry?.choosingAddress || '';
  let registryCellSheetName = '';
  let registryFormulaExpr = null;
  let registryFormulaTokens = null;

  if (registry && activeTabId !== null) {
    const { contextsBySheetId } = registry;
    const context = contextsBySheetId[activeTabId];

    if (context) {
      activeStoreData = context.store;

      const sheet = context.store.sheetReactive.current;
      if (sheet) {
        activeTableData = sheet;
      }
    }
  }

  // Resolve cell data for the currently selected cell (registry.choosingSheetId / choosingAddress)
  if (registry && registry.choosingSheetId != null) {
    const { contextsBySheetId } = registry;
    const choosingContext = contextsBySheetId[registry.choosingSheetId];

    // Resolve sheet name
    if (registry.sheetIdsByName) {
      const entry = Object.entries(registry.sheetIdsByName).find(([, id]) => id === registry.choosingSheetId);
      if (entry) {
        registryCellSheetName = entry[0];
      }
    }

    if (choosingContext) {
      const sheet = choosingContext.store.sheetReactive.current;
      const store = choosingContext.store;
      if (sheet) {
        const rawTable = (sheet as any).__raw__ || sheet;
        const idMatrix = rawTable.idMatrix;

        // When a header cell is selected, use y=0 (top header) or x=0 (left header)
        const isTopHeaderSelecting = store.topHeaderSelecting;
        const isLeftHeaderSelecting = store.leftHeaderSelecting;
        const pos = isTopHeaderSelecting
          ? { y: 0, x: store.choosing.x }
          : isLeftHeaderSelecting
            ? { y: store.choosing.y, x: 0 }
            : a2p(registry.choosingAddress);

        if (isTopHeaderSelecting) {
          registryCellAddress = `header:${x2c(store.choosing.x)}`;
        } else if (isLeftHeaderSelecting) {
          registryCellAddress = `header:${store.choosing.y}`;
        }

        if (pos && idMatrix[pos.y]) {
          const id = idMatrix[pos.y][pos.x];
          if (id) {
            registryCellData = registry.data[id];
            registrySystemData = registry.systems[id] ?? null;

            // Parse formula
            const text = registryCellData?.value;
            if (typeof text === 'string' && text.startsWith('=')) {
              try {
                const lexer = new Lexer(text.substring(1));
                lexer.tokenize();
                registryFormulaTokens = lexer.tokens;
                const parser = new FormulaParser(lexer.tokens);
                registryFormulaExpr = parser.build();
              } catch (e) {
                registryFormulaExpr = { error: String(e) };
              }
            }
          }
        }
      }
    }
  }

  const baseReplacer = (key: string, value: any) => {
    // Avoid circular refs, noisy internals, and React RefObjects
    if (
      key === 'registry' ||
      key === '__raw__' ||
      (value && typeof value === 'object' && 'current' in value && Object.keys(value).length === 1) // heuristic to skip React ref objects
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

  // Replace nested Sheet instances with their string representation (for Registry State / Store Data panels)
  const jsonReplacer = (key: string, value: any) => {
    if (value instanceof Sheet) {
      return value.toString();
    }
    return baseReplacer(key, value);
  };

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = topHeight;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const h = Math.max(100, startHeight + moveEvent.clientY - startY);
      setTopHeight(h);
      ss.set('gs-debugger-top-height', String(h));
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
      ss.set('gs-debugger-bottom-height', String(h));
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
      {/* Top pane: Registry State | Cell | System | Formula */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: `${topHeight}px`,
          overflow: 'hidden',
        }}
      >
        {/* Registry State panel */}
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
            Registry State
          </div>
          <JsonCode data={snapshot} replacer={jsonReplacer} theme={atomOneLight} />
        </div>

        {/* Registry Cell Value: cell data for registry.choosingSheetId / choosingAddress */}
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
            Cell: {registryCellSheetName && `'${registryCellSheetName}'!`}
            {registryCellAddress}
          </div>
          {registryCellData ? (
            <JsonCode data={registryCellData} replacer={baseReplacer} theme={atelierSeasideLight} />
          ) : (
            <div style={{ fontStyle: 'italic', color: '#6c757d', padding: '12px' }}>No cell data</div>
          )}
        </div>

        {/* System: systems[id] for the choosing cell */}
        <div
          style={{
            flex: 1,
            borderRight: '1px solid #dee2e6',
            overflow: 'auto',
            backgroundColor: '#fdf0f2',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              background: '#fdf0f2',
              zIndex: 1,
              padding: '8px 12px',
              fontWeight: 'bold',
              borderBottom: '2px solid #ccc',
            }}
          >
            System: {registryCellSheetName && `'${registryCellSheetName}'!`}
            {registryCellAddress}
          </div>
          {registrySystemData ? (
            <JsonCode data={registrySystemData} replacer={baseReplacer} theme={atelierHeathLight} />
          ) : (
            <div style={{ fontStyle: 'italic', color: '#6c757d', padding: '12px' }}>No system data</div>
          )}
        </div>

        {/* Formula: toggling between Expressions and Tokens */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: formulaView === 'expressions' ? '#fffbf0' : '#f5f0ff',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              background: formulaView === 'expressions' ? '#fffbf0' : '#f5f0ff',
              zIndex: 1,
              padding: '6px 12px',
              fontWeight: 'bold',
              borderBottom: '2px solid #ccc',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{formulaView === 'expressions' ? 'Formula Expressions' : 'Formula Tokens'}</span>
            <button
              onClick={() => {
                const next = formulaView === 'expressions' ? 'tokens' : 'expressions';
                setFormulaView(next);
                ss.set('gs-debugger-formula-view', next);
              }}
              style={{
                marginLeft: 'auto',
                fontSize: '11px',
                padding: '2px 8px',
                cursor: 'pointer',
                border: '1px solid #aaa',
                borderRadius: '4px',
                background: '#fff',
              }}
            >
              {formulaView === 'expressions' ? '→ Tokens' : '→ Expressions'}
            </button>
          </div>
          {registryCellData ? (
            <JsonCode
              data={formulaView === 'expressions' ? registryFormulaExpr : registryFormulaTokens}
              replacer={baseReplacer}
              theme={formulaView === 'expressions' ? solarizedLight : docco}
            />
          ) : (
            <div style={{ fontStyle: 'italic', color: '#6c757d', padding: '12px' }}>No cell selected</div>
          )}
        </div>
      </div>

      {/* Resizer for top pane */}
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

      {/* Sheet tabs */}
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

      {/* Bottom pane: Sheet Data | Store Data */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: `${bottomHeight}px`,
          backgroundColor: '#282c34',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            flex: 1,
            borderRight: '1px solid #3a3a3a',
            overflow: 'auto',
            position: 'relative',
            backgroundColor: '#282c34',
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              background: '#21252b',
              zIndex: 1,
              padding: '8px 12px',
              fontWeight: 'bold',
              borderBottom: '2px solid #3a3a3a',
              color: '#abb2bf',
            }}
          >
            Sheet Data
          </div>
          {activeTableData ? (
            <JsonCode data={activeTableData} replacer={baseReplacer} theme={tomorrowNight} />
          ) : (
            <div style={{ fontStyle: 'italic', color: '#6c757d', padding: '12px' }}>Sheet instance not found</div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: '#282c34',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              background: '#21252b',
              zIndex: 1,
              padding: '8px 12px',
              fontWeight: 'bold',
              borderBottom: '2px solid #3a3a3a',
              color: '#abb2bf',
            }}
          >
            Store Data
          </div>
          {activeStoreData ? (
            <JsonCode data={activeStoreData} replacer={jsonReplacer} theme={solarizedDark} />
          ) : (
            <div style={{ fontStyle: 'italic', color: '#6c757d', padding: '12px' }}>Store state not found</div>
          )}
        </div>
      </div>

      {/* Resizer for bottom pane */}
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
