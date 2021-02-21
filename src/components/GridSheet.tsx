import * as React from "react";
import { Provider } from "react-redux";
import {
  VariableSizeGrid as Grid,
  VariableSizeList as List,
} from "react-window";

import { MatrixType, OptionsType, StoreType, ActionType } from "../types";

import { createStore } from "../store";

import { GridTableWrapper } from "./GridTableWrapper";

import { StoreInitializer } from "./StoreInitializer";

import { ChangeEmitter } from "./ChangeEmitter";
import { ContextMenu } from "./ContextMenu";
import { GridSheetLayout } from "./styles/GridSheetLayout";

type Props = {
  data: MatrixType;
  options?: OptionsType;
};

export const Context = React.createContext({} as StoreType);

export const GridSheet: React.FC<Props> = ({ data, options }) => {
  if (typeof data === "undefined") {
    data = [];
  }
  if (typeof options === "undefined") {
    options = {};
  }

  const [store] = React.useState(createStore());

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

  const { onChange, mode } = options;
  return (
    <GridSheetLayout className={`react-grid-sheet ${mode || "light"}`}>
      <Provider store={store}>
        <Context.Provider value={initialState}>
          <GridTableWrapper />
          <StoreInitializer data={data} options={options} />
          <ContextMenu />
          <ChangeEmitter onChange={onChange} />
        </Context.Provider>
      </Provider>
    </GridSheetLayout>
  );
};
