import React from "react";
import styled from "styled-components";

import { y2r, x2c } from "../api/converters";
import { GridTable } from "./GridTable";
import { Context } from "../store";
import {
  setResizingPositionY,
  setResizingPositionX,
  setCellOption,
} from "../store/actions";

import {
  DUMMY_IMG,
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  MIN_WIDTH,
  MIN_HEIGHT,
} from "../constants";

const Line = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  border: dotted 1px #0077ff;
  box-sizing: border-box;
`;

export const Resizing: React.FC = React.memo(() => {
  const { store, dispatch } = React.useContext(Context);
  const {
    resizingPositionY: posY,
    resizingPositionX: posX,
    cellsOption,
  } = store;

  const [y, startY, endY] = posY;
  const [x, startX, endX] = posX;
  if (y === -1 && x === -1) {
    return null;
  }
  const [rowId, colId] = [`${y2r(y)}`, x2c(x)];
  const [rowOption, colOption] = [cellsOption[rowId], cellsOption[colId]];

  return (
    <div
      className="resizing"
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 3,
      }}
      onMouseUp={(e) => {
        if (x !== -1) {
          let width =
            (cellsOption[colId]?.width || DEFAULT_WIDTH) + (endX - startX);
          if (width < MIN_WIDTH) {
            width = MIN_WIDTH;
          }
          dispatch(
            setCellOption({
              cell: colId,
              option: {
                ...colOption,
                width,
              },
            })
          );
        }
        if (y !== -1) {
          let height =
            (cellsOption[rowId]?.height || DEFAULT_HEIGHT) + (endY - startY);
          if (height < MIN_HEIGHT) {
            height = MIN_HEIGHT;
          }
          dispatch(
            setCellOption({
              cell: `${y2r(y)}`,
              option: {
                ...rowOption,
                height,
              },
            })
          );
        }
        dispatch(setResizingPositionY([-1, -1, -1]));
        dispatch(setResizingPositionX([-1, -1, -1]));
      }}
      onMouseMove={(e) => {
        const {
          y: offsetY,
          x: offsetX,
        } = e.currentTarget.getBoundingClientRect();
        if (y !== -1) {
          dispatch(setResizingPositionY([y, startY, e.clientY - offsetY]));
        }
        if (x !== -1) {
          dispatch(setResizingPositionX([x, startX, e.clientX - offsetX]));
        }
      }}
    >
      {x !== -1 && <Line style={{ width: 1, height: "100%", left: endX }} />}
      {y !== -1 && <Line style={{ width: "100%", height: 1, top: endY }} />}
    </div>
  );
});
