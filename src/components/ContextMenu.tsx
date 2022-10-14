import React from "react";

import { x2c, y2r } from "../api/converters";
import { clip } from "../api/clipboard";

import {
  choose,
  select,
  undo,
  redo,
  copy,
  cut,
  paste,
  setContextMenuPosition,
  updateTable,
} from "../store/actions";
import { ContextMenuLayout } from "./styles/ContextMenuLayout";
import { zoneShape, zoneToArea } from "../api/matrix";

import { Context } from "../store";

export const ContextMenu: React.FC = () => {
  const { store, dispatch } = React.useContext(Context);

  const {
    table,
    choosing,
    selectingZone,
    horizontalHeadersSelecting,
    verticalHeadersSelecting,
    history,
    editorRef,
    contextMenuPosition,
    sheetRef,
  } = store;

  const [y, x] = choosing;
  let [
    selectingTop,
    selectingLeft,
    selectingBottom,
    selectingRight,
  ] = zoneToArea(selectingZone);
  if (selectingTop === -1) {
    [selectingTop, selectingLeft, selectingBottom, selectingRight] = [
      y,
      x,
      y,
      x,
    ];
  }
  const rowId = y2r(y);
  const colId = x2c(x);
  const address = `${colId}${rowId}`;

  const [height, width] = zoneShape(selectingZone);

  const [top, left] = contextMenuPosition;
  if (top === -1) {
    return null;
  }

  const { y: offsetY, x: offsetX } = sheetRef.current.getBoundingClientRect();

  return (
    <ContextMenuLayout
      style={{
        top: top - offsetY,
        left: left - offsetX,
      }}
    >
      <ul>
        <li
          onClick={() => {
            const area = clip(store);
            dispatch(cut(area));
            dispatch(setContextMenuPosition([-1, -1]));
          }}
        >
          <div className="gs-menu-name">Cut</div>
          <div className="gs-menu-shortcut">
            <span className="gs-menu-underline">X</span>
          </div>
        </li>
        <li
          onClick={() => {
            const area = clip(store);
            dispatch(copy(area));
            dispatch(setContextMenuPosition([-1, -1]));
          }}
        >
          <div className="gs-menu-name">Copy</div>
          <div className="gs-menu-shortcut">
            <span className="gs-menu-underline">C</span>
          </div>
        </li>
        <li
          onClick={async () => {
            const text = editorRef.current?.value || "";
            dispatch(paste({ text }));
            dispatch(setContextMenuPosition([-1, -1]));
          }}
        >
          <div className="gs-menu-name">Paste</div>
          <div className="gs-menu-shortcut">
            <span className="gs-menu-underline">V</span>
          </div>
        </li>

        <li className="gs-menu-divider" />

        {!horizontalHeadersSelecting && (
          <li
            onClick={() => {
              table.addRows(selectingTop, height + 1, selectingTop, {
                selectingZone,
                choosing,
              });
              dispatch(updateTable(table.shallowCopy()));
              dispatch(
                select([
                  selectingTop,
                  1,
                  selectingTop + height,
                  table.numCols(),
                ])
              );
              dispatch(choose([selectingTop, 0]));
              dispatch(setContextMenuPosition([-1, -1]));
            }}
          >
            <div className="gs-menu-name">
              Insert {height + 1} row{height > 0 && "s"} above
            </div>
          </li>
        )}
        {!horizontalHeadersSelecting && (
          <li
            onClick={() => {
              table.addRows(selectingBottom + 1, height + 1, selectingBottom, {
                selectingZone,
                choosing,
              });
              dispatch(updateTable(table.shallowCopy()));
              dispatch(
                select([
                  selectingBottom + 1,
                  1,
                  selectingBottom + height + 1,
                  table.numCols(),
                ])
              );
              dispatch(choose([selectingBottom + 1, 0]));
              dispatch(setContextMenuPosition([-1, -1]));
            }}
          >
            <div className="gs-menu-name">
              Insert {height + 1} row{height > 0 && "s"} below
            </div>
          </li>
        )}

        {!verticalHeadersSelecting && (
          <li
            onClick={() => {
              table.addCols(selectingLeft, width + 1, selectingLeft, {
                selectingZone,
                choosing,
              });
              dispatch(updateTable(table.shallowCopy()));
              dispatch(
                select([
                  0,
                  selectingLeft,
                  table.numRows(),
                  selectingLeft + width,
                ])
              );
              dispatch(choose([0, selectingLeft]));
              dispatch(setContextMenuPosition([-1, -1]));
            }}
          >
            <div className="gs-menu-name">
              Insert {width + 1} column{width > 0 && "s"} left
            </div>
          </li>
        )}
        {!verticalHeadersSelecting && (
          <li
            onClick={() => {
              table.addCols(selectingRight + 1, width + 1, selectingRight, {
                selectingZone,
                choosing,
              });
              dispatch(updateTable(table.shallowCopy()));
              dispatch(
                select([
                  1,
                  selectingRight + 1,
                  table.numRows(),
                  selectingRight + width + 1,
                ])
              );
              dispatch(choose([0, selectingRight + 1]));
              dispatch(setContextMenuPosition([-1, -1]));
            }}
          >
            <div className="gs-menu-name">
              Insert {width + 1} column{width > 0 && "s"} right
            </div>
          </li>
        )}

        {!horizontalHeadersSelecting && (
          <li
            onClick={() => {
              table.removeRows(selectingTop, height + 1, {
                selectingZone,
                choosing,
              });
              dispatch(updateTable(table.shallowCopy()));
              dispatch(setContextMenuPosition([-1, -1]));
              dispatch(choose([-1, -1]));
              setTimeout(() => {
                dispatch(choose([y, 0]));
              }, 200);
            }}
          >
            <div className="gs-menu-name">
              Remove {height + 1} row{height > 0 && "s"}
            </div>
          </li>
        )}

        {!verticalHeadersSelecting && (
          <li
            onClick={() => {
              table.removeCols(selectingLeft, width + 1, {
                selectingZone,
                choosing,
              });
              dispatch(updateTable(table.shallowCopy()));
              dispatch(setContextMenuPosition([-1, -1]));
              dispatch(choose([-1, -1]));
              setTimeout(() => {
                dispatch(choose([0, x]));
              }, 200);
            }}
          >
            <div className="gs-menu-name">
              Remove {width + 1} column{width > 0 && "s"}
            </div>
          </li>
        )}

        {(history.index > -1 ||
          history.index < history.operations.length - 1) && (
          <li className="gs-menu-divider" />
        )}

        {history.index > -1 && (
          <li
            onClick={async () => {
              dispatch(undo(null));
              dispatch(setContextMenuPosition([-1, -1]));
            }}
          >
            <div className="gs-menu-name">Undo</div>
            <div className="gs-menu-shortcut">
              <span className="gs-menu-underline">Z</span>
            </div>
          </li>
        )}
        {history.index < history.operations.length - 1 && (
          <li
            onClick={async () => {
              dispatch(redo(null));
              dispatch(setContextMenuPosition([-1, -1]));
            }}
          >
            <div className="gs-menu-name">Redo</div>
            <div className="gs-menu-shortcut">
              <span className="gs-menu-underline">R</span>
            </div>
          </li>
        )}
      </ul>
    </ContextMenuLayout>
  );
};
