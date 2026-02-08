import type { FC } from 'react';
import { useContext, useCallback, memo, useRef } from 'react';
import { x2c } from '../lib/converters';
import { between, zoneToArea } from '../lib/structs';
import { Context } from '../store';
import {
  choose,
  drag,
  select,
  selectCols,
  setAutofillDraggingTo,
  setContextMenuPosition,
  setDragging,
  setEditingAddress,
  setResizingPositionX,
  submitAutofill,
  write,
} from '../store/actions';
import { DEFAULT_WIDTH } from '../constants';
import * as prevention from '../lib/operation';
import { insertRef } from '../lib/input';
import { isXSheetFocused } from '../store/helpers';
import { ScrollHandle } from './ScrollHandle';
import { isTouching, safePreventDefault } from '../lib/events';
import { useDebounceCallback } from './hooks';

type Props = {
  x: number;
};

export const HeaderCellTop: FC<Props> = memo(({ x }) => {
  const colId = x2c(x);
  const { store, dispatch } = useContext(Context);

  const {
    tableReactive: tableRef,
    editingAddress,
    choosing,
    selectingZone,
    topHeaderSelecting,
    editorRef,
    autofillDraggingTo,
    dragging,
    contextMenuItems,
  } = store;
  const table = tableRef.current;

  const col = table?.getCellByPoint({ y: 0, x }, 'SYSTEM');
  const width = col?.width || DEFAULT_WIDTH;

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
    dispatch(setResizingPositionX([x, e.clientX, e.clientX]));
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

      // Single column selection only for touch events
      if (e.type.startsWith('touch')) {
        // Blur the input field to commit current value when selecting via touch
        if (editingAnywhere && editorRef.current) {
          editorRef.current.blur();
        }
        dispatch(choose({ y: 1, x }));
        dispatch(select({ startY: 1, startX: x, endY: table.getNumRows(), endX: x }));
        return true;
      }

      dispatch(select({ startY: 1, startX: x, endY: -1, endX: x }));
      const fullAddress = `${table.sheetPrefix(!xSheetFocused)}${colId}:${colId}`;
      if (editingAnywhere) {
        const inserted = insertRef({ input: lastFocused || null, ref: fullAddress });
        if (inserted) {
          dispatch(select({ startY: table.getNumRows(), startX: x, endY: 0, endX: x }));
          return false;
        }
      }

      let startX = e.shiftKey ? selectingZone.startX : x;
      if (startX === -1) {
        startX = choosing.x;
      }

      dispatch(
        selectCols({
          range: { start: startX, end: x },
          numRows: table.getNumRows(),
        }),
      );

      if (editingAnywhere) {
        writeCell(lastFocused?.value ?? '');
      }
      dispatch(choose({ y: 1, x: startX }));
      dispatch(setEditingAddress(''));
      dispatch(setDragging(true));

      if (autofillDraggingTo) {
        return false;
      }
      return true;
    },
    [dragging, editingAnywhere, xSheetFocused, colId, lastFocused, selectingZone, choosing, autofillDraggingTo],
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

    if (e.type.startsWith('touch')) {
      return false;
    }

    safePreventDefault(e);
    e.stopPropagation();

    if (autofillDraggingTo) {
      dispatch(setAutofillDraggingTo({ y: 1, x }));
      return false;
    }

    if (editingAnywhere) {
      const newArea = zoneToArea({ ...selectingZone, endY: 1, endX: x });
      const [left, right] = [x2c(newArea.left), x2c(newArea.right)];
      const fullRange = `${table.sheetPrefix(!xSheetFocused)}${left}:${right}`;
      insertRef({ input: lastFocused || null, ref: fullRange });
    }

    if (autofillDraggingTo == null) {
      const { startY } = selectingZone;
      if (startY === 1) {
        dispatch(drag({ y: table.getNumRows(), x }));
      } else {
        dispatch(drag({ y: 1, x }));
      }
    }
    return false;
  }, 100);

  if (!table) {
    return (
      <th data-x={x} className="gs-th gs-th-top gs-hidden">
        <div className="gs-th-inner-wrap">
          <div className="gs-th-inner">
            <ScrollHandle style={{ position: 'absolute' }} vertical={-1} />
            <div className="gs-resizer"></div>
          </div>
        </div>
      </th>
    );
  }

  return (
    <th
      data-x={x}
      className={`gs-th gs-th-top ${choosing.x === x ? 'gs-choosing' : ''} ${
        between({ start: selectingZone.startX, end: selectingZone.endX }, x)
          ? topHeaderSelecting
            ? 'gs-th-selecting'
            : 'gs-selecting'
          : ''
      }`}
      style={{ width, minWidth: width, maxWidth: width }}
      onContextMenu={(e) => {
        if (contextMenuItems.length > 0) {
          e.stopPropagation();
          safePreventDefault(e);
          dispatch(setContextMenuPosition({ y: e.clientY, x: e.clientX }));
          return false;
        }
        return true;
      }}
    >
      <div
        className="gs-th-inner-wrap"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onMouseEnter={handleDragging}
        onMouseUp={handleDragEnd}
      >
        <div className="gs-th-inner" style={{ height: table.headerHeight, position: 'relative' }}>
          <ScrollHandle
            style={{
              position: 'absolute',
              zIndex: topHeaderSelecting ? -1 : 1,
            }}
            vertical={-1}
          />
          {table.getLabel(col?.labeler, x) ?? colId}
          <div
            className={`
              gs-resizer 
              ${prevention.hasOperation(col?.prevention, prevention.Resize) ? 'gs-protected' : ''}
              ${dragging ? 'gs-hidden' : ''}`}
            style={{ height: table.headerHeight }}
            onMouseDown={handleResizeMouseDown}
          >
            <i />
          </div>
        </div>
      </div>
    </th>
  );
});
