import React from "react";
import { x2c } from "../lib/converters";
import { between } from "../lib/structs";
import { Context } from "../store";
import {
  choose,
  drag,
  selectCols,
  setContextMenuPosition,
  setResizingPositionX,
} from "../store/actions";
import { DUMMY_IMG, DEFAULT_WIDTH } from "../constants";

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

    if (table.getNumRows() === 0) {
      return null;
    }
    const col = table.getByPoint({ y: 0, x });
    const width = col?.width || DEFAULT_WIDTH;
    return (
      <th
        style={{...outerStyle, padding: 0, position: "sticky", top: 0, zIndex: 1}}
        className={`
      gs-header gs-horizontal
      ${choosing.x === x ? "gs-choosing" : ""}
      ${
        between({ start: selectingZone.startX, end: selectingZone.endX }, x)
          ? horizontalHeadersSelecting
            ? "gs-header-selecting"
            : "gs-selecting"
          : ""
      }`}
        onContextMenu={(e) => {
          e.preventDefault();
          dispatch(setContextMenuPosition({ y: e.clientY, x: e.clientX }));
          return false;
        }}
        onClick={(e) => {
          let startX = e.shiftKey ? selectingZone.startX : x;
          if (startX === -1) {
            startX = choosing.x;
          }
          dispatch(
            selectCols({
              range: { start: startX, end: x },
              numRows: table.getNumRows(),
            })
          );
          dispatch(setContextMenuPosition({ y: -1, x: -1 }));
          dispatch(choose({ y: 1, x: startX }));
          editorRef.current?.focus();
          return false;
        }}
      >
        <div
          className="gs-header-outer"
          onDragStart={(e) => {
            e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
            dispatch(
              selectCols({
                range: { start: x, end: x },
                numRows: table.getNumRows(),
              })
            );
            dispatch(choose({ y: 1, x }));
            return false;
          }}
          onDragEnter={() => {
            if (resizingRect.x === -1) {
              const { startY } = selectingZone;
              if (startY === 1) {
                dispatch(drag({ y: table.getNumRows(), x }));
              } else {
                dispatch(drag({ y: 1, x }));
              }
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
            style={{ width, height: headerHeight, position: 'relative' }}
            draggable
          >
            {col?.labeler ? table.getLabel(col.labeler, x) : colId}
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
        </div>
      </th>
    );
  }
);
