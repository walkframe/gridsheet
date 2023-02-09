import React from "react";
import {
  VariableSizeGrid as Grid,
  VariableSizeList as List,
} from "react-window";
import { useVirtualizer, useWindowVirtualizer } from '@tanstack/react-virtual';
import { useVirtual } from 'react-virtual'

import { Editor } from "./Editor";
import { Cell } from "./Cell";
import { HorizontalHeaderCell } from "./HorizontalHeaderCell";
import { VerticalHeaderCell } from "./VerticalHeaderCell";
import { SearchBox } from "./SearchBox";

import { Context } from "../store";
import { choose, select, setEntering, updateTable } from "../store/actions";

import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "../constants";
import { Table } from "../lib/table";
import { TableRef } from "../types";

type Props = {
  tableRef?: React.MutableRefObject<TableRef | null>;
};

export const createTableRef = () => React.useRef<TableRef>(null);

export const GridTable = ({ tableRef }: Props) => {
  const { store, dispatch } = React.useContext(Context);

  const {
    gridRef,
    gridOuterRef,
    verticalHeadersRef,
    horizontalHeadersRef,
    sheetHeight,
    sheetWidth,
    headerHeight,
    headerWidth,
    table,
    tableInitialized,
  } = store;

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

  const parentRef = React.useRef(document.createElement('div'));
  const parentOffsetRef = React.useRef(0);
  const rowVirtual = useWindowVirtualizer({
    count: table.getNumRows(),
    scrollMargin: parentOffsetRef.current,
    estimateSize: (y) => table.getByPoint({ y: y + 1, x: 0 })?.height || DEFAULT_HEIGHT,
    horizontal: false,
    //getScrollElement: () => parentRef.current,
    //rangeExtractor: (range) => {
    //  return [...Array(range.endIndex+10).keys()];
    //},
    scrollToFn: (offset, options, instance) => {
      console.log({offset, options, instance});
    },
    scrollingDelay: 0,
    overscan: 10,

    //paddingStart: 100,
    //paddingEnd: 100,
  })
  const columnVirtual = useVirtualizer({
    count: table.getNumCols(),
    estimateSize: (x) => table.getByPoint({ y: 0, x: x + 1 })?.width || DEFAULT_WIDTH,
    horizontal: true,
    getScrollElement: () => parentRef.current,
    overscan: 10,
  });

  if (table.getNumRows() === 0) {
    return null;
  }
  console.log("DEBUG", table.getNumRows(), table.getNumCols())

  return (
    <>
      <Editor />
      <SearchBox />
      <div
        className="gs-tabular"
        style={{
          overflow: "auto",
          display: 'block',
          width: sheetWidth,
          height: sheetHeight,
        }}
        ref={parentRef}
        onMouseEnter={() => {
          dispatch(setEntering(true));
        }}
        onMouseLeave={() => {
          dispatch(setEntering(false));
        }}
      >
        <div
          style={{
            width: columnVirtual.getTotalSize(),
            height: rowVirtual.getTotalSize()
          }}
        >
        <table style={{borderCollapse: 'collapse'}}>
          <thead>
            <tr style={{height: headerHeight}}>
              <th
                style={{width: headerWidth, position: "sticky", top: 0, left: 0, zIndex: 2}}
                onClick={() => {
                  dispatch(choose({ y: -1, x: -1 }));
                  setTimeout(() => {
                    dispatch(choose({ y: 1, x: 1 }));
                    dispatch(
                      select({
                        startY: 1,
                        startX: 1,
                        endY: table.getNumRows(),
                        endX: table.getNumCols(),
                      })
                    );
                  }, 100);
                }}
              ></th>
              {
              columnVirtual.getVirtualItems().map((virtualCol) => {
                return <HorizontalHeaderCell
                  index={virtualCol.index}
                  key={virtualCol.index}
                  style={{
                    overflow: 'hidden',
                  }} />
              })
            }</tr>
          </thead>
          <tbody>
        {
          rowVirtual.getVirtualItems().map((virtualRow) => {
            return (<tr key={virtualRow.index}>
              <VerticalHeaderCell index={virtualRow.index} style={{}} />
              {
                columnVirtual.getVirtualItems().map((virtualCol) => {
                return <Cell
                  key={virtualCol.index}
                  rowIndex={virtualRow.index}
                  columnIndex={virtualCol.index}
                  style={{}}
                />
              })
            }</tr>);
          })
        }
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
};
