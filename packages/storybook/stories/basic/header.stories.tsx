import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { buildInitialCells, createConnector, GridSheet, updateTable, useConnector } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Basic/Header',
};
export default meta;

const DESCRIPTION = [
  'This demo showcases how to customize header height and width in GridSheet.',
  'It demonstrates dynamic header sizing with interactive controls.',
].join('\n\n');

const connector = createConnector();

const HeaderSheet = () => {
  const [headerHeight, setHeaderHeight] = useState(40);
  const [headerWidth, setHeaderWidth] = useState(60);

  useEffect(() => {
    if (connector.current) {
      const { tableManager } = connector.current;
      const { table, sync } = tableManager;
      sync(table.setHeaderHeight(headerHeight));
    }
  }, [headerHeight]);

  useEffect(() => {
    if (connector.current) {
      const { tableManager } = connector.current;
      const { table, sync } = tableManager;
      sync(table.setHeaderWidth(headerWidth));
    }
  }, [headerWidth]);

  const handleSetHeaderHeight = () => {
    if (connector.current) {
      const { tableManager } = connector.current;
      const { table, sync } = tableManager;
      sync(table.setHeaderHeight(60));
    }
  };

  const handleSetHeaderWidth = () => {
    if (connector.current) {
      const { tableManager } = connector.current;
      const { table, sync } = tableManager;
      sync(table.setHeaderWidth(80));
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        Header height:{' '}
        <input
          name="header-height"
          type="number"
          step={10}
          value={headerHeight}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value) && value > 0) {
              setHeaderHeight(value);
            }
          }}
          style={{ width: '80px', marginRight: '20px' }}
        />
        <br />
        Header width:{' '}
        <input
          name="header-width"
          type="number"
          step={10}
          value={headerWidth}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value) && value > 0) {
              setHeaderWidth(value);
            }
          }}
          style={{ width: '80px' }}
        />
      </div>

      <GridSheet
        connector={connector}
        initialCells={buildInitialCells({
          matrices: {
            A1: [
              ['A1', 'B1', 'C1', 'D1', 'E1'],
              ['A2', 'B2', 'C2', 'D2', 'E2'],
              ['A3', 'B3', 'C3', 'D3', 'E3'],
              ['A4', 'B4', 'C4', 'D4', 'E4'],
              ['A5', 'B5', 'C5', 'D5', 'E5'],
            ],
          },
          ensured: { numRows: 10, numCols: 8 },
        })}
        options={{}}
      />
    </div>
  );
};

export const Header: StoryObj = {
  render: () => <HeaderSheet />,
};
