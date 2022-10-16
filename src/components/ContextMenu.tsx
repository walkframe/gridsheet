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
            className={
              maxNumRows === -1 && tableHeight + height > maxNumRows
                ? "disabled"
                : "enabled"
            }
            onClick={(e) => {
              if (e.currentTarget.classList.contains("disabled")) {
                return false;
              }
              table.addRows(selectingTop, height, selectingTop, {
                selectingZone,
                choosing,
              });
              dispatch(updateTable(table.shallowCopy(false)));
              dispatch(
                select([
                  selectingTop,
                  1,
                  selectingTop + height,
                  table.getNumCols(),
                ])
              );
              dispatch(choose([selectingTop, 0]));
              dispatch(setContextMenuPosition([-1, -1]));
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
              table.addRows(selectingBottom + 1, height, selectingBottom, {
                selectingZone,
                choosing,
              });
              dispatch(updateTable(table.shallowCopy(false)));
              dispatch(
                select([
                  selectingBottom + 1,
                  1,
                  selectingBottom + height,
                  table.getNumCols(),
                ])
              );
              dispatch(choose([selectingBottom + 1, 0]));
              dispatch(setContextMenuPosition([-1, -1]));
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
              table.addCols(selectingLeft, width, selectingLeft, {
                selectingZone,
                choosing,
              });
              dispatch(updateTable(table.shallowCopy(false)));
              dispatch(
                select([
                  0,
                  selectingLeft,
                  table.getNumRows(),
                  selectingLeft + width,
                ])
              );
              dispatch(choose([0, selectingLeft]));
              dispatch(setContextMenuPosition([-1, -1]));
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
              table.addCols(selectingRight + 1, width, selectingRight, {
                selectingZone,
                choosing,
              });
              dispatch(updateTable(table.shallowCopy(false)));
              dispatch(
                select([
                  1,
                  selectingRight + 1,
                  table.getNumRows(),
                  selectingRight + width,
                ])
              );
              dispatch(choose([0, selectingRight + 1]));
              dispatch(setContextMenuPosition([-1, -1]));
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
              table.removeRows(selectingTop, height, {
                selectingZone,
                choosing,
              });
              dispatch(updateTable(table.shallowCopy(false)));
              dispatch(setContextMenuPosition([-1, -1]));
              dispatch(choose([-1, -1]));
              setTimeout(() => {
                dispatch(choose([y, 0]));
              }, 200);
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
              table.removeCols(selectingLeft, width, {
                selectingZone,
                choosing,
              });
              dispatch(updateTable(table.shallowCopy(false)));
              dispatch(setContextMenuPosition([-1, -1]));
              dispatch(choose([-1, -1]));
              setTimeout(() => {
                dispatch(choose([0, x]));
              }, 200);
            }}
          >
            <div className="gs-menu-name">
              Remove {width} column{width > 0 && "s"}
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
