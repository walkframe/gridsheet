import React from 'react';
import { y2r } from '../lib/converters';
import { between, zoneToArea } from '../lib/structs';
import { Context } from '../store';
import {
  choose,
  drag,
  select,
  selectRows,
  setContextMenuPosition,
  setEditingCell,
  setResizingPositionY,
} from '../store/actions';
import { DUMMY_IMG, DEFAULT_HEIGHT } from '../constants';
import * as prevention from '../lib/prevention';
import { insertRef, isRefInsertable } from '../lib/input';
import { useSheetContext } from './SheetProvider';

type Props = {
  y: number;
};

export const HeaderCellLeft: React.FC<Props> = React.memo(({ y }) => {
  const rowId = `${y2r(y)}`;
  const { store, dispatch } = React.useContext(Context);

  const {
    choosing,
    selectingZone,
    leftHeaderSelecting,
    resizingRect,
    headerWidth,
    editorRef,
    table,
    autofillDraggingTo,
  } = store;

  const row = table.getByPoint({ y, x: 0 });
  const height = row?.height || DEFAULT_HEIGHT;

  const [sheetProvided, sheetContext] = useSheetContext();
  const differentSheetFocused = sheetProvided && sheetContext?.lastFocusedRef !== store.lastFocusedRef;

  const lastFocusedRef = sheetContext?.lastFocusedRef || store.lastFocusedRef;
  const lastInput = lastFocusedRef.current;

  return (
    <th
      data-y={y}
      className={`gs-th gs-th-left ${choosing.y === y ? 'gs-choosing' : ''} ${
        between({ start: selectingZone.startY, end: selectingZone.endY }, y)
          ? leftHeaderSelecting
            ? 'gs-th-selecting'
            : 'gs-selecting'
          : ''
      }`}
      style={{ height }}
      onClick={(e) => {
        let startY = e.shiftKey ? selectingZone.startY : y;
        if (startY === -1) {
          startY = choosing.y;
        }
        const fullColId = `${table.sheetPrefix(!differentSheetFocused)}${rowId}:${rowId}`;
        const inserted = insertRef(lastInput, fullColId);
        if (inserted) {
          return false;
        }

        dispatch(
          selectRows({
            range: { start: startY, end: y },
            numCols: table.getNumCols(),
          }),
        );
        dispatch(setContextMenuPosition({ y: -1, x: -1 }));
        dispatch(choose({ y: startY, x: 1 }));
        dispatch(setEditingCell(''));
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
        className="gs-th-inner-wrap"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
          const insertable = isRefInsertable(lastInput);
          if (insertable) {
            dispatch(select({ startY: y, startX: table.getNumCols(), endY: y, endX: 0 }));
            return false;
          }
          dispatch(
            selectRows({
              range: { start: y, end: y },
              numCols: table.getNumCols(),
            }),
          );
          dispatch(choose({ y, x: 1 }));
          return false;
        }}
        onDragEnd={() => {
          if (isRefInsertable(lastInput)) {
            dispatch(select({ startY: -1, startX: -1, endY: -1, endX: -1 }));
          }
        }}
        onDragEnter={() => {
          const newArea = zoneToArea({ ...selectingZone, endY: y, endX: 1 });
          const [top, bottom] = [y2r(newArea.top), y2r(newArea.bottom)];
          const fullRange = `${table.sheetPrefix(!differentSheetFocused)}${top}:${bottom}`;
          insertRef(lastInput, fullRange);

          if (resizingRect.y === -1 && autofillDraggingTo == null) {
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
          e.dataTransfer.dropEffect = 'move';
          e.preventDefault();
        }}
      >
        <div className="gs-th-inner" style={{ width: headerWidth, position: 'relative' }}>
          {row?.labeler ? table.getLabel(row.labeler, y) : rowId}
          <div
            className={`gs-resizer ${prevention.isPrevented(row?.prevention, prevention.Resize) ? 'gs-protected' : ''}`}
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
});
