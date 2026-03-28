import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  GridSheet,
  buildInitialCells,
  useSheetRef,
  HistoryType,
  sheet2csv,
  FormulaError,
  UserSheet,
  PointType,
  toCellObject,
} from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/functions';
import CodeMirror from '@uiw/react-codemirror';
import { lineNumbers } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';

const meta: Meta = {
  title: 'Control/TSV',
};
export default meta;

const DESCRIPTION = [
  '## Example',
  'This demo demonstrates the onChange event handling and history tracking in GridSheet.',
  'It shows how to monitor changes in real-time, track operation history, and display diffs between states.',

  '## How it works',
  'The interface includes a live diff viewer and operation history that updates as you interact with the grid.',
  '1. The onChange callback is triggered whenever the grid data changes.',
  '2. Operation history is tracked and displayed in real-time.',
  '3. Diffs show exactly what changed between operations.',
  '4. The evaluates checkbox controls whether to show calculated or raw values in diffs.',
].join('\n\n');

const SheetTSVComponent: React.FC = () => {
  const [csvData, setCsvData] = React.useState<string>('');
  const [evaluates, setEvaluates] = React.useState<boolean>(true);
  const [ignoreError, setIgnoreError] = React.useState<boolean>(false);
  const [trailingEmptyRowsOmitted, setTrailingEmptyRowsOmitted] = React.useState<boolean>(true);
  const [histories, setHistories] = React.useState<HistoryType[]>([]);
  const sheetRef = useSheetRef();
  const sheet = sheetRef.current?.sheet;

  const getter = (sheet: UserSheet, point: PointType) => {
    const value = sheet.getCell(point, { resolution: evaluates ? 'RESOLVED' : 'RAW' })?.value ?? '';
    if (FormulaError.is(value)) {
      return ignoreError ? '' : value.code;
    }
    return String(value);
  };

  const book = useSpellbook({
    onChange: ({ sheet, points }) => {
      const tsv = sheet2csv(sheet, { getter, trailingEmptyRowsOmitted });
      setCsvData(tsv);
      setHistories(sheet.__raw__.histories());
      const changed = toCellObject(sheet, { addresses: sheet.getLastChangedAddresses() });
    },
  });
  React.useEffect(() => {
    if (sheet == null) {
      return;
    }
    const tsv = sheet2csv(sheet, { getter, trailingEmptyRowsOmitted });
    setCsvData(tsv);
  }, [sheet, evaluates, ignoreError, trailingEmptyRowsOmitted]);

  return (
    <>
      <div>
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <GridSheet
            sheetRef={sheetRef}
            book={book}
            initialCells={buildInitialCells({
              matrices: {
                A1: [
                  [1, 2, 3, 4, 5],
                  [6, 7, 8, 9, 10],
                ],
              },
              cells: {
                A3: { value: '=A1+A2' },
                B3: { value: '=SUM(A1:B2)' },
                C3: { value: '=AVERAGE(A1:C2)' },
                D3: { value: '=MAX(A1:D2)' },
                E3: { value: '=MIN(A1:E2)' },
                B5: { value: '=na()' },
                C5: { value: '=A1/0' },
                default: {
                  width: 50,
                },
                E: {
                  style: { backgroundColor: '#ddf' },
                },
              },
              ensured: {
                numRows: 20,
                numCols: 10,
              },
            })}
            options={{
              sheetWidth: 300,
              sheetHeight: 300,
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'flex-start',
              justifyContent: 'flex-end',
              marginLeft: '16px',
              flexShrink: 0,
            }}
          >
            <label>
              Evaluates:{' '}
              <input id="evaluates" type="checkbox" checked={evaluates} onChange={() => setEvaluates(!evaluates)} />
            </label>
            <label>
              Ignore Errors:{' '}
              <input
                id="ignoreError"
                type="checkbox"
                checked={ignoreError}
                onChange={() => setIgnoreError(!ignoreError)}
              />
            </label>
            <label>
              Trim Empty Rows:{' '}
              <input
                id="trimingEmptyRows"
                type="checkbox"
                checked={trailingEmptyRowsOmitted}
                onChange={() => setTrailingEmptyRowsOmitted(!trailingEmptyRowsOmitted)}
              />
            </label>
          </div>
        </div>
        <div>TSV Data:</div>
        <CodeMirror
          id="changes"
          value={csvData}
          readOnly
          theme={oneDark}
          extensions={[lineNumbers()]}
          style={{ width: '600px', height: '200px', fontSize: '14px' }}
        />
        <ul className="histories">
          {histories.map((history, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                lineHeight: '20px',
                borderBottom: 'solid 1px #777',
                marginBottom: '10px',
                backgroundColor: sheet?.historyIndex() === i ? '#fdd' : 'transparent',
              }}
            >
              <div style={{ color: '#09a' }}>[{history.operation}]</div>
              <pre style={{ margin: 0 }}>
                {(() => {
                  if (history.operation === 'UPDATE') {
                    const raw = sheet?.__raw__;
                    if (raw == null) return null;
                    const addresses: Record<string, unknown> = {};
                    Object.keys(history.diffAfter).forEach((id) => {
                      const address = raw.getAddressById(id);
                      if (address) addresses[address] = history.diffAfter[id];
                    });
                    return JSON.stringify(addresses);
                  }
                })()}
              </pre>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export const SheetTSV: StoryObj = {
  render: () => <SheetTSVComponent />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
