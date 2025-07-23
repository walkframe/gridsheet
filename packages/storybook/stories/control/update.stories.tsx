import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  GridSheet,
  buildInitialCells,
  useConnector,
  HistoryType,
  Table,
  createHub,
  UserTable,
} from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Control/Update',
};
export default meta;

const hub = createHub({
  onInsertRows: ({ table, y, numRows }) => {
    console.log('onInsertRows called with:', { table, y, numRows });
    console.log('Inserted data:', table.getFieldObject());
  },
  onInsertCols: ({ table, x, numCols }) => {
    console.log('onInsertCols called with:', { table, x, numCols });
    console.log('Inserted data:', table.getFieldObject());
  },
});

const UpdateComponent: React.FC = () => {
  const connector = useConnector();
  const [json, setJson] = React.useState(`
  {
    "A5": {"value": "test"}
  }`);

  const update = () => {
    if (connector.current) {
      const { tableManager } = connector.current;
      const { table, sync } = tableManager;
      const diff = JSON.parse(json);
      console.log(diff);
      sync(table.update({ diff }));
    }
  };

  return (
    <>
      <textarea
        placeholder="Input JSON"
        rows={10}
        cols={100}
        value={json}
        onChange={(e) => setJson(e.target.value)}
      ></textarea>
      <br />
      <button onClick={update}>Update!</button>
      <GridSheet
        connector={connector}
        initialCells={buildInitialCells({
          cells: {},
          ensured: {
            numRows: 10,
            numCols: 10,
          },
        })}
      />
    </>
  );
};

export const Update: StoryObj = {
  render: () => <UpdateComponent />,
  parameters: {
    docs: {
      description: {
        story: 'This demo shows how to update cell values programmatically using JSON input.',
      },
    },
  },
};

const InsertRowsAndUpdateComponent: React.FC = () => {
  const connector = useConnector();

  const add = () => {
    if (connector.current) {
      const { tableManager } = connector.current;
      const { table, sync } = tableManager;
      sync(
        table.insertRows({
          y: 5,
          numRows: 1,
          baseY: 5,
          diff: {
            C5: { value: 'added', style: { textDecoration: 'underline' } },
          },
        }),
      );
    }
  };

  return (
    <>
      <br />
      <button onClick={add}>Insert Rows and Update!</button>
      <GridSheet
        hub={hub}
        connector={connector}
        initialCells={buildInitialCells({
          cells: {
            B: { style: { color: '#F00' } },
            B7: { value: 'test1' },
            C8: { value: 'test2' },
            5: { style: { backgroundColor: '#077', color: '#fff' } },
          },
          ensured: {
            numRows: 10,
            numCols: 10,
          },
        })}
      />
    </>
  );
};

export const InsertRowsAndUpdate: StoryObj = {
  render: () => <InsertRowsAndUpdateComponent />,
  parameters: {
    docs: {
      description: {
        story: 'This demo shows how to insert rows and update cells in a single operation.',
      },
    },
  },
};

const InsertColsAndUpdateComponent: React.FC = () => {
  const connector = useConnector();

  const add = () => {
    if (connector.current) {
      const { tableManager } = connector.current;
      const { table, sync } = tableManager;
      sync(
        table.insertCols({
          x: 4,
          numCols: 1,
          baseX: 4,
          diff: {
            D4: { value: 'added' },
          },
        }),
      );
    }
  };

  return (
    <>
      <br />
      <button onClick={add}>Insert Columns and Update!</button>
      <GridSheet
        hub={hub}
        connector={connector}
        initialCells={buildInitialCells({
          cells: {
            B: { style: { color: '#F00' } },
            B7: { value: 'test1' },
            C8: { value: 'test2' },
            D: { style: { backgroundColor: '#077', color: '#fff' } },
          },
          ensured: {
            numRows: 10,
            numCols: 10,
          },
        })}
      />
    </>
  );
};

export const InsertColsAndUpdate: StoryObj = {
  render: () => <InsertColsAndUpdateComponent />,
  parameters: {
    docs: {
      description: {
        story: 'This demo shows how to insert columns and update cells in a single operation.',
      },
    },
  },
};
