import * as React from "react";
import { Provider } from "react-redux";
import {
  VariableSizeGrid as Grid,
  VariableSizeList as List,
} from "react-window";

import { MatrixType, OptionsType, StoreType, ActionType } from "../types";
import { SHEET_HEIGHT, SHEET_WIDTH } from "../constants";
import { createStore } from "../store";

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

export const Context = React.createContext({} as StoreType);

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

  const [store] = React.useState(createStore());

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
  };

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
      <Provider store={store}>
        <Context.Provider value={initialState}>
          <GridTableWrapper />
          <StoreInitializer
            data={data}
            options={{ ...options, sheetHeight, sheetWidth }}
          />
          <ContextMenu />
          <ChangeEmitter onChange={onChange} />
        </Context.Provider>
      </Provider>
    </GridSheetLayout>
  );
};
