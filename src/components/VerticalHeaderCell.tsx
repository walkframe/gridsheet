import React from "react";
import { y2r } from "../api/converters";
import { between } from "../api/arrays";
import { Context } from "../store";
import {
  drag,
  selectRows,
  setContextMenuPosition,
  setResizingPositionY,
} from "../store/actions";
import { DUMMY_IMG, DEFAULT_HEIGHT } from "../constants";

type Props = {
  index: number;
  style: React.CSSProperties;
};

export const VerticalHeaderCell: React.FC<Props> = React.memo(
  ({ index: y, style: outerStyle }) => {
    const rowId = `${y2r(y)}`;
    const { store, dispatch } = React.useContext(Context);

    const {
      matrix,
      cellsOption,
      choosing,
      selectingZone,
      verticalHeadersSelecting,
      resizingRect,
      headerWidth,
      editorRef,
    } = store;

    const defaultHeight = cellsOption.default?.height || DEFAULT_HEIGHT;
    const rowOption = cellsOption[rowId] || {};
    const height = rowOption.height || defaultHeight;
    const numCols = matrix[0]?.length || 0;

    return (
      <div
        style={outerStyle}
        className={`
      gs-header gs-vertical
      ${choosing[0] === y ? "gs-choosing" : ""} 
      ${
        between([selectingZone[0], selectingZone[2]], y)
          ? verticalHeadersSelecting
            ? "gs-header-selecting"
            : "gs-selecting"
          : ""
      }`}
        onClick={(e) => {
          let startY = e.shiftKey ? selectingZone[0] : y;
          if (startY === -1) {
            startY = choosing[0];
          }
          dispatch(selectRows({ range: [startY, y], numCols }));
          dispatch(setContextMenuPosition([-1, -1]));
          editorRef.current?.focus();
          return false;
        }}
        draggable
        onContextMenu={(e) => {
          e.preventDefault();
          dispatch(setContextMenuPosition([e.clientY, e.clientX]));
          return false;
        }}
        onDragStart={(e) => {
          e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
          dispatch(selectRows({ range: [y, y], numCols }));
          return false;
        }}
        onDragEnter={() => {
          if (resizingRect[0] === -1) {
            dispatch(drag([y, numCols - 1]));
          }
          return false;
        }}
        onDragOver={(e) => {
          e.dataTransfer.dropEffect = "move";
          e.preventDefault();
        }}
      >
        <div className="gs-header-inner" style={{ height, width: headerWidth }}>
          {rowOption.label || rowId}
        </div>
        <div
          className="gs-resizer"
          style={{ width: headerWidth }}
          onMouseDown={(e) => {
            dispatch(setResizingPositionY([y, e.clientY, e.clientY]));
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
