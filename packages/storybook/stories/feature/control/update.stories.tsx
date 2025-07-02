import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GridSheet, buildInitialCells, useTableRef, HistoryType, Table } from '@gridsheet/react-core';

const meta: Meta = {
  title: 'Feature/Control/Update',
  tags: ['autodocs'],
};
export default meta;

const DESCRIPTION = [
  '## Example',
  'This demo showcases programmatic updates to GridSheet data.',
  'It demonstrates how to update cell values and styles through the table API.',
  'The demo includes various update operations like direct updates, row insertion with updates, and column insertion with updates.',
  
  '## How it works',
  'Programmatic updates allow you to modify grid data from external sources or user interactions.',
  '1. Use tableRef to access the table instance and dispatch function.',
  '2. Direct updates modify existing cells with new values and styles.',
  '3. Insert operations can be combined with updates to add new data.',
  '4. Updates are applied through the dispatch function to maintain consistency.',

].join('\n\n');

export const Update: StoryObj = {
  render: () => {
    const tableRef = useTableRef();
    const [json, setJson] = React.useState(`
  {
    "A5": {"value": "test"}
  }`);

    const update = () => {
      console.log('update', tableRef.current);
      if (tableRef.current) {
        const { table, dispatch } = tableRef.current;
        const diff = JSON.parse(json);
        console.log(diff);
        dispatch(table.update({ diff }));
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
          tableRef={tableRef}
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
  },
  parameters: {
    docs: {
      description: {
        story: 'This demo shows how to update cell values programmatically using JSON input.',
      },
    },
  },
};

export const InsertRowsAndUpdate: StoryObj = {
  render: () => {
    const tableRef = useTableRef();

    const add = () => {
      if (tableRef.current) {
        const { table, dispatch } = tableRef.current;
        dispatch(
          table.insertRowsAndUpdate({
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
          tableRef={tableRef}
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
  },
  parameters: {
    docs: {
      description: {
        story: 'This demo shows how to insert rows and update cells in a single operation.',
      },
    },
  },
};

export const InsertColsAndUpdate: StoryObj = {
  render: () => {
    const tableRef = useTableRef();

    const add = () => {
      if (tableRef.current) {
        const { table, dispatch } = tableRef.current;
        dispatch(
          table.insertColsAndUpdate({
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
          tableRef={tableRef}
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
  },
  parameters: {
    docs: {
      description: {
        story: 'This demo shows how to insert columns and update cells in a single operation.',
      },
    },
  },
};
