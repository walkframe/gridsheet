import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GridSheet, buildInitialCells, addressesToAreas, toCellObject } from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/functions';

const meta: Meta = {
  title: 'Control/OnEdit',
};
export default meta;

const DESCRIPTION = [
  '## Example',
  'This demo demonstrates the onChange event handling in GridSheet with two sheets.',
  'It shows how to monitor changes in real-time and display information about edited areas.',

  '## How it works',
  'The interface includes two sheets side by side and shows information about the edited areas.',
  '1. The onChange callback is triggered whenever the grid data changes.',
  '2. `getLastChangedAddresses()` is used to identify which cells were modified.',
  '3. `getCellObject({ addresses })` retrieves only the changed cells.',
].join('\n\n');

type HistoryEntry = {
  operation: string;
  area: { top: number; left: number; bottom: number; right: number };
  sheetName: string;
  timestamp: string;
  data: Record<string, any>;
};

const HistoryPanel: React.FC<{ title: string; history: HistoryEntry[]; testId: string }> = ({
  title,
  history,
  testId,
}) => (
  <div style={{ width: '350px', flexShrink: 0 }}>
    <h4 style={{ textAlign: 'center' }}>{title} History</h4>
    <div data-testid={testId} style={{ maxHeight: '400px', overflowY: 'auto' }}>
      {history.map((edit, index) => (
        <div
          key={index}
          data-testid="history-item"
          style={{ border: '1px solid #ddd', padding: '8px', marginBottom: '8px', fontSize: '12px' }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 'bold', width: '60px' }}>Time:</td>
                <td>{edit.timestamp}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', verticalAlign: 'top' }}>Data:</td>
                <td colSpan={3}>
                  <textarea
                    data-testid="history-data"
                    style={{
                      width: '100%',
                      height: '20px',
                      fontFamily: 'monospace',
                      fontSize: '10px',
                      resize: 'none',
                    }}
                    value={JSON.stringify(edit.data)}
                    readOnly
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
      {history.length === 0 && <p style={{ color: '#aaa', fontSize: '12px' }}>No history yet.</p>}
    </div>
  </div>
);

const SheetOnEditComponent: React.FC = () => {
  const [sheet1History, setSheet1History] = React.useState<HistoryEntry[]>([]);
  const [sheet2History, setSheet2History] = React.useState<HistoryEntry[]>([]);

  const book = useSpellbook({
    onChange: ({ sheet }) => {
      const addresses = sheet.getLastChangedAddresses();
      if (addresses.length === 0) {
        return;
      }
      const data = toCellObject(sheet, { addresses });
      const areas = addressesToAreas(addresses);
      const area = areas[0] ?? { top: 0, left: 0, bottom: 0, right: 0 };
      const info: HistoryEntry = {
        operation: 'EDIT',
        area,
        sheetName: sheet.name,
        timestamp: new Date().toLocaleTimeString(),
        data,
      };
      if (sheet.name === 'Sheet1') {
        setSheet1History((prev) => [info, ...prev.slice(0, 9)]);
      } else {
        setSheet2History((prev) => [info, ...prev.slice(0, 9)]);
      }
    },
  });

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
          <div>
            <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>Sheet 1</h4>
            <GridSheet
              sheetName="Sheet1"
              book={book}
              initialCells={buildInitialCells({
                matrices: {
                  A1: [
                    ['Product', 'Price', 'Quantity'],
                    ['Apple', 100, 5],
                    ['Orange', 80, 3],
                    ['Banana', 60, 8],
                  ],
                },
                cells: {
                  default: {
                    width: 80,
                  },
                  A: {
                    style: { backgroundColor: '#f0f0f0' },
                  },
                },
                ensured: {
                  numRows: 20,
                  numCols: 3,
                },
              })}
              options={{
                sheetWidth: 350,
                sheetHeight: 200,
              }}
            />
          </div>

          <div>
            <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>Sheet 2</h4>
            <GridSheet
              sheetName="Sheet2"
              book={book}
              initialCells={buildInitialCells({
                matrices: {
                  A1: [
                    ['Name', 'Age', 'City'],
                    ['John', 25, 'Tokyo'],
                    ['Jane', 30, 'Osaka'],
                    ['Bob', 35, 'Kyoto'],
                  ],
                },
                cells: {
                  default: {
                    width: 80,
                  },
                  A: {
                    style: { backgroundColor: '#f0f0f0' },
                  },
                },
                ensured: {
                  numRows: 20,
                  numCols: 3,
                },
              })}
              options={{
                sheetWidth: 350,
                sheetHeight: 200,
              }}
            />
          </div>
        </div>

        <div style={{ padding: '20px', maxWidth: '1800px', margin: '0 auto' }}>
          <h3>Edit History</h3>
          <div style={{ display: 'flex', gap: '20px' }}>
            <HistoryPanel title="Sheet1" history={sheet1History} testId="edit-history-sheet1" />
            <HistoryPanel title="Sheet2" history={sheet2History} testId="edit-history-sheet2" />
          </div>
        </div>
      </div>
    </>
  );
};

export const OnEdit: StoryObj = {
  render: () => <SheetOnEditComponent />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
