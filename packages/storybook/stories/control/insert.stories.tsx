import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  GridSheet,
  buildInitialCells,
  buildInitialCellsFromOrigin,
  useStoreRef,
  toValueObject,
} from '@gridsheet/react-core';
import { applyers } from '@gridsheet/react-core';
import { useSpellbook } from '@gridsheet/functions';
import { Debugger } from '@gridsheet/react-dev';

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
  const storeRef = useStoreRef();

  const book = useSpellbook({
    onInsertRows: ({ sheet, y, numRows }) => {
      console.log('onInsertRows called with:', { sheet, y, numRows });
      console.log('Inserted data:', toValueObject(sheet));
    },
    onInsertCols: ({ sheet, x, numCols }) => {
      console.log('onInsertCols called with:', { sheet, x, numCols });
      console.log('Inserted data:', toValueObject(sheet));
    },
    onRemoveRows: ({ sheet, ys }) => {
      console.log('onRemoveRows called with:', { sheet, ys });
      console.log('Removed data:', toValueObject(sheet));
    },
    onRemoveCols: ({ sheet, xs }) => {
      console.log('onRemoveCols called with:', { sheet, xs });
      console.log('Removed data:', toValueObject(sheet));
    },
  });

  const handleInsertRowsAbove = () => {
    if (storeRef?.current == null) {
      return;
    }
    const { store, dispatch } = storeRef.current;
    applyers.insertRowsAbove({ store, dispatch });
  };

  const handleInsertRowsBelow = () => {
    if (storeRef?.current == null) {
      return;
    }
    const { store, dispatch } = storeRef.current;
    applyers.insertRowsBelow({ store, dispatch });
  };

  const handleInsertColsLeft = () => {
    if (storeRef?.current == null) {
      return;
    }
    const { store, dispatch } = storeRef.current;
    applyers.insertColsLeft({ store, dispatch });
  };

  const handleInsertColsRight = () => {
    if (storeRef?.current == null) {
      return;
    }
    const { store, dispatch } = storeRef.current;
    applyers.insertColsRight({ store, dispatch });
  };

  const handleRemoveRows = () => {
    if (storeRef?.current == null) {
      return;
    }
    const { store, dispatch } = storeRef.current;
    applyers.removeRows({ store, dispatch });
  };

  const handleRemoveCols = () => {
    if (storeRef?.current == null) {
      return;
    }
    const { store, dispatch } = storeRef.current;
    applyers.removeCols({ store, dispatch });
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
        storeRef={storeRef}
        book={book}
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
      <Debugger book={book} />
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
