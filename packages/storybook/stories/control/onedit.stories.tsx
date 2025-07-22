import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GridSheet, buildInitialCells, useConnector, useHub, UserTable } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Control/OnEdit',
};
export default meta;

const DESCRIPTION = [
  '## Example',
  'This demo demonstrates the onEdit event handling in GridSheet with two sheets.',
  'It shows how to monitor edit operations in real-time and display information about edited areas.',

  '## How it works',
  'The interface includes two sheets side by side and shows information about the edited areas.',
  '1. The onEdit callback is triggered whenever cells are updated or moved.',
  '2. Edit information shows the area that was modified.',
  '3. For updates, it shows the range of cells that were changed.',
  '4. For moves, it shows both the source and destination areas.',
].join('\n\n');

const SheetOnEditComponent: React.FC = () => {
  const [editData, setEditData] = React.useState<Record<string, any>>({});
  const [editHistory, setEditHistory] = React.useState<
    Array<{
      operation: string;
      area: { top: number; left: number; bottom: number; right: number };
      sheetName: string;
      timestamp: string;
      data: Record<string, any>;
    }>
  >([]);

  const hub = useHub({
    onEdit: ({ table }) => {
      const data = table.getFieldObject();
      const info = {
        operation: 'EDIT',
        area: { top: table.top, left: table.left, bottom: table.bottom, right: table.right },
        sheetName: table.sheetName,
        timestamp: new Date().toLocaleTimeString(),
        data: data,
      };
      setEditData(data);
      setEditHistory((prev) => [info, ...prev.slice(0, 9)]); // Keep last 10 edits
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
              hub={hub}
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
                sheetWidth: 250,
                sheetHeight: 200,
              }}
            />
          </div>

          <div>
            <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>Sheet 2</h4>
            <GridSheet
              sheetName="Sheet2"
              hub={hub}
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
                sheetWidth: 250,
                sheetHeight: 200,
              }}
            />
          </div>
        </div>

        <div style={{ padding: '20px', maxWidth: '1800px', margin: '0 auto' }}>
          <h3>Edit History</h3>
          <div data-testid="edit-history" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {editHistory.map((edit, index) => (
              <div
                key={index}
                data-testid="history-item"
                style={{
                  border: '1px solid #ddd',
                  padding: '8px',
                  marginBottom: '8px',
                  fontSize: '12px',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 'bold', width: '80px' }}>Time:</td>
                      <td style={{ width: '120px' }}>{edit.timestamp}</td>
                      <td style={{ fontWeight: 'bold', width: '80px' }}>Sheet:</td>
                      <td style={{ width: '100px' }}>{edit.sheetName}</td>
                      <td style={{ fontWeight: 'bold', width: '80px' }}>Area:</td>
                      <td>
                        {edit.area.top},{edit.area.left} to {edit.area.bottom},{edit.area.right}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold', verticalAlign: 'top' }}>Data:</td>
                      <td colSpan={5}>
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
            {editHistory.length === 0 && <p>No edit history yet.</p>}
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
