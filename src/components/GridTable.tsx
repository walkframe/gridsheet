import React from "react";
import {
  VariableSizeGrid as Grid,
  VariableSizeList as List,
} from "react-window";

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

  if (table.getNumRows() === 0) {
    return null;
  }

  const sheetInnerHeight = sheetHeight - headerHeight;
  const sheetInnerWidth = sheetWidth - headerWidth;

  return (
    <>
      <Editor />
      <SearchBox />
      <div
        className="gs-tabular"
        onMouseEnter={() => {
          dispatch(setEntering(true));
        }}
        onMouseLeave={() => {
          dispatch(setEntering(false));
        }}
      >
        <div className="gs-tabular-row">
          <div
            className="gs-tabular-col"
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
          ></div>
          <div className="gs-tabular-col">
            <List
              ref={horizontalHeadersRef}
              itemCount={table.getNumCols() || 0}
              itemSize={(x) =>
                table.getByPoint({ y: 0, x: x + 1 })?.width || DEFAULT_WIDTH
              }
              layout="horizontal"
              width={gridOuterRef.current?.clientWidth || sheetInnerWidth}
              height={headerHeight}
              style={{
                overflow: "hidden",
              }}
            >
              {HorizontalHeaderCell}
            </List>
          </div>
        </div>
        <div className="gs-tabular-row">
          <div className="gs-tabular-col" style={{ verticalAlign: "top" }}>
            <List
              ref={verticalHeadersRef}
              itemCount={table.getNumRows() || 0}
              itemSize={(y) =>
                table.getByPoint({ y: y + 1, x: 0 })?.height || DEFAULT_HEIGHT
              }
              height={gridOuterRef.current?.clientHeight || sheetInnerHeight}
              width={headerWidth}
              style={{ overflow: "hidden" }}
            >
              {VerticalHeaderCell}
            </List>
          </div>
          <div className="gs-tabular-col">
            <Grid
              ref={gridRef}
              outerRef={gridOuterRef}
              columnCount={table.getNumCols() || 0}
              rowCount={table.getNumRows() || 0}
              width={sheetWidth - headerWidth}
              height={sheetHeight - headerHeight}
              columnWidth={(x) =>
                table.getByPoint({ y: 0, x: x + 1 })?.width || DEFAULT_WIDTH
              }
              rowHeight={(y) =>
                table.getByPoint({ y: y + 1, x: 0 })?.height || DEFAULT_HEIGHT
              }
              onScroll={(e) => {
                verticalHeadersRef.current?.scrollTo(e.scrollTop);
                horizontalHeadersRef.current?.scrollTo(e.scrollLeft);
              }}
            >
              {Cell}
            </Grid>
          </div>
        </div>
      </div>
    </>
  );
};
