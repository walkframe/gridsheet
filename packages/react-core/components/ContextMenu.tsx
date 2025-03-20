import React from 'react';
import { clip } from '../lib/clipboard';

import { undo, redo, copy, cut, paste, setContextMenuPosition, updateTable } from '../store/actions';
import { areaToZone, zoneShape, zoneToArea } from '../lib/structs';

import { Context } from '../store';
import * as prevention from '../lib/prevention';
import { Fixed } from './Fixed';

export const ContextMenu: React.FC = () => {
  const { store, dispatch } = React.useContext(Context);

  const { table, choosing, selectingZone, leftHeaderSelecting, topHeaderSelecting, editorRef, contextMenuPosition } =
    store;

  const { y, x } = choosing;
  let {
    top: selectingTop,
    left: selectingLeft,
    bottom: selectingBottom,
    right: selectingRight,
  } = zoneToArea(selectingZone);
  if (selectingTop === -1) {
    [selectingTop, selectingLeft, selectingBottom, selectingRight] = [y, x, y, x];
  }

  const [tableHeight, tableWidth] = [table.getNumRows(), table.getNumCols()];
  const { height, width } = zoneShape({ ...selectingZone, base: 1 });
  const { y: top, x: left } = contextMenuPosition;
  if (top === -1) {
    return null;
  }
  const selectingTopCell = table.getByPoint({ y: selectingTop, x: 0 });
  const selectingLeftCell = table.getByPoint({ y: 0, x: selectingLeft });
  const selectingBottomCell = table.getByPoint({ y: selectingBottom, x: 0 });
  const selectingRightCell = table.getByPoint({ y: 0, x: selectingRight });
  const historyIndex = table.getHistoryIndex();

  return (
    <Fixed
      className="gs-contextmenu-modal"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        dispatch(setContextMenuPosition({ y: -1, x: -1 }));
        return false;
      }}
    >
      <div
        className={'gs-contextmenu'}
        style={{
          top: top,
          left: left,
        }}
      >
        <ul>
          <li
            className="gs-enabled"
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
            className="gs-enabled"
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
            className="gs-enabled"
            onClick={() => {
              const text = editorRef.current?.value || '';
              dispatch(paste({ text }));
            }}
          >
            <div className="gs-menu-name">Paste</div>
            <div className="gs-menu-shortcut">
              <span className="gs-menu-underline">V</span>
            </div>
          </li>

          {(leftHeaderSelecting || topHeaderSelecting) && <li className="gs-menu-divider" />}

          {leftHeaderSelecting && (
            <li
              className={
                (table.maxNumRows !== -1 && tableHeight + height > table.maxNumRows) ||
                prevention.isPrevented(selectingTopCell?.prevention, prevention.AddRowAbove)
                  ? 'gs-disabled'
                  : 'gs-enabled'
              }
              onClick={() => {
                const newTable = table.addRows({
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
                Insert {height} row{height > 1 && 's'} above
              </div>
            </li>
          )}
          {leftHeaderSelecting && (
            <li
              className={
                (table.maxNumRows !== -1 && tableHeight + height > table.maxNumRows) ||
                prevention.isPrevented(selectingBottomCell?.prevention, prevention.AddRowBelow)
                  ? 'gs-disabled'
                  : 'gs-enabled'
              }
              onClick={(e) => {
                if (e.currentTarget.classList.contains('gs-disabled')) {
                  return;
                }
                selectingZone.startY += height;
                selectingZone.endY += height;
                choosing.y += height;
                const newTable = table.addRows({
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
                Insert {height} row{height > 1 && 's'} below
              </div>
            </li>
          )}
          {topHeaderSelecting && (
            <li
              className={
                (table.maxNumCols !== -1 && tableWidth + width > table.maxNumCols) ||
                prevention.isPrevented(selectingLeftCell?.prevention, prevention.AddColLeft)
                  ? 'gs-disabled'
                  : 'gs-enabled'
              }
              onClick={(e) => {
                if (e.currentTarget.classList.contains('gs-disabled')) {
                  return;
                }
                const newTable = table.addCols({
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
                Insert {width} column{width > 1 && 's'} left
              </div>
            </li>
          )}
          {topHeaderSelecting && (
            <li
              className={
                (table.maxNumCols !== -1 && tableWidth + width > table.maxNumCols) ||
                prevention.isPrevented(selectingRightCell?.prevention, prevention.AddColRight)
                  ? 'gs-disabled'
                  : 'gs-enabled'
              }
              onClick={(e) => {
                if (e.currentTarget.classList.contains('gs-disabled')) {
                  return;
                }
                selectingZone.startX += width;
                selectingZone.endX += width;
                choosing.x += width;
                const newTable = table.addCols({
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
                Insert {width} column{width > 1 && 's'} right
              </div>
            </li>
          )}
          {leftHeaderSelecting && (
            <li
              className={
                (table.minNumRows !== -1 && tableHeight - height < table.minNumRows) ||
                prevention.isPrevented(selectingTopCell?.prevention, prevention.DeleteRow)
                  ? 'gs-disabled'
                  : 'gs-enabled'
              }
              onClick={(e) => {
                if (e.currentTarget.classList.contains('gs-disabled')) {
                  return;
                }
                const newTable = table.deleteRows({
                  y: selectingTop,
                  numRows: height,
                  operator: 'USER',
                  reflection: {
                    selectingZone,
                    choosing,
                  },
                });
                dispatch(updateTable(newTable));
              }}
            >
              <div className="gs-menu-name">
                Delete {height} row{height > 1 && 's'}
              </div>
            </li>
          )}
          {topHeaderSelecting && (
            <li
              className={
                (table.minNumCols !== -1 && tableWidth - width < table.minNumCols) ||
                prevention.isPrevented(selectingRightCell?.prevention, prevention.DeleteCol)
                  ? 'gs-disabled'
                  : 'gs-enabled'
              }
              onClick={() => {
                const newTable = table.deleteCols({
                  x: selectingLeft,
                  numCols: width,
                  operator: 'USER',
                  reflection: {
                    selectingZone,
                    choosing,
                  },
                });
                dispatch(updateTable(newTable));
              }}
            >
              <div className="gs-menu-name">
                Delete {width} column{width > 0 && 's'}
              </div>
            </li>
          )}

          {(historyIndex > -1 || historyIndex < table.getHistorySize() - 1) && <li className="gs-menu-divider" />}

          {historyIndex > -1 && (
            <li
              className="gs-enabled"
              onClick={() => {
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
              className="gs-enabled"
              onClick={() => {
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
      </div>
    </Fixed>
  );
};
