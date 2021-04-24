import React from "react";
import { x2c } from "../api/converters";
import { between, rerenderCells } from "../api/arrays";
import { Context } from "../store";
import {
  setCellOption,
  drag,
  selectCols,
  setResizingRect,
  setContextMenuPosition,
  setResizingPositionX,
} from "../store/actions";
import {
  DUMMY_IMG,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
  MIN_WIDTH,
} from "../constants";

type Props = {
  index: number;
  style: React.CSSProperties;
};

export const HorizontalHeaderCell: React.FC<Props> = React.memo(
  ({ index: x, style: outerStyle }) => {
    const { store, dispatch } = React.useContext(Context);
    const colId = x2c(x);

    const {
      matrix,
      choosing,
      cellsOption,
      selectingZone,
      resizingRect,
      horizontalHeadersSelecting,
      sheetHeight,
      headerHeight,
      sheetRef,
      editorRef,
    } = store;

    const defaultWidth = cellsOption.default?.width || DEFAULT_WIDTH;
    const colOption = cellsOption[colId] || {};
    const width = colOption.width || defaultWidth;
    const numRows = matrix.length;
    return (
      <div
        style={outerStyle}
        className={`
      gs-header gs-horizontal
      ${choosing[1] === x ? "gs-choosing" : ""} 
      ${
        between([selectingZone[1], selectingZone[3]], x)
          ? horizontalHeadersSelecting
            ? "gs-header-selecting"
            : "gs-selecting"
          : ""
      }`}
        draggable
        onContextMenu={(e) => {
          e.preventDefault();
          dispatch(setContextMenuPosition([e.pageY, e.pageX]));
          return false;
        }}
        onClick={(e) => {
          let startX = e.shiftKey ? selectingZone[1] : x;
          if (startX === -1) {
            startX = choosing[1];
          }
          dispatch(selectCols({ range: [startX, x], numRows }));
          dispatch(setContextMenuPosition([-1, -1]));
          editorRef.current?.focus();
          return false;
        }}
        onDragStart={(e) => {
          e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
          dispatch(selectCols({ range: [x, x], numRows }));
          return false;
        }}
        onDragEnter={() => {
          if (resizingRect[1] === -1) {
            dispatch(drag([numRows - 1, x]));
          }
          return false;
        }}
        onDragOver={(e) => {
          e.dataTransfer.dropEffect = "move";
          e.preventDefault();
        }}
      >
        <div
          className="gs-header-inner"
          style={{ width, height: headerHeight }}
          draggable
        >
          {colOption.label || colId}
        </div>
        <div
          className="gs-resizer"
          style={{ height: headerHeight }}
          onMouseDown={(e) => {
            const { x: offsetX } = sheetRef.current.getBoundingClientRect();
            dispatch(setResizingPositionX([x, e.clientX - offsetX, -1]));
          }}
        >
          <i />
        </div>
      </div>
    );
  }
);
