'use client';

import * as React from 'react';
import { GridSheet, buildInitialCells } from '@gridsheet/react-core';
import type { SheetHandle } from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/react-core/spellbook';
import { fromXlsx, toXlsx } from '@gridsheet/xlsx';
import type { ParsedWorkbook } from '@gridsheet/xlsx';

const SAMPLE_URL = '/examples/sample.xlsx';

type Refs = Record<string, { current: SheetHandle | null }>;

// Every sheet of the workbook in one shared book, so cross-sheet formulas
// (=SUM(Sales!D3:D5)) resolve. initialCells is initial-only, so a new import remounts
// this component (see `key` below) for a fresh book.
function Workbook({ workbook, refs }: { workbook: ParsedWorkbook; refs: React.MutableRefObject<Refs> }) {
  const book = useSpellbook({});
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {Object.entries(workbook).map(([name, data]) => {
        const ref = (refs.current[name] ??= { current: null });
        return (
          <div key={name}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{name}</div>
            <GridSheet
              book={book}
              sheetName={name}
              sheetRef={ref}
              // `data` is { matrices, cells }: values/formulas, plus styles, sizes and merges.
              initialCells={buildInitialCells({ ...data, ensured: { numRows: 8, numCols: 5 } })}
              // Excel colors assume a white page (a fill without a text color, or the reverse), so
              // an imported workbook stays light even on a dark site — like the file itself.
              options={{ sheetHeight: 230, showFormulaBar: true, mode: 'light' }}
            />
          </div>
        );
      })}
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: '5px 12px',
  border: '1px solid var(--sl-color-gray-5)',
  borderRadius: 4,
  background: 'var(--sl-color-gray-6)',
  color: 'var(--sl-color-white)',
  cursor: 'pointer',
  fontSize: 13,
};

export default function ExcelImportExport() {
  const refs = React.useRef<Refs>({});
  const [workbook, setWorkbook] = React.useState<ParsedWorkbook | null>(null);
  const [version, setVersion] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const load = (bytes: ArrayBuffer, label: string) => {
    try {
      refs.current = {};
      setWorkbook(fromXlsx(new Uint8Array(bytes)));
      setVersion((v) => v + 1);
      setError(null);
    } catch (e) {
      setError(`Could not read ${label}: ${(e as Error).message}`);
    }
  };

  const loadSample = async () => {
    const res = await fetch(SAMPLE_URL);
    load(await res.arrayBuffer(), 'the sample');
  };

  React.useEffect(() => {
    loadSample();
  }, []);

  const openFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    if (!/\.xlsx$/i.test(file.name)) {
      setError(`${file.name}: only .xlsx files are supported (not .xls / .csv).`);
      return;
    }
    load(await file.arrayBuffer(), file.name);
  };
  const [dragging, setDragging] = React.useState(false);

  // Read the live sheets (with your edits and merges) back out as one workbook.
  const download = () => {
    const sheets: Record<string, SheetHandle['sheet']> = {};
    for (const [name, ref] of Object.entries(refs.current)) {
      if (ref.current) {
        sheets[name] = ref.current.sheet;
      }
    }
    const blob = new Blob([toXlsx(sheets)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gridsheet.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    // Drop an .xlsx anywhere on the demo to open it.
    <div
      style={{
        padding: '10px',
        fontSize: 13,
        borderRadius: 6,
        outline: dragging ? '2px dashed var(--sl-color-accent)' : 'none',
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        openFile(e.dataTransfer.files[0]);
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <button type="button" style={buttonStyle} onClick={loadSample}>
          Reload sample
        </button>
        <label
          style={{ ...buttonStyle, background: 'var(--sl-color-accent)', color: '#fff', borderColor: 'transparent' }}
        >
          Open your Excel file (.xlsx)…
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => {
              openFile(e.target.files?.[0]);
              e.target.value = '';
            }}
            style={{ display: 'none' }}
          />
        </label>
        <button type="button" style={buttonStyle} onClick={download} disabled={!workbook}>
          Download .xlsx
        </button>
      </div>
      <p style={{ margin: '0 0 10px', opacity: 0.8 }}>
        Open any <code>.xlsx</code> file (or drop one here) — the sample loads by default and its titles are merged
        cells. Edit values or select a range and right-click → <em>Merge cells</em>, then download and open the result
        in Excel or another spreadsheet app.
      </p>
      {error && <p style={{ color: '#e5534b' }}>{error}</p>}
      {workbook && <Workbook key={version} workbook={workbook} refs={refs} />}
    </div>
  );
}
