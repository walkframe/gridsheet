import React from "react";
import styled from "styled-components";

import {
  DataType,
  Props,
} from "./types";

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

export const Index: React.FC<Props> = ({data, options}) => {
  if (typeof options === "undefined") {
    options = {};
  }
  let {widths: w, heights: h} = options;
  if (typeof w === "undefined") {
    if (typeof data[0] === "undefined") {
      w = [];
    } else {
      w = data[0].map((_) => "100px");
    }
  }
  if (typeof h === "undefined") {
    h = data.map((_) => "20px");
  }
  const [widths, setWidths] = React.useState(w);
  const [heights, setHeights] = React.useState(h);

  return (<Layout>
    <GridTable
      widths={widths}
      heights={heights}
      setWidths={setWidths}
      setHeights={setHeights}
      data={data}
    />
  </Layout>);
};

export default Index;
