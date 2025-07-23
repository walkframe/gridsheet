import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GridSheet, buildInitialCells, buildInitialCellsFromOrigin, useConnector, useHub } from '@gridsheet/react-core';
import { syncers } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Control/Insert',
};
export default meta;

const DESCRIPTION = [
  '## Example',
  'This demo showcases insert and remove operations for rows and columns in GridSheet with event handling.',
  'It demonstrates how to programmatically insert rows/columns above/below/left/right and remove them.',
  'The demo shows a 3x3 grid with [1,2,3], [4,5,6], [7,8,9] and buttons to manipulate the structure.',
  'Event handlers are called when insert/remove operations are performed.',

  '## How it works',
  'Insert and remove operations allow you to dynamically modify the grid structure.',
  '1. Use connector to access the store and sync function.',
  '2. Each operation takes parameters like numRows/numCols and position.',
  '3. Operations are applied through the sync function to maintain consistency.',
  '4. Event handlers (onInsertRows, onInsertCols, onRemoveRows, onRemoveCols) are called with the affected data.',
  '5. The grid automatically adjusts cell references and formulas.',
].join('\n\n');

const InsertComponent: React.FC = () => {
  const connector = useConnector();

  const hub = useHub({
    onInsertRows: ({ table, y, numRows }) => {
      console.log('onInsertRows called with:', { table, y, numRows });
      console.log('Inserted data:', table.getFieldObject());
    },
    onInsertCols: ({ table, x, numCols }) => {
      console.log('onInsertCols called with:', { table, x, numCols });
      console.log('Inserted data:', table.getFieldObject());
    },
    onRemoveRows: ({ table, ys }) => {
      console.log('onRemoveRows called with:', { table, ys });
      console.log('Removed data:', table.getFieldObject());
    },
    onRemoveCols: ({ table, xs }) => {
      console.log('onRemoveCols called with:', { table, xs });
      console.log('Removed data:', table.getFieldObject());
    },
  });

  const handleInsertRowsAbove = () => {
    if (connector?.current == null) {
      return;
    }
    const { storeManager } = connector.current;
    const { store, dispatch } = storeManager;
    syncers.insertRowsAbove({ store, dispatch });
  };

  const handleInsertRowsBelow = () => {
    if (connector?.current == null) {
      return;
    }
    const { storeManager } = connector.current;
    const { store, dispatch } = storeManager;
    syncers.insertRowsBelow({ store, dispatch });
  };

  const handleInsertColsLeft = () => {
    if (connector?.current == null) {
      return;
    }
    const { storeManager } = connector.current;
    const { store, dispatch } = storeManager;
    syncers.insertColsLeft({ store, dispatch });
  };

  const handleInsertColsRight = () => {
    if (connector?.current == null) {
      return;
    }
    const { storeManager } = connector.current;
    const { store, dispatch } = storeManager;
    syncers.insertColsRight({ store, dispatch });
  };

  const handleRemoveRows = () => {
    if (connector?.current == null) {
      return;
    }
    const { storeManager } = connector.current;
    const { store, dispatch } = storeManager;
    syncers.removeRows({ store, dispatch });
  };

  const handleRemoveCols = () => {
    if (connector?.current == null) {
      return;
    }
    const { storeManager } = connector.current;
    const { store, dispatch } = storeManager;
    syncers.removeCols({ store, dispatch });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <button
          onClick={handleInsertRowsAbove}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            margin: '10px',
          }}
        >
          Insert Row Above
        </button>
        <button
          onClick={handleInsertRowsBelow}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            margin: '10px',
          }}
        >
          Insert Row Below
        </button>
        <button
          onClick={handleRemoveRows}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            margin: '10px',
          }}
        >
          Remove Row
        </button>
        <br />
        <button
          onClick={handleInsertColsLeft}
          style={{
            padding: '8px 16px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            margin: '10px',
          }}
        >
          Insert Column Left
        </button>
        <button
          onClick={handleInsertColsRight}
          style={{
            padding: '8px 16px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            margin: '10px',
          }}
        >
          Insert Column Right
        </button>

        <button
          onClick={handleRemoveCols}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            margin: '10px',
          }}
        >
          Remove Column
        </button>
      </div>

      <GridSheet
        connector={connector}
        hub={hub}
        initialCells={buildInitialCellsFromOrigin({
          matrix: [
            [1, 2, '=SUM(A1:B1)'],
            [4, 5, '=SUM(A2:B2)'],
            ['=SUM(A1:A2)', '=SUM(B1:B2)', '=SUM(C1:C2)'],
          ],
        })}
        options={{
          sheetHeight: 200,
          sheetWidth: 250,
          sheetResize: 'both',
        }}
      />
    </div>
  );
};

export const Insert: StoryObj = {
  render: () => <InsertComponent />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
