import React from 'react';

import { GridSheet, constructInitialCells, createTableRef, HistoryType } from '@gridsheet/react-core';

export default {
  title: 'Table operations',
};

export const Update = () => {
  const tableRef = createTableRef();
  const [json, setJson] = React.useState(`
  {
    "A5": {"value": "test"}
  }`);

  const update = () => {
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
        initialCells={constructInitialCells({
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

export const AddRowsAndUpdate = () => {
  const tableRef = createTableRef();

  const add = () => {
    if (tableRef.current) {
      const { table, dispatch } = tableRef.current;
      dispatch(
        table.addRowsAndUpdate({
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
      <button onClick={add}>Add!</button>
      <GridSheet
        tableRef={tableRef}
        initialCells={constructInitialCells({
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

export const AddColsAndUpdate = () => {
  const tableRef = createTableRef();

  const add = () => {
    if (tableRef.current) {
      const { table, dispatch } = tableRef.current;
      dispatch(
        table.addColsAndUpdate({
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
      <button onClick={add}>Add!</button>
      <GridSheet
        tableRef={tableRef}
        initialCells={constructInitialCells({
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
