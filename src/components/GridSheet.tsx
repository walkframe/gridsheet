import React from "react";
import { Provider } from 'react-redux';
import styled from "styled-components";

import {
  MatrixType,
  Props,
} from "../types";

import { store } from "../store";

import {
  StoreInjector,
} from "./StoreInjector";

const Layout = styled.div`
  background-color: #ffffff;
  font-family: "Helvetica Neue",
    Arial,
    "Hiragino Kaku Gothic ProN",
    "Hiragino Sans",
    Meiryo,
    sans-serif;
`;

export const GridSheet: React.FC<Props> = ({data, options}) => {
  if (typeof data === "undefined") {
    data = [];
  }
  if (typeof options === "undefined") {
    options = {};
  }

  return (<Layout className="react-grid-sheet">
    <Provider store={store}>
      <StoreInjector
        data={data}
        options={options}
      />
    </Provider>
  </Layout>);
};

