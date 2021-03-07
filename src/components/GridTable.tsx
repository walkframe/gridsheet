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

import { x2c, y2r } from "../api/converters";

import { Context } from "../store";
import { choose, select, setEntering } from "../store/actions";

import { GridTableLayout } from "./styles/GridTableLayout";

import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "../constants";

type Props = {
  numRows: number;
  numCols: number;
};

export const GridTable: React.FC<Props> = ({ numRows, numCols }) => {
  const { store, dispatch } = React.useContext(Context);

  const {
    gridRef,
    gridOuterRef,
    verticalHeadersRef,
    horizontalHeadersRef,
    cellsOption,
    sheetHeight,
    sheetWidth,
    headerHeight,
    headerWidth,
  } = store;

  const defaultHeight = cellsOption.default?.height || DEFAULT_HEIGHT;
  const defaultWidth = cellsOption.default?.width || DEFAULT_WIDTH;

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
                dispatch(choose([0, 0]));
                dispatch(select([0, 0, numRows - 1, numCols - 1]));
              }, 100);
            }}
          ></div>
          <div className="gs-tabular-col">
            <List
              ref={horizontalHeadersRef}
              itemCount={numCols || 0}
              itemSize={(x) => cellsOption[x2c(x)]?.width || defaultWidth}
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
              itemCount={numRows || 0}
              itemSize={(y) => cellsOption[y2r(y)]?.height || defaultHeight}
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
              columnCount={numCols || 0}
              rowCount={numRows || 0}
              width={sheetWidth - headerWidth}
              height={sheetHeight - headerHeight}
              columnWidth={(x) => cellsOption[x2c(x)]?.width || defaultWidth}
              rowHeight={(y) => cellsOption[y2r(y)]?.height || defaultHeight}
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
