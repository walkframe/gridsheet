import React from "react";
import { Provider } from "react-redux";

import { MatrixType, OptionsType } from "../types";

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

export const GridSheet: React.FC<Props> = ({ data, options }) => {
  if (typeof data === "undefined") {
    data = [];
  }
  if (typeof options === "undefined") {
    options = {};
  }

  const { onChange, mode } = options;
  const clipboardRef = React.createRef<HTMLTextAreaElement>();
  return (
    <GridSheetLayout className={`react-grid-sheet ${mode || "light"}`}>
      <textarea className="clipboard" ref={clipboardRef} />
      <Provider store={store}>
        <GridTableWrapper clipboardRef={clipboardRef} />
        <StoreInitializer data={data} options={options} />
        <ContextMenu clipboardRef={clipboardRef} />
        {onChange && <ChangeEmitter onChange={onChange} />}
      </Provider>
    </GridSheetLayout>
  );
};
