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

`;

export const Index: React.FC<Props> = ({data}) => {
  return (<Layout>
    <GridTable
      data={data}
    />
  </Layout>);
};

export default Index;
