import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { GridSheet, constructInitialCells, createTableRef, HistoryType } from '@gridsheet/react-core';

type Props = {
  x: number;
  y: number;
  value: string;
};

const Sheet = ({ x, y, value }: Props) => {
  const tableRef = createTableRef();
  React.useEffect(() => {
    if (tableRef?.current == null) {
      return;
    }
    const { table, dispatch } = tableRef.current;
    dispatch(table.write({ point: { y, x }, value }));
  }, [x, y, value, tableRef]);

  return (
    <>
      <GridSheet
        tableRef={tableRef}
        initialCells={constructInitialCells({
          cells: {},
          ensured: {
            numRows: 50,
            numCols: 50,
          },
        })}
        options={{
          onKeyUp: (e, points) => {
            console.log('onKeyUp', e.currentTarget.value, points.pointing);
          },
          onInit: (table) => {
            console.debug('onInit', table);
          },
        }}
      />
    </>
  );
};

export const Write: StoryObj<typeof Sheet> = {
  args: { x: 1, y: 1, value: 'something' },
};

export default {
  title: 'Table operations',
  component: Sheet,
};
