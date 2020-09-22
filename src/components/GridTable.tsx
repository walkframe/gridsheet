import React from "react";
import styled from "styled-components";

import {
  DataType,
} from "../types";

interface Props {
  data: DataType;
};

const GridTableLayout = styled.div`
  .grid-table {
    table-layout: fixed;
    border-collapse: collapse;
    th, td {
      border: solid 1px #bbbbbb;
    }
    th {
      font-weight: normal;
      width: 80px;
      background-color: #eeeeee;
    }
    td {
      width: 150px;
      &.selected {
        border: solid 2px #0077ff;
      }
    }
  }
`;

export const GridTable: React.FC<Props> = ({data}) => {
  return (<GridTableLayout>
    <table className="grid-table">
      <thead>
        <tr><th></th><th>A</th><th>B</th></tr>
      </thead>
      <tbody>{
        data.map((row, i) => (<tr key={i}>
          <th>{i + 1}</th>
          <td>a</td>
          <td>b</td>
        </tr>))
      }</tbody>
    </table>
  </GridTableLayout>);
};

