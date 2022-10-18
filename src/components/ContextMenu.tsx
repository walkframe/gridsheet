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
import {
  ContextMenuLayout,
  ContextMenuModalLayout,
} from "./styles/ContextMenuLayout";
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
    editorRef,
    contextMenuPosition,
    minNumRows,
    maxNumRows,
    minNumCols,
    maxNumCols,
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

  const [tableHeight, tableWidth] = [table.getNumRows(), table.getNumCols()];
  const [height, width] = zoneShape(selectingZone, 1);

  const [top, left] = contextMenuPosition;
  if (top === -1) {
    return null;
  }
  const historyIndex = table.getHistoryIndex();

  return (
    <ContextMenuModalLayout
      className="gs-contextmenu-modal"
      onClick={(e) => {
        e.preventDefault();
        dispatch(setContextMenuPosition([-1, -1]));
        return false;
      }}
    >
      <ContextMenuLayout
        style={{
          top: top,
          left: left,
        }}
      >
        <ul>
          <li
            className="enabled"
            onClick={() => {
              const area = clip(store);
              dispatch(cut(area));
            }}
          >
            <div className="gs-menu-name">Cut</div>
            <div className="gs-menu-shortcut">
              <span className="gs-menu-underline">X</span>
            </div>
          </li>
          <li
            className="enabled"
            onClick={() => {
              const area = clip(store);
              dispatch(copy(area));
            }}
          >
            <div className="gs-menu-name">Copy</div>
            <div className="gs-menu-shortcut">
              <span className="gs-menu-underline">C</span>
            </div>
          </li>
          <li
            className="enabled"
            onClick={async () => {
              const text = editorRef.current?.value || "";
              dispatch(paste({ text }));
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
              className={
                maxNumRows !== -1 && tableHeight + height > maxNumRows
                  ? "disabled"
                  : "enabled"
              }
              onClick={(e) => {
                if (e.currentTarget.classList.contains("disabled")) {
                  return false;
                }
                const newTable = table.addRows(
                  selectingTop,
                  height,
                  selectingTop,
                  {
                    selectingZone,
                    choosing,
                  }
                );
                dispatch(updateTable(newTable));
                dispatch(
                  select([
                    selectingTop,
                    1,
                    selectingTop + height,
                    table.getNumCols(),
                  ])
                );
                dispatch(choose([selectingTop, 0]));
              }}
            >
              <div className="gs-menu-name">
                Insert {height} row{height > 0 && "s"} above
              </div>
            </li>
          )}
          {!horizontalHeadersSelecting && (
            <li
              className={
                maxNumRows !== -1 && tableHeight + height > maxNumRows
                  ? "disabled"
                  : "enabled"
              }
              onClick={(e) => {
                if (e.currentTarget.classList.contains("disabled")) {
                  return false;
                }
                const newTable = table.addRows(
                  selectingBottom + 1,
                  height,
                  selectingBottom,
                  {
                    selectingZone,
                    choosing,
                  }
                );
                dispatch(updateTable(newTable));
                dispatch(
                  select([
                    selectingBottom + 1,
                    1,
                    selectingBottom + height,
                    table.getNumCols(),
                  ])
                );
                dispatch(choose([selectingBottom + 1, 0]));
              }}
            >
              <div className="gs-menu-name">
                Insert {height} row{height > 0 && "s"} below
              </div>
            </li>
          )}

          {!verticalHeadersSelecting && (
            <li
              className={
                maxNumCols !== -1 && tableWidth + width > maxNumCols
                  ? "disabled"
                  : "enabled"
              }
              onClick={(e) => {
                if (e.currentTarget.classList.contains("disabled")) {
                  return false;
                }
                const newTable = table.addCols(
                  selectingLeft,
                  width,
                  selectingLeft,
                  {
                    selectingZone,
                    choosing,
                  }
                );
                dispatch(updateTable(newTable));
                dispatch(
                  select([
                    0,
                    selectingLeft,
                    table.getNumRows(),
                    selectingLeft + width,
                  ])
                );
                dispatch(choose([0, selectingLeft]));
              }}
            >
              <div className="gs-menu-name">
                Insert {width} column{width > 0 && "s"} left
              </div>
            </li>
          )}
          {!verticalHeadersSelecting && (
            <li
              className={
                maxNumCols !== -1 && tableWidth + width > maxNumCols
                  ? "disabled"
                  : "enabled"
              }
              onClick={(e) => {
                if (e.currentTarget.classList.contains("disabled")) {
                  return false;
                }
                const newTable = table.addCols(
                  selectingRight + 1,
                  width,
                  selectingRight,
                  {
                    selectingZone,
                    choosing,
                  }
                );
                dispatch(updateTable(newTable));
                dispatch(
                  select([
                    1,
                    selectingRight + 1,
                    table.getNumRows(),
                    selectingRight + width,
                  ])
                );
                dispatch(choose([0, selectingRight + 1]));
              }}
            >
              <div className="gs-menu-name">
                Insert {width} column{width > 0 && "s"} right
              </div>
            </li>
          )}

          {!horizontalHeadersSelecting && (
            <li
              className={
                minNumRows !== -1 && tableHeight - height < minNumRows
                  ? "disabled"
                  : "enabled"
              }
              onClick={(e) => {
                if (e.currentTarget.classList.contains("disabled")) {
                  return false;
                }
                const newTable = table.removeRows(selectingTop, height, {
                  selectingZone,
                  choosing,
                });
                dispatch(updateTable(newTable));
              }}
            >
              <div className="gs-menu-name">
                Remove {height} row{height > 0 && "s"}
              </div>
            </li>
          )}

          {!verticalHeadersSelecting && (
            <li
              className={
                minNumCols !== -1 && tableWidth - width < minNumCols
                  ? "disabled"
                  : "enabled"
              }
              onClick={(e) => {
                if (e.currentTarget.classList.contains("disabled")) {
                  return false;
                }
                const newTable = table.removeCols(selectingLeft, width, {
                  selectingZone,
                  choosing,
                });
                dispatch(updateTable(newTable));
              }}
            >
              <div className="gs-menu-name">
                Remove {width} column{width > 0 && "s"}
              </div>
            </li>
          )}

          {(historyIndex > -1 || historyIndex < table.getHistorySize() - 1) && (
            <li className="gs-menu-divider" />
          )}

          {historyIndex > -1 && (
            <li
              onClick={async () => {
                dispatch(undo(null));
              }}
            >
              <div className="gs-menu-name">Undo</div>
              <div className="gs-menu-shortcut">
                <span className="gs-menu-underline">Z</span>
              </div>
            </li>
          )}
          {historyIndex < table.getHistorySize() - 1 && (
            <li
              onClick={async () => {
                dispatch(redo(null));
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
    </ContextMenuModalLayout>
  );
};
