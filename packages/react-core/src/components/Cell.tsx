import { useContext, useRef, useCallback, useEffect, memo, useMemo } from 'react';
import { x2c, y2r } from '../lib/converters';
import { zoneToArea, among, areaToRange } from '../lib/structs';
import {
  choose,
  select,
  drag,
  write,
  setEditorRect,
  setContextMenuPosition,
  setAutofillDraggingTo,
  setEditingAddress,
  setDragging,
  submitAutofill,
  setStore,
} from '../store/actions';

import { Context } from '../store';
import { FormulaError } from '../formula/evaluator';
import { insertRef, isRefInsertable } from '../lib/input';
import { isXSheetFocused } from '../store/helpers';
import type { CSSProperties, FC, RefObject } from 'react';
import { isTouching, safePreventDefault } from '../lib/events';
import type { UserTable } from '../lib/table';

type Props = {
  y: number;
  x: number;
  operationStyle?: CSSProperties;
};

export const Cell: FC<Props> = memo(({ y, x, operationStyle }) => {
  const rowId = y2r(y);
  const colId = x2c(x);
  const address = `${colId}${rowId}`;
  const { store, dispatch } = useContext(Context);
  const isFirstPointed = useRef(true);

  const cellRef = useRef<HTMLTableCellElement>(null);
  const {
    tableReactive: tableRef,
    editingAddress,
    choosing,
    selectingZone,
    leftHeaderSelecting,
    topHeaderSelecting,
    editorRef,
    showAddress,
    autofillDraggingTo,
    contextMenuItems,
  } = store;
  const table = tableRef.current;

  // Whether the focus is on another sheet
  const xSheetFocused = isXSheetFocused(store);

  const lastFocused = table?.wire.lastFocused;

  const selectingArea = zoneToArea(selectingZone); // (top, left) -> (bottom, right)

  const editing = editingAddress === address;
  const pointed = choosing.y === y && choosing.x === x;
  const _setEditorRect = useCallback(() => {
    const rect = cellRef.current?.getBoundingClientRect();
    if (rect == null) {
      return null;
    }
    dispatch(
      setEditorRect({
        y: rect.y,
        x: rect.x,
        height: rect.height,
        width: rect.width,
      }),
    );
  }, []);

  useEffect(() => {
    // Avoid setting coordinates on the initial render to account for shifts caused by redrawing due to virtualization.
    if (pointed && !isFirstPointed.current) {
      _setEditorRect();
      return;
    }
    isFirstPointed.current = false;
  }, [pointed, editing]);

  if (!table) {
    return null;
  }

  const cell = table.getCellByPoint({ y, x }, 'SYSTEM');
  const writeCell = useCallback((value: string) => {
    dispatch(write({ value }));
  }, []);

  const sync = useCallback((table: UserTable) => {
    dispatch(setStore({ tableReactive: { current: table.__raw__ } }));
  }, []);

  let errorMessage = '';
  let rendered: any;
  try {
    rendered = table.render({ table, point: { y, x }, sync });
  } catch (e: any) {
    if (e instanceof FormulaError) {
      errorMessage = e.message;
      rendered = e.code;
    } else {
      errorMessage = e.message;
      rendered = '#UNKNOWN';
      console.error(e);
    }
    // TODO: debug flag
  }
  const input = editorRef.current;

  const editingAnywhere = !!(table.wire.editingAddress || editingAddress);

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      safePreventDefault(e);

      if (!isTouching(e)) {
        return false;
      }
      if (!input) {
        return false;
      }

      // Single cell selection only for touch events
      if (e.type.startsWith('touch')) {
        // Blur the input field to commit current value when selecting via touch
        if (editingAnywhere && input) {
          input.blur();
        }
        dispatch(choose({ y, x }));
        dispatch(select({ startY: y, startX: x, endY: y, endX: x }));
        return true;
      }

      // Normal drag operation for mouse events
      if (e.shiftKey) {
        dispatch(drag({ y, x }));
      } else {
        dispatch(select({ startY: y, startX: x, endY: -1, endX: -1 }));
      }

      dispatch(setDragging(true));
      const fullAddress = `${table.sheetPrefix(!xSheetFocused)}${address}`;
      if (editingAnywhere) {
        const inserted = insertRef({ input: lastFocused || null, ref: fullAddress });
        if (inserted) {
          return false;
        }
      }

      table.wire.lastFocused = input;
      input.focus();
      dispatch(setEditingAddress(''));

      if (autofillDraggingTo) {
        return false;
      }

      if (editingAnywhere) {
        writeCell(input.value);
      }
      if (!e.shiftKey) {
        dispatch(choose({ y, x }));
      }
      return true;
    },
    [editingAnywhere, input, address, xSheetFocused, lastFocused, autofillDraggingTo, writeCell],
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
        dispatch(submitAutofill(autofillDraggingTo));
        input?.focus();
        return false;
      }
      if (editingAnywhere) {
        dispatch(drag({ y: -1, x: -1 }));
      }
    },
    [autofillDraggingTo, editingAnywhere, input],
  );

  const handleDragging = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isTouching(e)) {
        return false;
      }

      // Do nothing for touch events
      if (e.type.startsWith('touch')) {
        return false;
      }

      safePreventDefault(e);
      e.stopPropagation();

      if (autofillDraggingTo) {
        dispatch(setAutofillDraggingTo({ x, y }));
        return false;
      }
      if (leftHeaderSelecting) {
        dispatch(drag({ y, x: table.getNumCols() }));
        return false;
      }
      if (topHeaderSelecting) {
        dispatch(drag({ y: table.getNumRows(), x }));
        return false;
      }
      if (editingAnywhere && !isRefInsertable(lastFocused || null)) {
        return false;
      }
      dispatch(drag({ y, x }));

      if (editingAnywhere) {
        const newArea = zoneToArea({ ...selectingZone, endY: y, endX: x });
        const fullRange = `${table.sheetPrefix(!xSheetFocused)}${areaToRange(newArea)}`;
        insertRef({ input: lastFocused || null, ref: fullRange });
      }
      //table.wire.transmit(); // Force drawing because the formula is not reflected in largeInput
      return true;
    },
    [
      autofillDraggingTo,
      leftHeaderSelecting,
      topHeaderSelecting,
      table,
      editingAnywhere,
      lastFocused,
      selectingZone,
      xSheetFocused,
    ],
  );

  const handleAutofillMouseDown = useCallback((e: React.MouseEvent) => {
    dispatch(setAutofillDraggingTo({ x, y }));
    dispatch(setDragging(true));
    e.stopPropagation();
  }, []);

  // --- Memoize event handlers with useCallback ---
  const onContextMenu = useCallback(
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

  const onDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLTableCellElement>) => {
      e.stopPropagation();
      safePreventDefault(e);
      setEditingAddress(address);
      const dblclick = document.createEvent('MouseEvents');
      dblclick.initEvent('dblclick', true, true);
      input?.dispatchEvent(dblclick);
      return false;
    },
    [address, input],
  );

  const autofillDragClass = useMemo(() => {
    if (!editing && pointed && selectingArea.bottom === -1) {
      return 'gs-autofill-drag';
    }

    if (selectingArea.bottom === y && selectingArea.right === x) {
      return 'gs-autofill-drag';
    }
    return 'gs-autofill-drag gs-hidden';
  }, [editing, pointed, selectingArea]);

  if (!input) {
    return (
      <td key={x} data-x={x} data-y={y} data-address={address} className="gs-cell gs-hidden">
        <div className="gs-cell-inner-wrap">
          <div className="gs-cell-inner">
            <div className="gs-cell-rendered"></div>
          </div>
          <div className="gs-autofill-drag"></div>
        </div>
      </td>
    );
  }

  return (
    <td
      key={x}
      ref={cellRef}
      data-x={x}
      data-y={y}
      data-address={address}
      className={`gs-cell ${among(selectingArea, { y, x }) ? 'gs-selecting' : ''} ${pointed ? 'gs-choosing' : ''} ${
        editing ? 'gs-editing' : ''
      }`}
      style={{
        ...cell?.style,
        ...operationStyle,
      }}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
    >
      <div
        className={`gs-cell-inner-wrap`}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onMouseEnter={handleDragging}
        onMouseUp={handleDragEnd}
      >
        <div
          className={'gs-cell-inner'}
          style={{
            ...cell?.style,
            justifyContent: cell?.justifyContent || 'left',
            alignItems: cell?.alignItems || 'start',
          }}
        >
          {errorMessage && <div className="gs-formula-error-triangle" title={errorMessage} />}
          {showAddress && <div className="gs-cell-label">{address}</div>}
          <div className="gs-cell-rendered">{rendered}</div>
        </div>
        <div className={autofillDragClass} onMouseDown={handleAutofillMouseDown}></div>
      </div>
    </td>
  );
});
