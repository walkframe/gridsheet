import * as React from "react";
import {
  VariableSizeGrid as Grid,
  VariableSizeList as List,
} from "react-window";

import { MatrixType, OptionsType, StoreType } from "../types";
import { SHEET_HEIGHT, SHEET_WIDTH } from "../constants";
import { Context } from "../store";
import { reducer } from "../store/actions";

import { GridTableWrapper } from "./GridTableWrapper";

import { StoreInitializer } from "./StoreInitializer";

import { ChangeEmitter } from "./ChangeEmitter";
import { ContextMenu } from "./ContextMenu";
import { GridSheetLayout } from "./styles/GridSheetLayout";

type Props = {
  data: MatrixType;
  options?: OptionsType;
  className?: string;
  style?: React.CSSProperties;
};

export const GridSheet: React.FC<Props> = ({
  data,
  options,
  className,
  style,
}) => {
  if (typeof data === "undefined") {
    data = [];
  }
  if (typeof options === "undefined") {
    options = {};
  }

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
    searchInputRef,
    editorRef,
    gridOuterRef,
    gridRef,
    verticalHeadersRef,
    horizontalHeadersRef,
    matrix: [],
    cellsOption: {},
    choosing: [-1, -1],
    cutting: false,
    selectingZone: [-1, -1, -1, -1],
    copyingZone: [-1, -1, -1, -1],
    horizontalHeadersSelecting: false,
    verticalHeadersSelecting: false,
    editingCell: "",
    history: { index: -1, size: 0, operations: [] },
    editorRect: [0, 0, 0, 0],
    resizingRect: [-1, -1, -1, -1],
    sheetHeight: 0,
    sheetWidth: 0,
    headerHeight: 0,
    headerWidth: 0,
    entering: false,
    matchingCells: [],
    matchingCellIndex: 0,
    renderers: {},
    parsers: {},
    editingOnEnter: true,
    cellLabel: true,
    contextMenuPosition: [-1, -1],
  };

  const [store, dispatch] = React.useReducer(reducer, initialState);

  const [sheetHeight, setSheetHeight] = React.useState(
    options.sheetHeight || SHEET_HEIGHT
  );
  const [sheetWidth, setSheetWidth] = React.useState(
    options.sheetWidth || SHEET_WIDTH
  );
  React.useEffect(() => {
    setInterval(() => {
      if (sheetRef.current?.clientHeight) {
        setSheetHeight(sheetRef.current?.clientHeight);
      }
      if (sheetRef.current?.clientWidth) {
        setSheetWidth(sheetRef.current?.clientWidth);
      }
    }, 700);
  }, []);

  const { onChange, mode } = options;
  return (
    <GridSheetLayout
      ref={sheetRef}
      className={`react-grid-sheet ${mode || "light"} ${className || ""}`}
      style={{ ...style, resize, height: sheetHeight, width: sheetWidth }}
    >
      <Context.Provider value={{ store, dispatch }}>
        <GridTableWrapper />
        <StoreInitializer
          data={data}
          options={{ ...options, sheetHeight, sheetWidth }}
        />
        <ContextMenu />
        <ChangeEmitter onChange={onChange} />
      </Context.Provider>
    </GridSheetLayout>
  );
};
