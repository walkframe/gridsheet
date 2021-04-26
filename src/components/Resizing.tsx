import React from "react";
import styled from "styled-components";

import { y2r, x2c } from "../api/converters";
import { Context } from "../store";
import {
  setResizingPositionY,
  setResizingPositionX,
  setCellsOption,
} from "../store/actions";

import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  MIN_WIDTH,
  MIN_HEIGHT,
} from "../constants";
import { zoneToArea, makeSequence, between } from "../api/arrays";
import { CellsOptionType } from "../types";

const Line = styled.div`
  position: relative;
  top: 0;
  left: 0;
  border: dotted 1px #0077ff;
  box-sizing: border-box;

  span {
    font-size: 10px;
    padding: 3px;
    background-color: #0077ff;
    margin: 0;
    position: absolute;
    top: 0;
    left: 0;
  }
`;

export const Resizing: React.FC = React.memo(() => {
  const { store, dispatch } = React.useContext(Context);
  const {
    resizingPositionY: posY,
    resizingPositionX: posX,
    cellsOption,
    horizontalHeadersSelecting,
    verticalHeadersSelecting,
    selectingZone,
    editorRef,
    sheetRef,
  } = store;

  const [y, startY, endY] = posY;
  const [x, startX, endX] = posX;
  if (y === -1 && x === -1) {
    return null;
  }
  const [resizingRowId, resizingColId] = [`${y2r(y)}`, x2c(x)];
  const { y: offsetY, x: offsetX } = sheetRef.current.getBoundingClientRect();

  const baseWidth =
    cellsOption[resizingColId]?.width ||
    cellsOption.default?.width ||
    DEFAULT_WIDTH;

  const baseHeight =
    cellsOption[resizingRowId]?.height ||
    cellsOption.default?.height ||
    DEFAULT_HEIGHT;

  const width = baseWidth + (endX - startX);
  const height = baseHeight + (endY - startY);

  const handleResizeEnd = () => {
    const selectingArea = zoneToArea(selectingZone);
    const [top, left, bottom, right] = selectingArea;
    const newCellsOption: CellsOptionType = {};
    if (x !== -1) {
      let xs = [x];
      if (horizontalHeadersSelecting && between([left, right], x)) {
        xs = makeSequence(left, right + 1);
      }
      xs.map((x) => {
        newCellsOption[x2c(x)] = { ...cellsOption[x2c(x)], width };
      });
    }
    if (y !== -1) {
      let ys = [y];
      if (verticalHeadersSelecting && between([top, bottom], y)) {
        ys = makeSequence(top, bottom + 1);
      }
      ys.map((y) => {
        newCellsOption[y2r(y)] = { ...cellsOption[y2r(y)], height };
      });
    }
    dispatch(setCellsOption(newCellsOption));
    dispatch(setResizingPositionY([-1, -1, -1]));
    dispatch(setResizingPositionX([-1, -1, -1]));
    editorRef.current?.focus();
  };
  const handleResizeMove = (e: React.MouseEvent) => {
    if (y !== -1) {
      let endY = e.clientY;
      const height = baseHeight + (endY - startY);
      if (height < MIN_HEIGHT) {
        endY += MIN_HEIGHT - height;
      }
      dispatch(setResizingPositionY([y, startY, endY]));
    } else if (x !== -1) {
      let endX = e.clientX;
      const width = baseWidth + (endX - startX);
      if (width < MIN_WIDTH) {
        endX += MIN_WIDTH - width;
      }
      dispatch(setResizingPositionX([x, startX, endX]));
    }
  };

  return (
    <div
      className="resizing"
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        backgroundColor: "rgba(0, 127, 255, 0.08)",
        top: 0,
        left: 0,
        zIndex: 2,
      }}
      onMouseUp={handleResizeEnd}
      onMouseMove={handleResizeMove}
    >
      {x !== -1 && (
        <Line style={{ width: 1, height: "100%", left: endX - offsetX }}>
          <span style={{ left: "-50%" }}>{width}px</span>
        </Line>
      )}
      {y !== -1 && (
        <Line style={{ width: "100%", height: 1, top: endY - offsetY }}>
          <span style={{ top: "-50%" }}>{height}px</span>
        </Line>
      )}
    </div>
  );
});
