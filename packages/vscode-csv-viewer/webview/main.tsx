import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { GridSheet, buildInitialCells, useBook, toValueMatrix, p2a, render, Pending, userActions, operations, type StoreHandle } from '@gridsheet/preact-core';

import { makeAiFunctions, type AiEnqueue } from './aiFunctions';
import type { AiBatchResponse, AiTask } from '../src/aiTypes';

declare function acquireVsCodeApi(): { postMessage(msg: unknown): void };

const vscodeApi = acquireVsCodeApi();

// ── AI batch bridge ────────────────────────────────────────────────────────
// Each =CLAUDE/=CODEX cell calls enqueueAi(); requests accumulate for one tick
// and flush as a single 'aiBatch' message. The host resolves them (grouped by
// provider+kind → few CLI calls) and replies with 'aiBatchResult', which settles
// each cell's Promise. The engine shows `gs-pending` until then.
type AiQueueItem = { task: Omit<AiTask, 'index'>; resolve: (v: unknown) => void; reject: (e: unknown) => void };
let aiQueue: AiQueueItem[] = [];
let aiFlushTimer: ReturnType<typeof setTimeout> | null = null;
let aiReqCounter = 0;
const aiPending = new Map<number, AiQueueItem[]>();

// Set by the Grid: re-serialize the sheet and persist resolved values to the file.
// Invoked ONLY when an AI batch resolves (not on every transmit — doing that per
// repaint jams drag-select), on the frame after resolution so the cache is filled.
let aiPersist: (() => void) | null = null;

const flushAi = () => {
  aiFlushTimer = null;
  const batch = aiQueue;
  aiQueue = [];
  if (batch.length === 0) {
    return;
  }
  const id = ++aiReqCounter;
  aiPending.set(id, batch);
  const tasks: AiTask[] = batch.map((item, index) => ({ index, ...item.task }));
  vscodeApi.postMessage({ type: 'aiBatch', id, tasks });
};

const enqueueAi: AiEnqueue = (provider, kind, prompt) =>
  new Promise<string | number | boolean>((resolve, reject) => {
    aiQueue.push({ task: { provider, kind, prompt }, resolve: resolve as (v: unknown) => void, reject });
    if (aiFlushTimer == null) {
      aiFlushTimer = setTimeout(flushAi, 60);
    }
  });

const handleAiResult = (msg: AiBatchResponse) => {
  const batch = aiPending.get(msg.id);
  if (!batch) {
    return;
  }
  aiPending.delete(msg.id);
  const settled = new Set<number>();
  for (const r of msg.results) {
    const item = batch[r.index];
    if (!item) {
      continue;
    }
    settled.add(r.index);
    if (r.ok) {
      item.resolve(r.value);
    } else {
      item.reject(new Error(r.error));
    }
  }
  batch.forEach((item, i) => {
    if (!settled.has(i)) {
      item.reject(new Error('No result returned for this cell.'));
    }
  });
  // Resolutions repaint via transmit but don't fire onChange, so persist here.
  // rAF waits out the engine's microtasks (setAsyncCache) so serialize reads values.
  requestAnimationFrame(() => aiPersist?.());
};

// ── Clipboard paste bridge ─────────────────────────────────────────────────
// VS Code webviews deliver an EMPTY clipboardData on native paste events, so
// GridSheet's onPaste (which reads e.clipboardData) receives nothing and paste
// looks broken — even though it works in a plain browser / Storybook. Bridge via
// the extension host: intercept Cmd/Ctrl+V while the grid is focused, fetch the
// text through vscode.env.clipboard, then replay it — as a synthetic paste event
// for grid paste, or inserted at the caret while editing a cell inline.
const gridStoreRef: { current: StoreHandle | null } = { current: null };
let pastePending = false;

document.addEventListener(
  'keydown',
  (e) => {
    if (!(e.metaKey || e.ctrlKey) || (e.key !== 'v' && e.key !== 'V')) {
      return;
    }
    const ta = gridStoreRef.current?.store?.editorRef?.current ?? null;
    if (!ta || document.activeElement !== ta) {
      return; // focus is outside the grid — leave other inputs' paste untouched
    }
    e.preventDefault();
    e.stopImmediatePropagation();
    pastePending = true;
    vscodeApi.postMessage({ type: 'requestPaste' });
  },
  true,
);

const applyPaste = (text: string) => {
  if (!pastePending) {
    return;
  }
  pastePending = false;
  const store = gridStoreRef.current?.store;
  const ta = store?.editorRef?.current;
  if (!store || !ta || !text) {
    return;
  }
  ta.focus();
  if (store.editingAddress) {
    document.execCommand('insertText', false, text); // inline edit → insert at caret
    return;
  }
  // Grid paste → replay through GridSheet's own onPaste with the text attached.
  const dt = new DataTransfer();
  dt.setData('text/plain', text);
  ta.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
};

type DataMessage = { type: 'data'; rows: string[][]; delimiter: 'CSV' | 'TSV'; readOnly?: boolean; evaluate?: boolean };

// View-only prevention mask. `operations.ViewOnly` (= ReadOnly | ColumnMenu) already
// covers content edits, structural changes, sort/filter, label changes and the column
// menu; it just omits RowMenu, so add it to also hide the row-header menu. Copy is not a
// prevention-enforced op, so it keeps working. (ViewOnly does block column resize.)
const READ_ONLY_PREVENTION = operations.ViewOnly | operations.RowMenu;

const delimiterChar = (d: 'CSV' | 'TSV') => (d === 'TSV' ? '\t' : ',');

// RFC-4180-ish field quoting (symmetric with src/parse.ts).
const quoteField = (v: string, delim: string) =>
  v.includes(delim) || v.includes('"') || v.includes('\n') || v.includes('\r') ? `"${v.replace(/"/g, '""')}"` : v;

// Serialize the current sheet back to CSV/TSV text. With `header` on, the column
// labels (row 0) become the first line, followed by the data rows. Trailing
// all-empty rows are dropped so "extra" capacity rows don't bloat the file.
const serialize = (sheet: any, header: boolean, delim: string, evaluate: boolean): string => {
  // evaluate=true writes formula results (e.g. =A1+B1 -> 30); false keeps the
  // formula source. Literal cells are identical either way.
  const matrix: any[][] = toValueMatrix(sheet, { resolution: evaluate ? 'RESOLVED' : 'RAW' });
  // A still-resolving async cell (=CLAUDE/=CODEX) reads back as a Pending sentinel;
  // writing its toString() would leak "<Pending #…>" into the file. Fall back to the
  // raw formula source for those cells until they resolve (their value is written on
  // the next serialize, once resolution has repainted the grid).
  const raw: any[][] | null = evaluate ? toValueMatrix(sheet, { resolution: 'RAW' }) : null;
  const cellText = (v: any, y: number, x: number): string => {
    if (raw != null && Pending.is(v)) {
      const r = raw[y]?.[x];
      return r == null ? '' : String(r);
    }
    return v == null ? '' : String(v);
  };
  const numCols = matrix.reduce((m, r) => Math.max(m, r.length), 0);
  const lines: string[] = [];
  if (header) {
    const hdr: string[] = [];
    for (let x = 1; x <= numCols; x++) {
      const label = sheet.getCell({ y: 0, x }, { resolution: 'SYSTEM' })?.label;
      hdr.push(quoteField(label == null ? '' : String(label), delim));
    }
    lines.push(hdr.join(delim));
  }
  matrix.forEach((row, y) => {
    lines.push(row.map((v, x) => quoteField(cellText(v, y, x), delim)).join(delim));
  });
  const floor = header ? 1 : 0;
  while (lines.length > floor && lines[lines.length - 1].split(delim).every((f) => f === '')) {
    lines.pop();
  }
  return lines.join('\n');
};

// VS Code stamps the active theme onto <body> (vscode-light / vscode-dark /
// vscode-high-contrast[-light]). GridSheet's inherit modes make it blend in.
const detectMode = (): 'inherit-light' | 'inherit-dark' => {
  const c = document.body.classList;
  const light = c.contains('vscode-light') || c.contains('vscode-high-contrast-light');
  return light ? 'inherit-light' : 'inherit-dark';
};

const useVscodeMode = () => {
  const [mode, setMode] = useState<'inherit-light' | 'inherit-dark'>(detectMode);
  useEffect(() => {
    const obs = new MutationObserver(() => setMode(detectMode()));
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return mode;
};

type GridProps = {
  rows: string[][];
  header: boolean;
  extraRows: number;
  extraCols: number;
  evaluate: boolean;
  delimiter: 'CSV' | 'TSV';
  mode: 'inherit-light' | 'inherit-dark';
  readOnly: boolean;
  onEdit: (text: string) => void;
};

// Remounts (via a key in App) whenever fresh data arrives, so it always starts
// from the authoritative document content plus the current header/extra-rows/cols.
const Grid = ({ rows, header, extraRows, extraCols, evaluate, delimiter, mode, readOnly, onEdit }: GridProps) => {
  const sheetRef = useRef<any>(null);
  const delim = delimiterChar(delimiter);

  // Serialize + post an edit, skipping no-op repeats (so an async-resolution
  // persist doesn't re-post what onChange already sent, and vice versa).
  const lastPostedRef = useRef<string | null>(null);
  const post = (sheet: any) => {
    // Read-only: never write anything back to the file (not even resolved formula values).
    if (!sheet || readOnly) {
      return;
    }
    const text = serialize(sheet, header, delim, evaluate);
    if (text === lastPostedRef.current) {
      return;
    }
    lastPostedRef.current = text;
    onEdit(text);
  };

  const additionalFunctions = useMemo(() => makeAiFunctions(enqueueAi), []);
  // useBook (not createBook) so registry.transmit is wired to a real repaint.
  // GridSheet only wires transmit for a book it owns; with our own createBook the
  // async =CLAUDE/=CODEX results would land in the cache but never render until an
  // unrelated interaction (e.g. a cursor move) forced a paint.
  const book = useBook({
    additionalFunctions,
    onChange: ({ sheet }: any) => post(sheet),
  });

  // While pending, serialize() writes the raw formula; once an AI batch resolves,
  // onChange does NOT fire (the Emitter only reacts to sheetReactive edits), so the
  // resolved value would never reach the file. Register a persist hook that the AI
  // result handler calls exactly once per resolved batch. A ref keeps it pointed at
  // the latest post() (current header/evaluate/delimiter) without re-registering.
  const postRef = useRef(post);
  postRef.current = post;
  useEffect(() => {
    // sheetRef.current is a SheetHandle ({ sheet, apply }) — pass the real Sheet.
    const fn = () => postRef.current(sheetRef.current?.sheet ?? null);
    aiPersist = fn;
    return () => {
      if (aiPersist === fn) {
        aiPersist = null;
      }
    };
  }, []);

  const initialCells = useMemo(() => {
    const headerRow = header ? rows[0] : undefined;
    const dataRows = header ? rows.slice(1) : rows;
    const numCols = Math.max(1, ...rows.map((r) => r.length), 1) + Math.max(0, extraCols);
    const cells: Record<string, { value?: string; label?: string; prevention?: number }> = {};
    if (readOnly) {
      // Prevention is resolved from a different bucket per cell kind: data cells stack
      // `default`, column headers stack `defaultCol`, row headers stack `defaultRow`. The
      // Sort/Filter/label column menu and the row menu gate on the HEADER cell's
      // prevention, and row/col insert-remove check the header too — so `default` alone
      // leaves all of those editable. Put the mask on all three.
      cells.default = { prevention: READ_ONLY_PREVENTION };
      cells.defaultCol = { prevention: READ_ONLY_PREVENTION };
      cells.defaultRow = { prevention: READ_ONLY_PREVENTION };
    }
    if (headerRow) {
      headerRow.forEach((value, x) => {
        cells[p2a({ y: 0, x: x + 1 })] = { label: value };
      });
    }
    dataRows.forEach((row, y) => {
      row.forEach((value, x) => {
        cells[p2a({ y: y + 1, x: x + 1 })] = { value };
      });
    });
    const numRows = Math.max(1, dataRows.length) + Math.max(0, extraRows);
    return buildInitialCells({ cells, ensured: { numRows, numCols } });
  }, [rows, header, extraRows, extraCols, readOnly]);

  return (
    <GridSheet
      book={book}
      sheetRef={sheetRef}
      storeRef={gridStoreRef}
      initialCells={initialCells}
      options={{
        mode,
        sheetWidth: '100%',
        sheetHeight: '100%',
        matrixAlignment: 'both',
        showAddress: true,
      }}
    />
  );
};

const barStyle = {
  padding: '3px 8px',
  fontFamily: 'sans-serif',
  fontSize: 12,
  opacity: 0.9,
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  flexWrap: 'wrap' as const,
  flex: '0 0 auto' as const,
  borderTop: '1px solid var(--vscode-panel-border, rgba(128,128,128,0.35))',
};

const btnStyle = {
  font: 'inherit',
  cursor: 'pointer',
  color: 'var(--vscode-textLink-foreground, #3794ff)',
  background: 'none',
  border: 'none',
  padding: 0,
};

const checkStyle = { display: 'flex', gap: 4, alignItems: 'center', cursor: 'pointer' };
const fieldStyle = {
  font: 'inherit',
  color: 'inherit',
  background: 'var(--vscode-input-background, transparent)',
  border: '1px solid var(--vscode-input-border, rgba(128,128,128,0.4))',
  borderRadius: 3,
  padding: '1px 4px',
};
const popoverStyle = {
  position: 'absolute' as const,
  bottom: '100%',
  right: 0,
  marginBottom: 6,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 2,
  padding: 6,
  minWidth: 168,
  background: 'var(--vscode-editorWidget-background, var(--vscode-editor-background))',
  border: '1px solid var(--vscode-widget-border, rgba(128,128,128,0.35))',
  borderRadius: 4,
  boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
  zIndex: 100000, // above GridSheet overlays (max 9999)
};
const menuItemStyle = {
  font: 'inherit',
  textAlign: 'left' as const,
  color: 'inherit',
  background: 'none',
  border: 'none',
  borderRadius: 3,
  padding: '3px 6px',
  cursor: 'pointer',
};
const sep = <span style={{ opacity: 0.35 }}>|</span>;

// A table with a filled top row = "first row is the header".
const HeaderIcon = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" style={{ display: 'block' }}>
    <rect x="2" y="3" width="12" height="10" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
    <rect x="2.6" y="3.6" width="10.8" height="2.7" fill="currentColor" />
    <path d="M8 6.3v6.4M2.6 9.6h10.8" stroke="currentColor" strokeWidth="0.9" opacity="0.7" />
  </svg>
);

// Padlock — open shackle when editable, closed when read-only.
const LockIcon = ({ open }: { open: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" style={{ display: 'block' }}>
    <rect x="3.5" y="7" width="9" height="6.3" rx="1.3" fill="currentColor" />
    <path
      d={open ? 'M6 7V5.1a2.4 2.4 0 0 1 4.7-0.7' : 'M5.7 7V5.1a2.3 2.3 0 0 1 4.6 0V7'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

// Footer icon-toggle (replaces the native checkboxes): the icon + label light up in the
// theme's active-option colors when on, and dim when off.
const Toggle = ({ on, onClick, title, children }: { on: boolean; onClick: () => void; title: string; children: any }) => (
  <button
    type="button"
    className="gs-toggle"
    title={title}
    aria-pressed={on}
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      font: 'inherit',
      cursor: 'pointer',
      padding: '2px 6px',
      borderRadius: 4,
      lineHeight: 1,
      border: `1px solid ${on ? 'var(--vscode-inputOption-activeBorder, #3794ff)' : 'transparent'}`,
      background: on ? 'var(--vscode-inputOption-activeBackground, rgba(55,148,255,0.2))' : 'transparent',
      color: on ? 'var(--vscode-inputOption-activeForeground, inherit)' : 'inherit',
      opacity: on ? 1 : 0.6,
    }}
  >
    {children}
  </button>
);

const App = () => {
  const [data, setData] = useState<DataMessage | null>(null);
  const [rev, setRev] = useState(0);
  const [header, setHeader] = useState(true);
  const [extraRows, setExtraRows] = useState(0);
  const [extraCols, setExtraCols] = useState(0);
  const [addN, setAddN] = useState(1000);
  const [addOpen, setAddOpen] = useState(false);
  // Per-file, footer-controlled. Initialized once from the settings default the host
  // sends in the first 'data' message; the footer toggle owns it afterward.
  const [readOnly, setReadOnly] = useState<boolean | null>(null);
  const mode = useVscodeMode();

  // Close the Add popover on an outside click.
  const addRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!addOpen) {
      return;
    }
    const onDown = (e: MouseEvent) => {
      if (addRef.current && !addRef.current.contains(e.target as Node)) {
        setAddOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown, true);
    return () => document.removeEventListener('mousedown', onDown, true);
  }, [addOpen]);

  // "at end" grows the empty margin (view-only, trimmed on save); "at selection"
  // is a real structural insert at the selected cell (shifts data, persists).
  const doAdd = (target: 'rows' | 'cols', where: 'end' | 'selection') => {
    const n = Math.max(1, addN);
    if (where === 'selection') {
      const handle = gridStoreRef.current;
      if (handle) {
        const { y, x } = handle.store.choosing;
        handle.dispatch(
          target === 'rows'
            ? userActions.insertRowsAbove({ y, numRows: n })
            : userActions.insertColsLeft({ x, numCols: n }),
        );
      }
    } else if (target === 'rows') {
      setExtraRows((v) => v + n);
    } else {
      setExtraCols((v) => v + n);
    }
    setAddOpen(false);
  };

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data as DataMessage | AiBatchResponse | { type: 'paste'; text?: string };
      if (msg?.type === 'aiBatchResult') {
        handleAiResult(msg);
        return;
      }
      if (msg?.type === 'paste') {
        applyPaste(msg.text ?? '');
        return;
      }
      if (msg?.type === 'data') {
        setData(msg);
        setRev((r) => r + 1); // remount <Grid> with the fresh, authoritative content
        setReadOnly((prev) => (prev === null ? !!msg.readOnly : prev)); // seed once from the setting
      }
    };
    window.addEventListener('message', handler);
    vscodeApi.postMessage({ type: 'ready' });
    return () => window.removeEventListener('message', handler);
  }, []);

  // When a view param changes (header / extra rows), pull the latest document so
  // the remount rebuilds from authoritative content — never from stale local rows.
  const firstParams = useRef(true);
  useEffect(() => {
    if (firstParams.current) {
      firstParams.current = false;
      return;
    }
    vscodeApi.postMessage({ type: 'requestData' });
  }, [header, extraRows, extraCols]);

  const onEdit = (text: string) => vscodeApi.postMessage({ type: 'edit', text });

  if (!data) {
    return <div style={{ padding: 12, fontFamily: 'sans-serif' }}>Loading…</div>;
  }

  const rows = data.rows;
  const cols = Math.max(1, ...rows.map((r) => r.length), 1);
  const ro = readOnly ?? !!data.readOnly;
  const evaluate = data.evaluate ?? true;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: '1 1 auto', minHeight: 0 }}>
        <Grid
          key={rev}
          rows={rows}
          header={header}
          extraRows={extraRows}
          extraCols={extraCols}
          evaluate={evaluate}
          delimiter={data.delimiter}
          mode={mode}
          readOnly={ro}
          onEdit={onEdit}
        />
      </div>

      <div style={barStyle}>
        <style>{`.gs-toggle:hover{background:var(--vscode-toolbar-hoverBackground, rgba(128,128,128,0.18)) !important;opacity:1 !important}`}</style>
        <span style={{ opacity: 0.6 }}>
          {data.delimiter} · {rows.length}×{cols}
        </span>
        {sep}
        <Toggle on={header} onClick={() => setHeader((v) => !v)} title="Use the first row as column labels">
          <HeaderIcon />
          Header row
        </Toggle>
        <Toggle
          on={ro}
          title="View-only: block edits and never write back to the file (per file). Default is gridsheet.viewer.readOnly."
          onClick={() => {
            setReadOnly(!ro);
            // Rebuild from the authoritative document (which already has any edits made
            // in editable mode) so toggling never remounts from stale local rows.
            vscodeApi.postMessage({ type: 'requestData' });
          }}
        >
          <LockIcon open={!ro} />
          Read-only
        </Toggle>
        {sep}
        <button
          style={btnStyle}
          title="Open GridSheet settings (line ending, =CLAUDE / =CODEX models, tools, repo access)"
          onClick={() => vscodeApi.postMessage({ type: 'openSettings' })}
        >
          ⚙ Settings
        </button>
        <span style={{ flex: 1 }} />
        {!ro && (
        <div ref={addRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
          <button style={{ ...btnStyle, fontWeight: 700 }} title="Add rows or columns" onClick={() => setAddOpen((o) => !o)}>
            ＋ Add ▾
          </button>
          {addOpen && (
            <div style={popoverStyle}>
              <style>{`.gs-add-item:hover{background:var(--vscode-list-hoverBackground, rgba(128,128,128,0.18)) !important}`}</style>
              <label style={{ ...checkStyle, cursor: 'default', justifyContent: 'space-between', padding: '0 6px 2px' }}>
                Count
                <input
                  type="number"
                  min={1}
                  value={addN}
                  onInput={(e) => setAddN(Math.max(1, Number((e.target as HTMLInputElement).value) || 1))}
                  style={{ ...fieldStyle, width: 70 }}
                />
              </label>
              <div style={{ height: 1, background: 'var(--vscode-widget-border, rgba(128,128,128,0.35))', margin: '2px 0' }} />
              <button className="gs-add-item" style={menuItemStyle} onClick={() => doAdd('rows', 'end')}>
                Rows — at end
              </button>
              <button className="gs-add-item" style={menuItemStyle} onClick={() => doAdd('cols', 'end')}>
                Cols — at end
              </button>
              <button className="gs-add-item" style={menuItemStyle} onClick={() => doAdd('rows', 'selection')}>
                Rows — at selection
              </button>
              <button className="gs-add-item" style={menuItemStyle} onClick={() => doAdd('cols', 'selection')}>
                Cols — at selection
              </button>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

render(<App />, document.getElementById('root')!);
