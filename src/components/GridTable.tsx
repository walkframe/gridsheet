import React from "react";
import styled from "styled-components";

import {
  DataType,
  WidthsType,
  HeightsType,
} from "../types";
import {
  Cell,
} from "./Cell";

interface Props {
  data: DataType;
  widths: WidthsType;
  heights: HeightsType;
  setWidths: (widths: WidthsType) => void;
  setHeights: (heights: HeightsType) => void;
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

      &.col-number {
        cursor: col-resize;
        resize: horizontal;
      }
      &.row-number {
        cursor: row-resize;
        resize: vertical;
      }

    }
    td {
      position: relative;
      padding: 0;
      margin: 0;
      width: 150px;
      background-color: #ffffff;
      
      &.selected {
        background-color: rgba(0, 128, 255, 0.2);
      }
      &.dragging {
        transform: translate(0, 0);
      }
    }
  }
`;

export const GridTable: React.FC<Props> = ({data, widths, heights}) => {
  const [pointsStart, setPointsStart] = React.useState<[number, number]>([0, 0]); // Y, X
  const [pointsEnd, setPointsEnd] = React.useState<[number, number]>([-1, -1]); // Y, X
  const [top, bottom] = pointsStart[0] < pointsEnd[0] ? [pointsStart[0], pointsEnd[0]] : [pointsEnd[0], pointsStart[0]];
  const [left, right] = pointsStart[1] < pointsEnd[1] ? [pointsStart[1], pointsEnd[1]] : [pointsEnd[1], pointsStart[1]];
  const between = (y: number, x: number) => top !== -1 && (top <= y && y <= bottom && left <= x && x <= right);

  return (<GridTableLayout>
    <table className="grid-table">
      <thead>
        <tr>
          <th></th>
          {widths.map((width, x) => (<th key={x} className="col-number" style={{ width }}>
          {x}
          </th>))
          }
        </tr>
      </thead>
      <tbody>{heights.map((height, y) => (<tr key={y}>
        <th className="row-number" style={{ height }}>{y + 1}</th>  
        {widths.map((width, x) => {
          const value = data[y][x];
          return (<td
            key={x}
            className={between(y, x) ? "selected": ""}
            draggable
            onClick={(e) => {
              setPointsStart([y, x]);
              setPointsEnd([-1, -1]);
            }}
            onDragStart={(e) => {
              e.currentTarget.classList.add("dragging");
              const img = document.createElement("img");
              img.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
              e.dataTransfer.setDragImage(img, 0, 0);
              setPointsEnd([-1, -1]);
              setPointsStart([y, x]);
              
            }}
            onDragEnter={(e) => {
              setPointsEnd([y, x]);
            }}
          ><Cell
            value={value}
            selecting={pointsStart[0] === y && pointsStart[1] === x}
          /></td>);
        })}
      </tr>))
      }</tbody>
    </table>
  </GridTableLayout>);
};

