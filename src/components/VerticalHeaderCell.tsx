import React from "react";
import { y2r } from "../api/converters";
import { between } from "../api/matrix";
import { Context } from "../store";
import {
  choose,
  drag,
  selectRows,
  setContextMenuPosition,
  setResizingPositionY,
} from "../store/actions";
import { DUMMY_IMG, DEFAULT_HEIGHT, Area } from "../constants";

type Props = {
  index: number;
  style: React.CSSProperties;
};

export const VerticalHeaderCell: React.FC<Props> = React.memo(
  ({ index: y, style: outerStyle }) => {
    const rowId = `${y2r(++y)}`;
    const { store, dispatch } = React.useContext(Context);

    const {
      choosing,
      selectingZone,
      verticalHeadersSelecting,
      resizingRect,
      headerWidth,
      editorRef,
      table,
    } = store;

    if (table.getNumRows() === 0) {
      return null;
    }
    const row = table.getByPoint([y, 0]);
    const height = row?.height || DEFAULT_HEIGHT;

    return (
      <div
        style={outerStyle}
        className={`
      gs-header gs-vertical
      ${choosing[0] === y ? "gs-choosing" : ""}
      ${
        between([selectingZone[0], selectingZone[Area.Bottom]], y)
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
          dispatch(
            selectRows({ range: [startY, y], numCols: table.getNumCols() })
          );
          dispatch(setContextMenuPosition([-1, -1]));
          dispatch(choose([startY, 1]));
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
          dispatch(selectRows({ range: [y, y], numCols: table.getNumCols() }));
          dispatch(choose([y, 1]));
          return false;
        }}
        onDragEnter={() => {
          if (resizingRect[0] === -1) {
            const startX = selectingZone[1];
            if (startX === 1) {
              dispatch(drag([y, table.getNumCols()]));
            } else {
              dispatch(drag([y, 1]));
            }
          }
          return false;
        }}
        onDragOver={(e) => {
          e.dataTransfer.dropEffect = "move";
          e.preventDefault();
        }}
      >
        <div className="gs-header-inner" style={{ height, width: headerWidth }}>
          {row?.labeler ? table.getLabel(row.labeler, y) : rowId}
        </div>
        <div
          className="gs-resizer"
          style={{ width: headerWidth }}
          onMouseDown={(e) => {
            dispatch(setResizingPositionY([y, e.clientY, e.clientY]));
            e.preventDefault();
            e.stopPropagation();
          }}
        ></div>
      </div>
    );
  }
);
