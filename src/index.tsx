import React from "react";
import { Provider } from 'react-redux'
import styled from "styled-components";

import {
  MatrixType,
  Props,
} from "./types";

import { store } from "./store";

import {
  GridTable
} from "./components/GridTable";

const Layout = styled.div`
  background-color: #ffffff;
  font-family: "Helvetica Neue",
    Arial,
    "Hiragino Kaku Gothic ProN",
    "Hiragino Sans",
    Meiryo,
    sans-serif;
`;

const GridSheet: React.FC<Props> = ({data, options}) => {
  if (typeof data === "undefined") {
    data = [];
  }
  if (typeof data[0] === "undefined") {
    data.push([]);
  }
  if (typeof options === "undefined") {
    options = {};
  }
  return (<Layout>
    <Provider store={store}>
      <GridTable
        data={data}
        options={options}
      />
    </Provider>
  </Layout>);
};

export default GridSheet;
