import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GridSheet, buildInitialCells, useStoreRef, applyers, toValueObject } from '@gridsheet/react-core';

import { useSpellbook } from '@gridsheet/react-core/spellbook';

const meta: Meta = {
  title: 'Control/Remove',
};
export default meta;

const DESCRIPTION = [
  '## Example',
  'This demo showcases remove operations for rows and columns in GridSheet with event handling.',
  'It demonstrates how to handle onRemoveRows and onRemoveCols events when rows/columns are removed.',
  'The demo shows a grid with data and buttons to remove rows/columns, with console logging of removed data.',

  '## How it works',
  'Remove operations trigger onRemoveRows and onRemoveCols events with the removed data.',
  '1. Use book to set up onRemoveRows and onRemoveCols event handlers.',
  '2. The event handlers receive a cloned sheet with the removed data and the indices of removed rows/columns.',
  '3. The removed data can be accessed through the cloned sheet.',
  '4. Console logs show the removed data and indices.',
].join('\n\n');

const RemoveComponent: React.FC = () => {
  const storeRef = useStoreRef();

  const book = useSpellbook({
    onRemoveRows: ({ sheet, ys }) => {
      console.log('onRemoveRows called with:', { sheet, ys });
      console.log('matrix', toValueObject(sheet));
    },
    onRemoveCols: ({ sheet, xs }) => {
      console.log('onRemoveCols called with:', { sheet, xs });
      console.log('matrix', toValueObject(sheet));
    },
  });

  const handleRemoveRows = () => {
    if (storeRef?.current == null) {
      return;
    }
    const { store, dispatch } = storeRef.current;
    // Remove 2nd row (index 2)
    applyers.removeRows({ store, dispatch });
  };

  const handleRemoveCols = () => {
    if (storeRef?.current == null) {
      return;
    }
    const { store, dispatch } = storeRef.current;
    // Remove 2nd column (index 2)
    applyers.removeCols({ store, dispatch });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
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
          Remove Row 2
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
          Remove Column 2
        </button>
      </div>

      <GridSheet
        storeRef={storeRef}
        book={book}
        initialCells={buildInitialCells({
          matrices: {
            A1: [
              ['Data1', 'Data2', 'Data3', 'Data4'],
              ['Data5', 'Data6', 'Data7', 'Data8'],
              ['Data9', 'Data10', 'Data11', 'Data12'],
            ],
          },
          cells: {
            default: {
              width: 80,
              height: 30,
            },
            A0: { label: 'Header1' },
            B0: { label: 'Header2' },
            C0: { label: 'Header3' },
            D0: { label: 'Header4' },
          },
          ensured: {
            numRows: 10,
            numCols: 10,
          },
        })}
        options={{
          sheetHeight: 300,
          sheetWidth: 400,
        }}
      />
    </div>
  );
};

export const Remove: StoryObj = {
  render: () => <RemoveComponent />,
  parameters: {
    docs: {
      description: {
        story: DESCRIPTION,
      },
    },
  },
};
