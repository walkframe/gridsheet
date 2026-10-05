import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/react-core/spellbook';
import { fromXlsx, toXlsx } from '@gridsheet/xlsx';
import type { XlsxSheetData } from '@gridsheet/xlsx';
import sampleUrl from './sample.xlsx?url';

const meta: Meta = {
  title: 'IO/Xlsx',
};
export default meta;

const DESCRIPTION = [
  '## xlsx import / export',
  'Convert between `.xlsx` and GridSheet with `@gridsheet/xlsx`.',
  '',
  '- **Load sample** fetches a shipped `sample.xlsx` — a styled, merged, multi-sheet workbook',
  "  whose `Summary` sheet has **cross-sheet formulas** (`=SUM(Sales!D3:D5)`, `=Sales!D6*'Meta Data'!B3`).",
  '  Cell styles (background, text color, bold, alignment) and merged ranges import too;',
  '  the sheets share a `book` so cross-sheet references re-evaluate.',
  '- **Import file** reads a real `.xlsx` you pick.',
  '- **Download** writes every sheet back out with `toXlsx`.',
].join('\n');

// Each sheet is the parsed { matrices, cells } — cells carry imported styles.
type Sheets = Record<string, XlsxSheetData>;

const EMPTY: Sheets = {
  Sheet1: { matrices: { A1: [['(click “Load sample” or import a file)']] }, cells: {} },
};

const btnStyle: React.CSSProperties = {
  padding: '4px 10px',
  marginRight: 8,
  cursor: 'pointer',
};

// Renders every sheet of a workbook into one shared book so cross-sheet
// formulas resolve. Keyed by import version so each load gets a fresh book.
const Workbook = ({ sheets, refs }: { sheets: Sheets; refs: React.MutableRefObject<Record<string, any>> }) => {
  const book = useSpellbook({});
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
      {Object.entries(sheets).map(([name, data]) => {
        const ref = (refs.current[name] ??= { current: null });
        return (
          <div key={name} data-testid={`sheet-${name}`}>
            <h4 style={{ margin: '0 0 4px' }}>{name}</h4>
            <GridSheet
              book={book}
              sheetName={name}
              sheetRef={ref}
              options={{ sheetWidth: 480, sheetHeight: 220, showFormulaBar: true }}
              initialCells={buildInitialCells({
                matrices: data.matrices,
                // Imported per-cell styles (background/color/weight/alignment) + a default width.
                cells: { defaultCol: { width: 120 }, ...data.cells },
                ensured: { numRows: 6, numCols: 4 },
              })}
            />
          </div>
        );
      })}
    </div>
  );
};

const XlsxConverter = () => {
  const refs = React.useRef<Record<string, any>>({});
  const [sheets, setSheets] = React.useState<Sheets>(EMPTY);
  // Bump to remount: initialCells is initial-only, so a new import means a fresh book + sheets.
  const [version, setVersion] = React.useState(0);

  const load = (next: Sheets) => {
    refs.current = {};
    setSheets(next);
    setVersion((v) => v + 1);
  };

  const loadSample = async () => {
    const buf = await (await fetch(sampleUrl)).arrayBuffer();
    load(fromXlsx(new Uint8Array(buf)));
  };

  const importFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    load(fromXlsx(new Uint8Array(await file.arrayBuffer())));
    e.target.value = '';
  };

  const download = () => {
    const out: Record<string, any> = {};
    for (const name of Object.keys(sheets)) {
      const handle = refs.current[name]?.current;
      if (handle) {
        out[name] = handle.sheet;
      }
    }
    if (Object.keys(out).length === 0) {
      return;
    }
    const blob = new Blob([toXlsx(out)], {
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
    <div>
      <div style={{ marginBottom: 8 }}>
        <button type="button" data-testid="load-sample" onClick={loadSample} style={btnStyle}>
          Load sample
        </button>
        <label style={{ ...btnStyle, display: 'inline-block' }}>
          Import file
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            data-testid="import-file"
            onChange={importFile}
            style={{ display: 'none' }}
          />
        </label>
        <button type="button" data-testid="download" onClick={download} style={btnStyle}>
          Download
        </button>
      </div>
      <Workbook key={version} sheets={sheets} refs={refs} />
    </div>
  );
};

export const Converter: StoryObj = {
  render: () => <XlsxConverter />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
