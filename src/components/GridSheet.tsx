import "../css/gridsheet.styl";

import React from "react";
import { Provider } from 'react-redux';

import {
  MatrixType,
  OptionsType,
} from "../types";

import { store } from "../store";

import {
  StoreInjector,
} from "./StoreInjector";

import {
  ChangeEmitter,
} from "./ChangeEmitter";

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
  return (<div className={`react-grid-sheet ${mode || "light"}`}>
    <Provider store={store}>
      <StoreInjector
        data={data}
        options={options}
      />
      { onChange && <ChangeEmitter onChange={onChange} /> }
    </Provider>
  </div>);
};
