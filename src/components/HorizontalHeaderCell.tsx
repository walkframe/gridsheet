import React from "react";
import { x2c } from "../api/converters";
import { between } from "../api/matrix";
import { Context } from "../store";
import {
  choose,
  drag,
  selectCols,
  setContextMenuPosition,
  setResizingPositionX,
} from "../store/actions";
import { DUMMY_IMG, DEFAULT_WIDTH, Area } from "../constants";

type Props = {
  index: number;
  style: React.CSSProperties;
};

export const HorizontalHeaderCell: React.FC<Props> = React.memo(
  ({ index: x, style: outerStyle }) => {
    const { store, dispatch } = React.useContext(Context);
    const colId = x2c(++x);

    const {
      table,
      choosing,
      selectingZone,
      resizingRect,
      horizontalHeadersSelecting,
      headerHeight,
      editorRef,
    } = store;

    if (table.numRows() === 0) {
      return null;
    }
    const col = table.get(0, x);
    const width = col?.width || DEFAULT_WIDTH;
    return (
      <div
        style={outerStyle}
        className={`
      gs-header gs-horizontal
      ${choosing[1] === x ? "gs-choosing" : ""}
      ${
        between([selectingZone[1], selectingZone[Area.Right]], x)
          ? horizontalHeadersSelecting
            ? "gs-header-selecting"
            : "gs-selecting"
          : ""
      }`}
        onContextMenu={(e) => {
          e.preventDefault();
          dispatch(setContextMenuPosition([e.clientY, e.clientX]));
          return false;
        }}
        onClick={(e) => {
          let startX = e.shiftKey ? selectingZone[1] : x;
          if (startX === -1) {
            startX = choosing[1];
          }
          dispatch(
            selectCols({ range: [startX, x], numRows: table.numRows() })
          );
          dispatch(setContextMenuPosition([-1, -1]));
          dispatch(choose([1, startX]));
          editorRef.current?.focus();
          return false;
        }}
        onDragStart={(e) => {
          e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
          dispatch(selectCols({ range: [x, x], numRows: table.numRows() }));
          dispatch(choose([1, x]));
          return false;
        }}
        onDragEnter={() => {
          if (resizingRect[1] === -1) {
            dispatch(drag([table.numRows(), x]));
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
          {col?.label
            ? typeof col?.label === "function"
              ? col?.label(x)
              : col?.label
            : colId}
        </div>
        <div
          className="gs-resizer"
          style={{ height: headerHeight }}
          onMouseDown={(e) => {
            dispatch(setResizingPositionX([x, e.clientX, e.clientX]));
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <i />
        </div>
      </div>
    );
  }
);
