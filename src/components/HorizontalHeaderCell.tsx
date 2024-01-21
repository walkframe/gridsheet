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
import { Prevention, isProtected } from "../lib/protection";

type Props = {
  x: number;
};

export const HorizontalHeaderCell: React.FC<Props> = React.memo(
  ({ x }) => {
    const { store, dispatch } = React.useContext(Context);
    const colId = x2c(x);

    const {
      table,
      choosing,
      selectingZone,
      resizingRect,
      verticalHeaderSelecting,
      headerHeight,
      editorRef,
      autofillDraggingTo,
    } = store;

    const col = table.getByPoint({ y: 0, x });
    const width = col?.width || DEFAULT_WIDTH;

    return (
      <th
        className={`gs-header gs-header-horizontal gs-header-top ${choosing.x === x ? "gs-choosing" : ""
        } ${
        between({ start: selectingZone.startX, end: selectingZone.endX }, x)
          ? verticalHeaderSelecting
            ? "gs-header-selecting"
            : "gs-selecting"
          : ""
        } ${
          x === table.getNumCols() ? "gs-header-top-end" : ""
        }`}
        style={{width, minWidth: width, maxWidth: width}}
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
          editorRef.current!.focus();
          return false;
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          dispatch(setContextMenuPosition({ y: e.clientY, x: e.clientX }));
          return false;
        }}
      >
        <div
          className="gs-header-outer"
          draggable
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
            if (resizingRect.x === -1 && autofillDraggingTo == null) {
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
            style={{ height: headerHeight, position: 'relative' }}
          >
            {col?.labeler ? table.getLabel(col.labeler, x) : colId}
            <div
              className={`gs-resizer ${isProtected(col?.protection, Prevention.Resize) ? "gs-protected" : ""}`}
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
