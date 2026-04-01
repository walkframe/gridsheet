import { useContext, useRef, useCallback, useEffect, memo, useMemo, useState } from 'react';
import { x2c, y2r } from '@gridsheet/core';
import { zoneToArea, among, areaToRange } from '@gridsheet/core';
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
import { FormulaError } from '@gridsheet/core';
import { Pending } from '@gridsheet/core';
import { insertRef, isRefInsertable } from '@gridsheet/core';
import { focus } from '@gridsheet/core';
import { isXSheetFocused } from '../store/helpers';
import type { FC, RefObject } from 'react';
import { isTouching, safePreventDefault } from '../lib/events';
import type { UserSheet } from '@gridsheet/core';
import { calcBelowPosition, hAlignTransform, type PopupPosition } from '@gridsheet/core';

type Props = {
  y: number;
  x: number;
};

export const Cell: FC<Props> = memo(({ y, x }) => {
  const rowId = y2r(y);
  const colId = x2c(x);
  const address = `${colId}${rowId}`;
  const { store, dispatch } = useContext(Context);
  const isFirstPointed = useRef(true);

  const cellRef = useRef<HTMLTableCellElement>(null);
  const [errorTooltipPos, setErrorTooltipPos] = useState<PopupPosition | null>(null);
  const {
    sheetReactive,
    editingAddress,
    choosing,
    selectingZone,
    leftHeaderSelecting,
    topHeaderSelecting,
    editorRef,
    autofillDraggingTo,
    contextMenu,
  } = store;
  const sheet = sheetReactive.current;

  // Whether the focus is on another sheet
  const xSheetFocused = isXSheetFocused(store);

  const lastFocused = sheet?.registry.lastFocused;

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
  }, [dispatch]);

  useEffect(() => {
    // Avoid setting coordinates on the initial render to account for shifts caused by redrawing due to virtualization.
    if (pointed && !isFirstPointed.current) {
      _setEditorRect();
      return;
    }
    isFirstPointed.current = false;
  }, [pointed, editing, _setEditorRect]);

  const cell = sheet?.getCell({ y, x }, { resolution: 'SYSTEM' });

  const writeCell = useCallback(
    (value: string) => {
      dispatch(write({ value }));
    },
    [dispatch],
  );

  const apply = useCallback(
    (sheet: UserSheet) => {
      dispatch(setStore({ sheetReactive: { current: sheet.__raw__ } }));
    },
    [dispatch],
  );

  let errorMessage = '';
  let rendered: any;
  try {
    if (sheet) {
      rendered = sheet.render({ sheet, point: { y, x }, apply, value: undefined });
    }
  } catch (e: any) {
    if (FormulaError.is(e)) {
      errorMessage = e.message;
      rendered = e.code;
    } else {
      errorMessage = e.message;
      rendered = '#UNKNOWN';
    }
  }
  const [, v] = sheet?.getSolvedCache({ y, x }) ?? [undefined, undefined];
  const isPendingCell = Pending.is(v);
  const input = editorRef.current;

  const editingAnywhere = !!(sheet?.registry.editingAddress || editingAddress);

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      safePreventDefault(e);

      if (!sheet) {
        return false;
      }
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
      const fullAddress = `${sheet.sheetPrefix(!xSheetFocused)}${address}`;
      if (editingAnywhere) {
        const inserted = insertRef({ input: lastFocused || null, ref: fullAddress });
        if (inserted) {
          return false;
        }
      }

      sheet.registry.lastFocused = input;
      focus(input);
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
    [editingAnywhere, input, address, xSheetFocused, lastFocused, autofillDraggingTo, writeCell, sheet],
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
        focus(input);
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

      if (!sheet) {
        return false;
      }

      safePreventDefault(e);
      e.stopPropagation();

      if (autofillDraggingTo) {
        dispatch(setAutofillDraggingTo({ x, y }));
        return false;
      }
      if (leftHeaderSelecting) {
        dispatch(drag({ y, x: sheet.numCols }));
        return false;
      }
      if (topHeaderSelecting) {
        dispatch(drag({ y: sheet.numRows, x }));
        return false;
      }
      if (editingAnywhere && !isRefInsertable(lastFocused || null)) {
        return false;
      }
      dispatch(drag({ y, x }));

      if (editingAnywhere) {
        const newArea = zoneToArea({ ...selectingZone, endY: y, endX: x });
        const fullRange = `${sheet.sheetPrefix(!xSheetFocused)}${areaToRange(newArea)}`;
        insertRef({ input: lastFocused || null, ref: fullRange });
      }
      //sheet.registry.transmit(); // Force drawing because the formula is not reflected in largeInput
      return true;
    },
    [
      autofillDraggingTo,
      leftHeaderSelecting,
      topHeaderSelecting,
      sheet,
      editingAnywhere,
      lastFocused,
      selectingZone,
      xSheetFocused,
    ],
  );

  const handleAutofillMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dispatch(setAutofillDraggingTo({ x, y }));
      dispatch(setDragging(true));
      e.stopPropagation();
    },
    [dispatch, x, y],
  );

  const handleErrorTriangleEnter = useCallback(() => {
    const rect = cellRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    setErrorTooltipPos(calcBelowPosition(rect));
  }, []);

  const handleErrorTriangleLeave = useCallback(() => {
    setErrorTooltipPos(null);
  }, []);

  // --- Memoize event handlers with useCallback ---
  const onContextMenu = useCallback(
    (e: React.MouseEvent<HTMLTableCellElement>) => {
      if (contextMenu.length > 0) {
        e.stopPropagation();
        safePreventDefault(e);
        dispatch(setContextMenuPosition({ y: e.clientY, x: e.clientX }));
        return false;
      }
      return true;
    },
    [contextMenu.length],
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

  if (!sheet) {
    return null;
  }

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
      } ${isPendingCell ? 'gs-pending' : ''}`}
      style={{
        ...cell?.style,
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
            textAlign: cell?.style?.textAlign || cell?.justifyContent || 'left',
            alignItems: cell?.alignItems || 'start',
          }}
        >
          {errorMessage && (
            <div
              className="gs-formula-error-triangle"
              onMouseEnter={handleErrorTriangleEnter}
              onMouseLeave={handleErrorTriangleLeave}
            />
          )}
          <div
            className="gs-cell-rendered"
            style={
              cell?.alignItems
                ? {
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent:
                      cell.alignItems === 'center' ? 'center' : cell.alignItems === 'end' ? 'flex-end' : undefined,
                  }
                : undefined
            }
          >
            {rendered}
          </div>
        </div>
        {errorMessage && errorTooltipPos && (
          <div
            className="gs-formula-error-tooltip"
            style={{
              top: errorTooltipPos.y + 4,
              left: errorTooltipPos.x,
              transform: hAlignTransform(errorTooltipPos.hAlign),
            }}
          >
            {errorMessage}
          </div>
        )}
        <div className={autofillDragClass} onMouseDown={handleAutofillMouseDown}></div>
      </div>
    </td>
  );
});
