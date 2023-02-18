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
  y: number;
};

export const HeaderLeftCell: React.FC<Props> = React.memo(
  ({ y }) => {
    const rowId = `${y2r(y)}`;
    const { store, dispatch } = React.useContext(Context);

    const {
      choosing,
      selectingZone,
      headerLeftSelecting,
      resizingRect,
      headerWidth,
      editorRef,
      table,
    } = store;

    const row = table.getByPoint({ y, x: 0 });
    const height = row?.height || DEFAULT_HEIGHT;

    return (
      <th
        className={`gs-header gs-header-vertical gs-header-left ${choosing.y === y ? "gs-choosing" : ""
        } ${
          between({ start: selectingZone.startY, end: selectingZone.endY }, y)
            ? headerLeftSelecting
              ? "gs-header-selecting"
              : "gs-selecting"
            : ""
        } ${
          y === table.getNumRows() ? "gs-header-left-end" : ""
        }`}
        style={{height}}
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
        >
          <div
            className="gs-header-inner"
            style={{ width: headerWidth, position: 'relative' }}
          >
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
        </div>
      </th>
    );
  }
);
