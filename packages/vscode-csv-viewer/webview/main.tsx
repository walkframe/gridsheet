import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { GridSheet, buildInitialCells, createBook, toValueMatrix, p2a, render } from '@gridsheet/preact-core';

declare function acquireVsCodeApi(): { postMessage(msg: unknown): void };

const vscodeApi = acquireVsCodeApi();

type DataMessage = { type: 'data'; rows: string[][]; delimiter: 'CSV' | 'TSV' };

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
  for (const row of matrix) {
    lines.push(row.map((v) => quoteField(v == null ? '' : String(v), delim)).join(delim));
  }
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
  evaluate: boolean;
  delimiter: 'CSV' | 'TSV';
  mode: 'inherit-light' | 'inherit-dark';
  onEdit: (text: string) => void;
};

// Remounts (via a key in App) whenever fresh data arrives, so it always starts
// from the authoritative document content plus the current header/extra-rows.
const Grid = ({ rows, header, extraRows, evaluate, delimiter, mode, onEdit }: GridProps) => {
  const sheetRef = useRef<any>(null);
  const delim = delimiterChar(delimiter);

  const book = useMemo(
    () => createBook({ onChange: ({ sheet }: any) => onEdit(serialize(sheet, header, delim, evaluate)) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const initialCells = useMemo(() => {
    const headerRow = header ? rows[0] : undefined;
    const dataRows = header ? rows.slice(1) : rows;
    const numCols = Math.max(1, ...rows.map((r) => r.length), 1);
    const cells: Record<string, { value?: string; label?: string }> = {};
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
  }, [rows, header, extraRows]);

  return (
    <GridSheet
      book={book}
      sheetRef={sheetRef}
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
const sep = <span style={{ opacity: 0.35 }}>|</span>;

const App = () => {
  const [data, setData] = useState<DataMessage | null>(null);
  const [rev, setRev] = useState(0);
  const [header, setHeader] = useState(true);
  const [extraRows, setExtraRows] = useState(0);
  const [addN, setAddN] = useState(1000);
  const [evaluate, setEvaluate] = useState(true);
  const mode = useVscodeMode();

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data as DataMessage;
      if (msg?.type === 'data') {
        setData(msg);
        setRev((r) => r + 1); // remount <Grid> with the fresh, authoritative content
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
  }, [header, extraRows, evaluate]);

  const onEdit = (text: string) => vscodeApi.postMessage({ type: 'edit', text });

  if (!data) {
    return <div style={{ padding: 12, fontFamily: 'sans-serif' }}>Loading…</div>;
  }

  const rows = data.rows;
  const cols = Math.max(1, ...rows.map((r) => r.length), 1);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: '1 1 auto', minHeight: 0 }}>
        <Grid
          key={rev}
          rows={rows}
          header={header}
          extraRows={extraRows}
          evaluate={evaluate}
          delimiter={data.delimiter}
          mode={mode}
          onEdit={onEdit}
        />
      </div>

      <div style={barStyle}>
        <span style={{ opacity: 0.6 }}>
          {data.delimiter} · {rows.length}×{cols}
        </span>
        {sep}
        <label style={checkStyle} title="Use the first row as editable column labels">
          <input type="checkbox" checked={header} onChange={(e) => setHeader((e.target as HTMLInputElement).checked)} />
          Header row
        </label>
        <label style={checkStyle} title="Write formula results (=A1+B1 → 30) instead of the formula source">
          <input
            type="checkbox"
            checked={evaluate}
            onChange={(e) => setEvaluate((e.target as HTMLInputElement).checked)}
          />
          Evaluate formulas
        </label>
        {sep}
        <span style={checkStyle} title="Add empty rows at the bottom">
          Add
          <input
            type="number"
            min={1}
            value={addN}
            onInput={(e) => setAddN(Math.max(1, Number((e.target as HTMLInputElement).value) || 1))}
            style={{
              width: 58,
              font: 'inherit',
              color: 'inherit',
              background: 'var(--vscode-input-background, transparent)',
              border: '1px solid var(--vscode-input-border, rgba(128,128,128,0.4))',
              borderRadius: 3,
              padding: '1px 4px',
            }}
          />
          rows
          <button
            style={{ ...btnStyle, fontWeight: 700 }}
            title="Add rows"
            onClick={() => setExtraRows((n) => n + addN)}
          >
            ＋
          </button>
          {extraRows > 0 && <span style={{ opacity: 0.5 }}>+{extraRows}</span>}
        </span>
        <span style={{ flex: 1 }} />
        <button
          style={btnStyle}
          title="Reopen this file in the plain text editor"
          onClick={() => vscodeApi.postMessage({ type: 'openAsText' })}
        >
          Open as text ⇄
        </button>
      </div>
    </div>
  );
};

render(<App />, document.getElementById('root')!);
