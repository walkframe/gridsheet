import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GridSheet, buildInitialCells, useTableRef, HistoryType } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Feature/Control/OnChange',
  tags: ['autodocs'],
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

export const SheetOnChange: StoryObj = {
  render: () => {
    const [diff, setDiff] = React.useState<Record<string, any>>({});
    const [evaluates, setEvaluates] = React.useState<boolean>(true);
    const [histories, setHistories] = React.useState<HistoryType[]>([]);
    const tableRef = useTableRef();
    const table = tableRef.current?.table;
    React.useEffect(() => {
      if (table == null) {
        return;
      }
      setDiff(
        table.getFieldObject({
          refEvaluation: evaluates ? 'complete' : 'raw',
          filter: (cell) => !!cell?.system?.changedAt && cell.system.changedAt > table.lastChangedAt!,
        }),
      );
    }, [table, evaluates]);

    return (
      <>
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1 }}>
            <GridSheet
              tableRef={tableRef}
              initialCells={buildInitialCells({
                matrices: {
                  A1: [
                    [1, 2, 3, 4, 5],
                    [6, 7, 8, 9, 10],
                  ],
                },
                cells: {
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
                onChange: (table, positions) => {
                  const histories = table.getHistories();
                  setHistories(histories);
                  const h = histories[histories.length - 1];
                  if (h?.operation === 'UPDATE') {
                    console.log('histories', table.getAddressesByIds(h.diffAfter));
                  }
                  console.log('matrix', table.getFieldMatrix({}));
                },
              }}
            />
            <div>Diff:</div>
            <textarea
              id="changes"
              style={{ width: '300px', height: '100px' }}
              value={JSON.stringify(diff, null, 2)}
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
                      return JSON.stringify(table?.getAddressesByIds(history.diffAfter));
                    }
                  })()}
                </pre>
              </li>
            ))}
          </ul>
        </div>
      </>
    );
  },
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
