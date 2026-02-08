import type { FC } from 'react';
import { useContext, useCallback, memo, useRef } from 'react';
import { y2r } from '../lib/converters';
import { between, zoneToArea } from '../lib/structs';
import { Context } from '../store';
import {
  choose,
  drag,
  select,
  selectRows,
  setAutofillDraggingTo,
  setContextMenuPosition,
  setDragging,
  setEditingAddress,
  setResizingPositionY,
  submitAutofill,
  write,
} from '../store/actions';
import { DEFAULT_HEIGHT } from '../constants';
import * as prevention from '../lib/operation';
import { insertRef } from '../lib/input';
import { isXSheetFocused } from '../store/helpers';
import { ScrollHandle } from './ScrollHandle';
import { isTouching, safePreventDefault } from '../lib/events';
import { useDebounceCallback } from './hooks';

type Props = {
  y: number;
};

export const HeaderCellLeft: FC<Props> = memo(({ y }) => {
  const rowId = `${y2r(y)}`;
  const { store, dispatch } = useContext(Context);

  const {
    choosing,
    editingAddress,
    selectingZone,
    leftHeaderSelecting,
    editorRef,
    tableReactive: tableRef,
    autofillDraggingTo,
    dragging,
    contextMenuItems,
  } = store;
  const table = tableRef.current;

  const row = table?.getCellByPoint({ y, x: 0 }, 'SYSTEM');
  const height = row?.height || DEFAULT_HEIGHT;

  const xSheetFocused = isXSheetFocused(store);
  const lastFocused = table?.wire.lastFocused;

  const editingAnywhere = !!(table?.wire.editingAddress || editingAddress);

  const writeCell = useCallback(
    (value: string) => {
      dispatch(write({ value, point: choosing }));
    },
    [choosing],
  );

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    dispatch(setResizingPositionY([y, e.clientY, e.clientY]));
    e.stopPropagation();
    safePreventDefault(e);
  }, []);

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      safePreventDefault(e);

      if (!isTouching(e) || !table) {
        return false;
      }
      if (dragging) {
        return false;
      }

      // Single row selection only for touch events
      if (e.type.startsWith('touch')) {
        // Blur the input field to commit current value when selecting via touch
        if (editingAnywhere && editorRef.current) {
          editorRef.current.blur();
        }
        dispatch(choose({ y, x: 1 }));
        dispatch(select({ startY: y, startX: 1, endY: y, endX: table.getNumCols() }));
        return true;
      }

      // Normal drag operation for mouse events
      dispatch(select({ startY: y, startX: 1, endY: y, endX: -1 }));
      const fullAddress = `${table.sheetPrefix(!xSheetFocused)}${rowId}:${rowId}`;
      if (editingAnywhere) {
        const inserted = insertRef({ input: lastFocused || null, ref: fullAddress });
        if (inserted) {
          dispatch(select({ startY: y, startX: table.getNumCols(), endY: y, endX: 0 }));
          return false;
        }
      }

      let startY = e.shiftKey ? selectingZone.startY : y;
      if (startY === -1) {
        startY = choosing.y;
      }

      dispatch(
        selectRows({
          range: { start: startY, end: y },
          numCols: table.getNumCols(),
        }),
      );

      if (editingAnywhere) {
        writeCell(lastFocused?.value ?? '');
      }
      dispatch(choose({ y: startY, x: 1 }));
      dispatch(setEditingAddress(''));
      dispatch(setDragging(true));

      if (autofillDraggingTo) {
        return false;
      }
      return true;
    },
    [dragging, editingAnywhere, xSheetFocused, rowId, lastFocused, selectingZone, choosing, autofillDraggingTo],
  );

  const handleDragEnd = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (e.type.startsWith('touch')) {
        return;
      }

      safePreventDefault(e);
      dispatch(setDragging(false));
      if (autofillDraggingTo) {
        editorRef.current!.focus();
        return false;
      }
    },
    [autofillDraggingTo],
  );

  const handleDragging = useDebounceCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isTouching(e) || !table) {
      return false;
    }

    // Do nothing for touch events
    if (e.type.startsWith('touch')) {
      return false;
    }

    safePreventDefault(e);
    e.stopPropagation();

    if (autofillDraggingTo) {
      dispatch(setAutofillDraggingTo({ y, x: 1 }));
      return false;
    }

    if (editingAnywhere) {
      const newArea = zoneToArea({ ...selectingZone, endY: y, endX: 1 });
      const [top, bottom] = [y2r(newArea.top), y2r(newArea.bottom)];
      const fullRange = `${table.sheetPrefix(!xSheetFocused)}${top}:${bottom}`;
      insertRef({ input: lastFocused || null, ref: fullRange });
    }

    if (autofillDraggingTo == null) {
      const { startX } = selectingZone;
      if (startX === 1) {
        dispatch(drag({ y, x: table.getNumCols() }));
      } else {
        dispatch(drag({ y, x: 1 }));
      }
    }
    return false;
  }, 100);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLTableCellElement>) => {
      if (contextMenuItems.length > 0) {
        e.stopPropagation();
        safePreventDefault(e);
        dispatch(setContextMenuPosition({ y: e.clientY, x: e.clientX }));
        return false;
      }
      return true;
    },
    [contextMenuItems.length],
  );

  if (!table) {
    return null;
  }

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
      onContextMenu={handleContextMenu}
    >
      <div
        className="gs-th-inner-wrap"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onMouseEnter={handleDragging}
        onMouseUp={handleDragEnd}
      >
        <div className="gs-th-inner" style={{ width: table.headerWidth, position: 'relative' }}>
          <ScrollHandle
            style={{
              position: 'absolute',
              zIndex: leftHeaderSelecting ? -1 : 1,
            }}
            horizontal={-1}
          />
          {table.getLabel(row?.labeler, y) ?? rowId}
          <div
            className={`
              gs-resizer
              ${prevention.hasOperation(row?.prevention, prevention.Resize) ? 'gs-protected' : ''}
              ${dragging ? 'gs-hidden' : ''}`}
            style={{ width: table.headerWidth }}
            onMouseDown={handleResizeMouseDown}
          ></div>
        </div>
      </div>
    </th>
  );
});
