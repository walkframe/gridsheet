import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, GridSheet } from '@gridsheet/react-core';
import { fromXlsx, toXlsx } from '@gridsheet/xlsx';
import sampleUrl from './sample.xlsx?url';

const meta: Meta = {
  title: 'IO/Xlsx',
};
export default meta;

const DESCRIPTION = [
  '## xlsx import / export',
  'Convert between `.xlsx` and GridSheet with `@gridsheet/xlsx`.',
  '',
  '- **Load sample** fetches a shipped `sample.xlsx` and reads it with `fromXlsx` —',
  '  formulas survive and re-evaluate in the grid.',
  '- **Import file** reads a real `.xlsx` you pick.',
  '- **Download** reads the current sheet (`toXlsx({ Sheet1: sheet })`) and saves a `.xlsx`.',
].join('\n');

const EMPTY: (string | number)[][] = [['(click “Load sample” or import a file)']];

const btnStyle: React.CSSProperties = {
  padding: '4px 10px',
  marginRight: 8,
  cursor: 'pointer',
};

const XlsxConverter = () => {
  const sheetRef = React.useRef<any>(null);
  const [matrix, setMatrix] = React.useState<any[][]>(EMPTY);
  // Bump to remount the grid: initialCells is initial-only, so importing new data
  // means mounting a fresh GridSheet keyed by this version.
  const [version, setVersion] = React.useState(0);

  const load = (next: any[][]) => {
    setMatrix(next);
    setVersion((v) => v + 1);
  };

  const loadSample = async () => {
    // Fetch the shipped sample.xlsx (Vite gives us its bundled URL) and parse it.
    const buf = await (await fetch(sampleUrl)).arrayBuffer();
    const parsed = fromXlsx(new Uint8Array(buf));
    const first = Object.values(parsed)[0];
    if (first) {
      load(first.matrices.A1 as any[][]);
    }
  };

  const importFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const parsed = fromXlsx(new Uint8Array(await file.arrayBuffer()));
    const first = Object.values(parsed)[0];
    if (first) {
      load(first.matrices.A1 as any[][]);
    }
    e.target.value = '';
  };

  const download = () => {
    const handle = sheetRef.current;
    if (!handle) {
      return;
    }
    const bytes = toXlsx({ Sheet1: handle.sheet });
    const blob = new Blob([bytes], {
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
      <GridSheet
        key={version}
        sheetRef={sheetRef}
        options={{ sheetWidth: 700, sheetHeight: 250, showFormulaBar: true }}
        initialCells={buildInitialCells({
          matrices: { A1: matrix },
          cells: { defaultCol: { width: 130 } },
          ensured: { numRows: 8, numCols: 4 },
        })}
      />
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
