import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GridSheet, buildInitialCells, useConnector, HistoryType, useHub } from '@gridsheet/react-core';

// TSV conversion utility function
const convertToTSV = (table: any, evaluates: boolean = true): string => {
  if (!table) return '';

  const matrix = table.getFieldMatrix({
    refEvaluation: evaluates ? 'COMPLETE' : 'RAW',
  });

  if (!matrix || matrix.length === 0) return '';

  return matrix
    .map((row: any[]) =>
      row
        .map((cell: any) => {
          if (cell === null || cell === undefined) return '';
          // Handle tabs and newlines appropriately
          const cellStr = String(cell);
          if (cellStr.includes('\t') || cellStr.includes('\n')) {
            // Replace tabs with spaces and remove newlines
            return cellStr.replace(/\t/g, ' ').replace(/\n/g, ' ');
          }
          return cellStr;
        })
        .join('\t'),
    )
    .join('\n');
};

const meta: Meta = {
  title: 'Control/OnChange',
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

const SheetOnChangeComponent: React.FC = () => {
  const [csvData, setCsvData] = React.useState<string>('');
  const [evaluates, setEvaluates] = React.useState<boolean>(true);
  const [histories, setHistories] = React.useState<HistoryType[]>([]);
  const connector = useConnector();
  const table = connector.current?.tableManager.table;

  const hub = useHub({
    onChange: ({ table, points }) => {
      const tsv = convertToTSV(table, evaluates);
      setCsvData(tsv);
      const histories = table.getHistories();
      setHistories(histories);
      const h = histories[histories.length - 1];
      if (h?.operation === 'UPDATE') {
        console.log('histories', table.__raw__.getAddressesByIds(h.diffAfter));
      }
      console.log('matrix', table.getFieldMatrix({}));
    },
  });
  React.useEffect(() => {
    if (table == null) {
      return;
    }
    const tsv = convertToTSV(table, evaluates);
    setCsvData(tsv);
  }, [table, evaluates]);

  return (
    <>
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <GridSheet
            connector={connector}
            hub={hub}
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
          <div>TSV Data:</div>
          <textarea
            id="changes"
            style={{ width: '600px', height: '200px', fontFamily: 'monospace', fontSize: '12px' }}
            value={csvData}
            readOnly
          ></textarea>
          <br />
          <label>
            Evaluates:{' '}
            <input id="evaluates" type="checkbox" checked={evaluates} onChange={() => setEvaluates(!evaluates)} />
          </label>
        </div>
        <ul className="histories">
          {histories.map((history, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                lineHeight: '20px',
                borderBottom: 'solid 1px #777',
                marginBottom: '10px',
                backgroundColor: table?.getHistoryIndex() === i ? '#fdd' : 'transparent',
              }}
            >
              <div style={{ color: '#09a' }}>[{history.operation}]</div>
              <pre style={{ margin: 0 }}>
                {(() => {
                  if (history.operation === 'UPDATE') {
                    return JSON.stringify(table?.__raw__.getAddressesByIds(history.diffAfter));
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

export const SheetOnChange: StoryObj = {
  render: () => <SheetOnChangeComponent />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
