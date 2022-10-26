import React from "react";
import { clip } from "../api/clipboard";

import {
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
import { areaToZone, zoneShape, zoneToArea } from "../api/structs";

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
  } = store;

  const { y, x } = choosing;
  let {
    top: selectingTop,
    left: selectingLeft,
    bottom: selectingBottom,
    right: selectingRight,
  } = zoneToArea(selectingZone);
  if (selectingTop === -1) {
    [selectingTop, selectingLeft, selectingBottom, selectingRight] = [
      y,
      x,
      y,
      x,
    ];
  }

  const [tableHeight, tableWidth] = [table.getNumRows(), table.getNumCols()];
  const { height, width } = zoneShape({ ...selectingZone, base: 1 });
  const { y: top, x: left } = contextMenuPosition;
  if (top === -1) {
    return null;
  }
  const historyIndex = table.getHistoryIndex();

  return (
    <ContextMenuModalLayout
      className="gs-contextmenu-modal"
      onClick={(e) => {
        e.preventDefault();
        dispatch(setContextMenuPosition({ y: -1, x: -1 }));
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
              dispatch(cut(areaToZone(area)));
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
              dispatch(copy(areaToZone(area)));
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
                table.maxNumRows !== -1 &&
                tableHeight + height > table.maxNumRows
                  ? "disabled"
                  : "enabled"
              }
              onClick={(e) => {
                const newTable = table.addBlankRows({
                  y: selectingTop,
                  numRows: height,
                  baseY: selectingTop,
                  reflection: {
                    selectingZone,
                    choosing,
                  },
                });
                dispatch(updateTable(newTable));
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
                table.maxNumRows !== -1 &&
                tableHeight + height > table.maxNumRows
                  ? "disabled"
                  : "enabled"
              }
              onClick={(e) => {
                selectingZone.startY += height;
                selectingZone.endY += height;
                choosing.y += height;
                const newTable = table.addBlankRows({
                  y: selectingBottom + 1,
                  numRows: height,
                  baseY: selectingBottom,
                  reflection: {
                    selectingZone,
                    choosing,
                  },
                });
                dispatch(updateTable(newTable));
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
                table.maxNumCols !== -1 && tableWidth + width > table.maxNumCols
                  ? "disabled"
                  : "enabled"
              }
              onClick={(e) => {
                const newTable = table.addBlankCols({
                  x: selectingLeft,
                  numCols: width,
                  baseX: selectingLeft,
                  reflection: {
                    selectingZone,
                    choosing,
                  },
                });
                dispatch(updateTable(newTable));
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
                table.maxNumCols !== -1 && tableWidth + width > table.maxNumCols
                  ? "disabled"
                  : "enabled"
              }
              onClick={(e) => {
                selectingZone.startX += width;
                selectingZone.endX += width;
                choosing.x += width;
                const newTable = table.addBlankCols({
                  x: selectingRight + 1,
                  numCols: width,
                  baseX: selectingRight,
                  reflection: {
                    selectingZone,
                    choosing,
                  },
                });
                dispatch(updateTable(newTable));
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
                table.minNumRows !== -1 &&
                tableHeight - height < table.minNumRows
                  ? "disabled"
                  : "enabled"
              }
              onClick={(e) => {
                const newTable = table.removeRows({
                  y: selectingTop,
                  numRows: height,
                  reflection: {
                    selectingZone,
                    choosing,
                  },
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
                table.minNumCols !== -1 && tableWidth - width < table.minNumCols
                  ? "disabled"
                  : "enabled"
              }
              onClick={(e) => {
                const newTable = table.removeCols({
                  x: selectingLeft,
                  numCols: width,
                  reflection: {
                    selectingZone,
                    choosing,
                  },
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
