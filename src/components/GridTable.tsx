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
import { choose, select, setEntering } from "../store/actions";

import { GridTableLayout } from "./styles/GridTableLayout";

import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "../constants";

type Props = {
};

export const GridTable: React.FC<Props> = ({}) => {
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
  } = store;

  if (table.numRows() === 0) {
    return null;
  }

  const sheetInnerHeight = sheetHeight - headerHeight;
  const sheetInnerWidth = sheetWidth - headerWidth;

  return (
    <GridTableLayout>
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
              dispatch(choose([-1, -1]));
              setTimeout(() => {
                dispatch(choose([1, 1]));
                dispatch(select([1, 1, table.numRows(), table.numCols()]));
              }, 100);
            }}
          ></div>
          <div className="gs-tabular-col">
            <List
              ref={horizontalHeadersRef}
              itemCount={table.numCols() || 0}
              itemSize={(x) => table.get(0, x + 1)?.width || DEFAULT_WIDTH}
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
              itemCount={table.numRows() || 0}
              itemSize={(y) => table.get(y + 1, 0)?.height || DEFAULT_HEIGHT}
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
              columnCount={table.numCols() || 0}
              rowCount={table.numRows() || 0}
              width={sheetWidth - headerWidth}
              height={sheetHeight - headerHeight}
              columnWidth={(x) => table.get(0, x + 1)?.width || DEFAULT_WIDTH}
              rowHeight={(y) => table.get(y + 1, 0)?.height || DEFAULT_HEIGHT}
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
    </GridTableLayout>
  );
};
