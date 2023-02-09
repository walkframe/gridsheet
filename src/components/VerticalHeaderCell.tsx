import React from "react";
import { y2r } from "../lib/converters";
import { between } from "../lib/structs";
import { Context } from "../store";
import {
  choose,
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
    const row = table.getByPoint({ y, x: 0 });
    const height = row?.height || DEFAULT_HEIGHT;

    return (
      <th
        style={{...outerStyle, padding: 0, position: "sticky", left: 0, zIndex: 1}}
        className={`
      gs-header gs-vertical
      ${choosing.y === y ? "gs-choosing" : ""}
      ${
        between({ start: selectingZone.startY, end: selectingZone.endY }, y)
          ? verticalHeadersSelecting
            ? "gs-header-selecting"
            : "gs-selecting"
          : ""
      }`}
        onClick={(e) => {
          let startY = e.shiftKey ? selectingZone.startY : y;
          if (startY === -1) {
            startY = choosing.y;
          }
          dispatch(
            selectRows({
              range: { start: startY, end: y },
              numCols: table.getNumCols(),
            })
          );
          dispatch(setContextMenuPosition({ y: -1, x: -1 }));
          dispatch(choose({ y: startY, x: 1 }));
          editorRef.current?.focus();
          return false;
        }}
        draggable
        onContextMenu={(e) => {
          e.preventDefault();
          dispatch(setContextMenuPosition({ y: e.clientY, x: e.clientX }));
          return false;
        }}
      >
        <div
          className="gs-header-outer"
          onDragStart={(e) => {
            e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
            dispatch(
              selectRows({
                range: { start: y, end: y },
                numCols: table.getNumCols(),
              })
            );
            dispatch(choose({ y, x: 1 }));
            return false;
          }}
          onDragEnter={() => {
            if (resizingRect.y === -1) {
              const { startX } = selectingZone;
              if (startX === 1) {
                dispatch(drag({ y, x: table.getNumCols() }));
              } else {
                dispatch(drag({ y, x: 1 }));
              }
            }
            return false;
          }}
          onDragOver={(e) => {
            e.dataTransfer.dropEffect = "move";
            e.preventDefault();
          }}
        ></div>
        <div className="gs-header-inner" style={{ height, width: headerWidth, position: 'relative' }}>
          {row?.labeler ? table.getLabel(row.labeler, y) : rowId}
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
      </th>
    );
  }
);
