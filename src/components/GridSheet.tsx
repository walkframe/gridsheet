import "../css/gridsheet.styl";

import React from "react";
import { Provider } from 'react-redux';

import {
  Props,
} from "../types";

import { store } from "../store";

import {
  StoreInjector,
} from "./StoreInjector";

export const GridSheet: React.FC<Props> = ({data, options}) => {
  if (typeof data === "undefined") {
    data = [];
  }
  if (typeof options === "undefined") {
    options = {};
  }

  return (<div className="react-grid-sheet">
    <Provider store={store}>
      <StoreInjector
        data={data}
        options={options}
      />
    </Provider>
  </div>);
};

