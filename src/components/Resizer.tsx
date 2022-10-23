import React from "react";
import styled from "styled-components";

import { Context } from "../store";
import {
  setResizingPositionY,
  setResizingPositionX,
  updateTable,
} from "../store/actions";

import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  MIN_WIDTH,
  MIN_HEIGHT,
} from "../constants";
import { zoneToArea, makeSequence, between } from "../api/structs";
import { CellsByAddressType } from "../types";
import { p2a } from "../api/converters";

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
    color: #ffffff;
    margin: 0;
    position: absolute;
    top: 0;
    left: 0;
  }
`;

export const Resizer: React.FC = React.memo(() => {
  const { store, dispatch } = React.useContext(Context);
  const {
    resizingPositionY: posY,
    resizingPositionX: posX,
    table,
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
  const cell = table.getByPoint({ y: y === -1 ? 0 : y, x: x === -1 ? 0 : x });
  const { y: offsetY, x: offsetX } = sheetRef.current.getBoundingClientRect();

  const baseWidth = cell?.width || DEFAULT_WIDTH;
  const baseHeight = cell?.height || DEFAULT_HEIGHT;

  const width = baseWidth + (endX - startX);
  const height = baseHeight + (endY - startY);

  const handleResizeEnd = () => {
    const selectingArea = zoneToArea(selectingZone);
    const { top, left, bottom, right } = selectingArea;
    const diff: CellsByAddressType = {};
    if (x !== -1) {
      let xs = [x];
      if (
        horizontalHeadersSelecting &&
        between({ start: left, end: right }, x)
      ) {
        xs = makeSequence(left, right + 1);
      }
      xs.map((x, i) => {
        diff[p2a({ y: 0, x })] = { width };
      });
    }
    if (y !== -1) {
      let ys = [y];
      if (verticalHeadersSelecting && between({ start: top, end: bottom }, y)) {
        ys = makeSequence(top, bottom + 1);
      }
      ys.map((y, i) => {
        diff[p2a({ y, x: 0 })] = { height };
      });
    }
    const newTable = table.update({
      diff,
      partial: true,
      reflection: { selectingZone },
    });
    dispatch(updateTable(newTable));
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
