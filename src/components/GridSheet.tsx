import * as React from "react";
import { Provider } from "react-redux";
import {
  VariableSizeGrid as Grid,
  VariableSizeList as List,
} from "react-window";

import { MatrixType, OptionsType, StoreType, ActionType } from "../types";

import { store } from "../store";

import { GridTableWrapper } from "./GridTableWrapper";

import { StoreInitializer } from "./StoreInitializer";

import { ChangeEmitter } from "./ChangeEmitter";
import { ContextMenu } from "./ContextMenu";
import { GridSheetLayout } from "./styles/GridSheetLayout";

type Props = {
  data: MatrixType;
  options?: OptionsType;
};

type ContextType = {
  state: StoreType;
  dispatch: React.Dispatch<ActionType>;
};

export const Context = React.createContext({} as StoreType);

export const GridSheet: React.FC<Props> = ({ data, options }) => {
  if (typeof data === "undefined") {
    data = [];
  }
  if (typeof options === "undefined") {
    options = {};
  }

  const clipboardRef = React.createRef<HTMLTextAreaElement>();
  const editorRef = React.createRef<HTMLTextAreaElement>();
  const gridRef = React.createRef<Grid>();
  const cellRef = React.createRef<HTMLDivElement>();
  const verticalHeadersRef = React.createRef<List>();
  const horizontalHeadersRef = React.createRef<List>();
  const initialState: StoreType = {
    editorRef,
    gridRef,
    cellRef,
    verticalHeadersRef,
    horizontalHeadersRef,
  };

  const { onChange, mode } = options;
  return (
    <GridSheetLayout className={`react-grid-sheet ${mode || "light"}`}>
      <Context.Provider value={initialState}>
        <textarea className="clipboard" ref={clipboardRef} />
        <Provider store={store}>
          <GridTableWrapper clipboardRef={clipboardRef} />
          <StoreInitializer data={data} options={options} />
          <ContextMenu clipboardRef={clipboardRef} />
          {onChange && <ChangeEmitter onChange={onChange} />}
        </Provider>
      </Context.Provider>
    </GridSheetLayout>
  );
};
