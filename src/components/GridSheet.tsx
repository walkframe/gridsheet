import * as React from "react";
import {
  VariableSizeGrid as Grid,
  VariableSizeList as List,
} from "react-window";

import { CellsByAddressType, OptionsType, Props, StoreType } from "../types";
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  HEADER_HEIGHT,
  HEADER_WIDTH,
  SHEET_HEIGHT,
  SHEET_WIDTH,
} from "../constants";
import { Context } from "../store";
import { reducer } from "../store/actions";

import { StoreInitializer } from "./StoreInitializer";
import { Resizer } from "./Resizer";

import { Emitter } from "./Emitter";
import { ContextMenu } from "./ContextMenu";
import { GridSheetLayout } from "./styles/GridSheetLayout";
import { Table } from "../api/table";
import { GridTable } from "./GridTable";
import { getMaxSizeFromCells } from "../api/structs";
import { x2c, y2r } from "../api/converters";

export const GridSheet: React.FC<Props> = ({
  initial,
  tableRef,
  options = {},
  className,
  style,
  additionalFunctions = {},
}) => {
  const { sheetResize: resize = "both" } = options;
  const sheetRef = React.useRef<HTMLDivElement>(document.createElement("div"));
  const searchInputRef = React.useRef<HTMLInputElement>(
    document.createElement("input")
  );
  const editorRef = React.useRef<HTMLTextAreaElement>(
    document.createElement("textarea")
  );
  const gridOuterRef = React.useRef<HTMLDivElement>(
    document.createElement("div")
  );
  const gridRef = React.useRef<Grid>(null);
  const verticalHeadersRef = React.useRef<List>(null);
  const horizontalHeadersRef = React.useRef<List>(null);
  const initialState: StoreType = {
    table: new Table({}), // temporary (see StoreInitializer for detail)
    tableInitialized: false,
    sheetRef,
    searchInputRef,
    editorRef,
    gridOuterRef,
    gridRef,
    verticalHeadersRef,
    horizontalHeadersRef,
    choosing: { y: -1, x: -1 },
    cutting: false,
    selectingZone: { startY: -1, startX: -1, endY: -1, endX: -1 },
    copyingZone: { startY: -1, startX: -1, endY: -1, endX: -1 },
    horizontalHeadersSelecting: false,
    verticalHeadersSelecting: false,
    editingCell: "",
    editorRect: { y: 0, x: 0, height: 0, width: 0 },
    resizingRect: { y: -1, x: -1, height: -1, width: -1 },
    sheetHeight: 0,
    sheetWidth: 0,
    headerHeight: 0,
    headerWidth: 0,
    entering: false,
    matchingCells: [],
    matchingCellIndex: 0,
    editingOnEnter: true,
    cellLabel: true,
    contextMenuPosition: { y: -1, x: -1 },
    resizingPositionY: [-1, -1, -1],
    resizingPositionX: [-1, -1, -1],
    minNumRows: 1,
    maxNumRows: -1,
    minNumCols: 1,
    maxNumCols: -1,
  };

  const [store, dispatch] = React.useReducer(reducer, initialState);

  const [sheetHeight, setSheetHeight] = React.useState(
    options.sheetHeight || estimateSheetHeight(options, initial)
  );
  const [sheetWidth, setSheetWidth] = React.useState(
    options.sheetWidth || estimateSheetWidth(options, initial)
  );
  React.useEffect(() => {
    setInterval(() => {
      if (sheetRef.current?.clientHeight) {
        setSheetHeight(sheetRef.current?.clientHeight);
      }
      if (sheetRef.current?.clientWidth) {
        setSheetWidth(sheetRef.current?.clientWidth);
      }
    }, 1000);
  }, []);

  const { onChange, onSelect, mode } = options;
  return (
    <GridSheetLayout
      ref={sheetRef}
      className={`react-grid-sheet ${mode || "light"} ${className || ""}`}
      style={{ ...style, resize, height: sheetHeight, width: sheetWidth }}
    >
      <Context.Provider value={{ store, dispatch }}>
        <GridTable tableRef={tableRef} />
        <StoreInitializer
          initial={initial}
          options={{ ...options, sheetHeight, sheetWidth }}
          additionalFunctions={additionalFunctions}
        />
        <ContextMenu />
        <Resizer />
        <Emitter onChange={onChange} onSelect={onSelect} />
      </Context.Provider>
    </GridSheetLayout>
  );
};

const estimateSheetHeight = (
  options: OptionsType,
  initial?: CellsByAddressType
) => {
  const auto = getMaxSizeFromCells(options.numRows, options.numCols, initial);
  let estimatedHeight = options.headerHeight || HEADER_HEIGHT;
  for (let y = 0; y < auto.numRows; y++) {
    const row = y2r(y);
    const height =
      initial?.[row]?.height || initial?.default?.height || DEFAULT_HEIGHT;
    if (estimatedHeight + height > SHEET_HEIGHT) {
      return SHEET_HEIGHT;
    }
    estimatedHeight += height;
  }
  return estimatedHeight - 1;
};

const estimateSheetWidth = (
  options: OptionsType,
  initial?: CellsByAddressType
) => {
  const auto = getMaxSizeFromCells(options.numRows, options.numCols, initial);
  let estimatedWidth = options.headerWidth || HEADER_WIDTH;
  for (let x = 0; x < auto.numCols; x++) {
    const col = x2c(x);
    const width =
      initial?.[col]?.width || initial?.default?.width || DEFAULT_WIDTH;
    if (estimatedWidth + width > SHEET_WIDTH) {
      return SHEET_WIDTH;
    }
    estimatedWidth += width;
  }
  return estimatedWidth - 1;
};
