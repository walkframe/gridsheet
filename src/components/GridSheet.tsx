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
import { reducer } from "../store/actions";

import { StoreInitializer } from "./StoreInitializer";
import { Resizer } from "./Resizer";
import { Emitter } from "./Emitter";
import { ContextMenu } from "./ContextMenu";
import { Table } from "../lib/table";
import { Tabular } from "./Tabular";
import { getMaxSizesFromCells } from "../lib/structs";
import { x2c, y2r } from "../lib/converters";
import {useEffect} from "react";
import {embedStyle} from "../styles/embedder";

export const GridSheet: React.FC<Props> = ({
  initial,
  tableRef,
  options = {},
  className,
  style,
  additionalFunctions = {},
}) => {
  const { sheetResize: resize = "both" } = options;
  useEffect(() => {
    embedStyle();
  }, []);
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

  const [store, dispatch] = React.useReducer(reducer, initialState);

  const [sheetHeight, setSheetHeight] = React.useState(
    options.sheetHeight || estimateSheetHeight({ options, initial })
  );
  const [sheetWidth, setSheetWidth] = React.useState(
    options.sheetWidth || estimateSheetWidth({ options, initial })
  );
  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (sheetRef.current?.clientHeight) {
        setSheetHeight(sheetRef.current?.clientHeight);
      }
      if (sheetRef.current?.clientWidth) {
        setSheetWidth(sheetRef.current?.clientWidth);
      }
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const { onChange, onSelect, mode } = options;
  return (
    <Context.Provider value={{ store, dispatch }}>
      <div
        ref={sheetRef}
        className={`gridsheet-1 ${mode || "light"} ${className || ""}`}
        style={{
          ...style, resize,
          height: sheetHeight,
          width: sheetWidth,
          maxWidth: store.table.totalWidth + 3,
          maxHeight: store.table.totalHeight + 3,
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
  return estimatedHeight - 1;
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
  return estimatedWidth - 1;
};
