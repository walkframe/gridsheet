import React from "react";
import { Provider } from 'react-redux';

import {
  MatrixType,
  OptionsType,
} from "../types";

import { store } from "../store";

import {
  GridTable,
} from "./GridTable";

import {
  StoreInitializer,
} from "./StoreInitializer";

import {
  ChangeEmitter,
} from "./ChangeEmitter";
import {
  GridSheetLayout,
} from "./styles/GridSheetLayout";

type Props = {
  data: MatrixType;
  options?: OptionsType;
};

export const GridSheet: React.FC<Props> = ({data, options}) => {
  if (typeof data === "undefined") {
    data = [];
  }
  if (typeof options === "undefined") {
    options = {};
  }

  const { onChange, mode } = options;
  return (<GridSheetLayout className={`react-grid-sheet ${mode || "light"}`}>
    <Provider store={store}>
      <GridTable />
      <StoreInitializer
        data={data}
        options={options}
      />
      { onChange && <ChangeEmitter onChange={onChange} /> }
    </Provider>
  </GridSheetLayout>);
};
