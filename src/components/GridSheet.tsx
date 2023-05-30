import * as React from "react";

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
import { reducer as defaultReducer } from "../store/actions";

import { StoreInitializer } from "./StoreInitializer";
import { Resizer } from "./Resizer";
import { Emitter } from "./Emitter";
import { ContextMenu } from "./ContextMenu";
import { Table } from "../lib/table";
import { Tabular } from "./Tabular";
import { getMaxSizesFromCells } from "../lib/structs";
import { x2c, y2r } from "../lib/converters";
import {Reducer, ReducerWithoutAction, useEffect} from "react";
import {embedStyle} from "../styles/embedder";

export const GridSheet: React.FC<Props> = ({
  initial,
  tableRef,
  options = {},
  className,
  style,
  additionalFunctions = {},
}) => {
  const { sheetResize } = options;
  useEffect(() => {
    embedStyle();
  }, []);
  const sheetRef = React.useRef<HTMLDivElement | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const editorRef = React.useRef<HTMLTextAreaElement | null>(null);
  const gridOuterRef = React.useRef<HTMLDivElement | null>(null);
  const initialState: StoreType = {
    table: new Table({}), // temporary (see StoreInitializer for detail)
    tableInitialized: false,
    sheetRef,
    searchInputRef,
    editorRef,
    gridOuterRef,
    choosing: { y: -1, x: -1 },
    cutting: false,
    selectingZone: { startY: -1, startX: -1, endY: -1, endX: -1 },
    copyingZone: { startY: -1, startX: -1, endY: -1, endX: -1 },
    autofillDraggingTo: null,
    headerTopSelecting: false,
    headerLeftSelecting: false,
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
    showAddress: true,
    contextMenuPosition: { y: -1, x: -1 },
    resizingPositionY: [-1, -1, -1],
    resizingPositionX: [-1, -1, -1],
    minNumRows: 1,
    maxNumRows: -1,
    minNumCols: 1,
    maxNumCols: -1,
  };

  const [store, dispatch] = React.useReducer(defaultReducer as ReducerWithoutAction<StoreType>, initialState, () => initialState);

  const [sheetHeight, setSheetHeight] = React.useState(
    options?.sheetHeight || estimateSheetHeight({ options, initial })
  );
  const [sheetWidth, setSheetWidth] = React.useState(
    options?.sheetWidth || estimateSheetWidth({ options, initial })
  );
  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (sheetRef.current?.clientHeight) {
        setSheetHeight(sheetRef.current?.clientHeight || 0);
      }
      if (sheetRef.current?.clientWidth) {
        setSheetWidth(sheetRef.current?.clientWidth || 0);
      }
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const { onChange, onSelect, mode } = options;
  return (
    <Context.Provider value={{ store, dispatch }}>
      <div
        ref={sheetRef}
        className={`gridsheet-1 ${mode || "light"} ${className || ""} ${
          sheetWidth > store.table.totalWidth ? 'gs-table-width-smaller' : 'gs-table-width-larger'} ${
          sheetHeight > store.table.totalHeight ? 'gs-table-height-smaller' : 'gs-table-height-larger'
        }`}
        style={{
          maxWidth: store.table.totalWidth + 3,
          maxHeight: store.table.totalHeight + 3,
          ...style, resize: sheetResize,
          height: sheetHeight,
          width: sheetWidth,
        }}
      >
        <Tabular
          tableRef={tableRef}
        />
        <StoreInitializer
          initial={initial}
          options={{ ...options, sheetHeight, sheetWidth }}
          additionalFunctions={additionalFunctions}
        />
        <ContextMenu />
        <Resizer />
        <Emitter onChange={onChange} onSelect={onSelect} />
      </div>
    </Context.Provider>

  );
};

type EstimateProps = {
  initial: CellsByAddressType;
  options: OptionsType;
};

const estimateSheetHeight = ({ initial, options }: EstimateProps) => {
  const auto = getMaxSizesFromCells(initial);
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
  return estimatedHeight + 3;
};

const estimateSheetWidth = ({ initial, options }: EstimateProps) => {
  const auto = getMaxSizesFromCells(initial);
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
  return estimatedWidth + 3;
};
