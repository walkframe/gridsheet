import React from 'react';
import { Editor } from './Editor';
import { Cell } from './Cell';
import { HorizontalHeaderCell } from './HorizontalHeaderCell';
import { VerticalHeaderCell } from './VerticalHeaderCell';
import { SearchBox } from './SearchBox';

import { Context } from '../store';
import { choose, select, setEntering, updateTable } from '../store/actions';

import { Table } from '../lib/table';
import { TableRef, Virtualization } from '../types';
import { virtualize } from '../lib/virtualization';

type Props = {
  tableRef: React.MutableRefObject<TableRef | null> | undefined;
};

export const createTableRef = () => React.useRef<TableRef | null>(null);

export const Tabular = ({ tableRef }: Props) => {
  const { store, dispatch } = React.useContext(Context);
  const { sheetHeight, sheetWidth, table, tableInitialized, gridOuterRef, sheetRef } = store;

  React.useEffect(() => {
    if (tableRef && tableInitialized) {
      tableRef.current = {
        table,
        dispatch: (table) => {
          dispatch(updateTable(table as Table));
        },
      };
    }
  }, [table]);
  const [virtualized, setVirtualized] = React.useState<Virtualization | null>(null);
  React.useEffect(() => {
    setVirtualized(virtualize(table, gridOuterRef.current));
  }, [gridOuterRef.current, table, sheetRef.current?.clientHeight, sheetRef.current?.clientWidth]);

  return (
    <>
      <Editor />
      <SearchBox />
      <div
        className="gs-tabular"
        style={{
          width: sheetWidth,
          height: sheetHeight,
        }}
        ref={gridOuterRef}
        onMouseEnter={() => {
          dispatch(setEntering(true));
        }}
        onMouseLeave={() => {
          dispatch(setEntering(false));
        }}
        onScroll={(e) => {
          setVirtualized(virtualize(table, e.currentTarget));
        }}
      >
        <div
          className={'gs-tabular-inner'}
          style={{
            width: table.totalWidth,
            height: table.totalHeight,
          }}
        >
          <table
            className={`gs-table`}
            style={{
              width: table.totalWidth,
            }}
          >
            <thead className="gs-table-header">
              <tr>
                <th
                  className="gs-header gs-header-left gs-header-top gs-header-left-top"
                  style={{ position: 'sticky' }}
                  onClick={() => {
                    dispatch(choose({ y: -1, x: -1 }));
                    window.setTimeout(() => {
                      dispatch(choose({ y: 1, x: 1 }));
                      dispatch(
                        select({
                          startY: 1,
                          startX: 1,
                          endY: table.getNumRows(),
                          endX: table.getNumCols(),
                        }),
                      );
                    }, 100);
                  }}
                ></th>
                <th
                  className="gs-adjuster gs-adjuster-horizontal gs-adjuster-horizontal-left"
                  style={{ width: virtualized?.adjuster?.left }}
                ></th>
                {virtualized?.xs?.map?.((x) => <HorizontalHeaderCell x={x} key={x} />)}
                <th
                  className="gs-adjuster gs-adjuster-horizontal gs-adjuster-horizontal-right"
                  style={{ width: virtualized?.adjuster?.right }}
                ></th>
              </tr>
            </thead>
            <tbody className="gs-table-body-adjuster">
              <tr>
                <th
                  className="gs-header gs-header-left gs-adjuster"
                  style={{ height: virtualized?.adjuster?.top }}
                ></th>
                {virtualized?.xs?.map((x) => <td className="gs-adjuster" key={x} />)}
              </tr>
            </tbody>
            <tbody className="gs-table-body-data">
              {virtualized?.ys?.map((y) => {
                return (
                  <tr key={y}>
                    <VerticalHeaderCell y={y} />
                    <td className="gs-adjuster gs-adjuster-horizontal gs-adjuster-horizontal-left" />
                    {virtualized?.xs?.map((x) => <Cell key={x} y={y} x={x} />)}
                    <td className="gs-adjuster gs-adjuster-horizontal gs-adjuster-horizontal-right" />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
