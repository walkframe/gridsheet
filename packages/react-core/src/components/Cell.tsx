import { useContext, useRef, useCallback, useEffect, memo, useMemo, useState } from 'react';
import { x2c, y2r } from '@gridsheet/web';
import { zoneToArea, among, areaToRange } from '@gridsheet/web';
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
  setStore,
} from '../store/actions';

import { Context } from '../store';
import { FormulaError } from '@gridsheet/web';
import { Pending } from '@gridsheet/web';
import { insertRef, isRefInsertable } from '@gridsheet/web';
import { focus } from '@gridsheet/web';
import { isXSheetFocused } from '../store/helpers';
import type { FC, RefObject } from 'react';
import { isTouching, safePreventDefault } from '../lib/events';
import type { UserSheet, AreaType } from '@gridsheet/web';
import { getCellRectPositions } from '@gridsheet/web';
import { calcBelowPosition, hAlignTransform, type PopupPosition } from '@gridsheet/web';

/** How a rendered cell takes part in a merged range (see Tabular). */
export type MergeRender = {
  area: AreaType;
  /** true: this cell draws the whole range. false: covered — drawn by the host, renders nothing. */
  host: boolean;
};

type Props = {
  y: number;
  x: number;
  merge?: MergeRender;
};

export const Cell: FC<Props> = memo(({ y: rowY, x: colX, merge }) => {
  // Inside a merged range everything (content, events, editing) acts on the anchor cell; only
  // the <td>'s own position (rowY / colX) stays this cell's.
  const y = merge ? merge.area.top : rowY;
  const x = merge ? merge.area.left : colX;
  const covered = merge != null && !merge.host;
  const rowId = y2r(y);
  const colId = x2c(x);
  const address = `${colId}${rowId}`;
  const { store, dispatch } = useContext(Context);
  const isFirstPointed = useRef(true);

  const cellRef = useRef<HTMLTableCellElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
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
  const pointed = !covered && choosing.y === y && choosing.x === x;
  const _setEditorRect = useCallback(() => {
    // A merged host's wrap spans the whole range, so the editor covers all of it.
    const rect = (merge ? wrapRef.current : cellRef.current)?.getBoundingClientRect();
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
  }, [dispatch, merge]);

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
      // Autofill submit/clear is owned by StoreObserver's capture-phase window mouseup
      // (onUp) — the reliable place that always fires. Doing it here too would double-fill
      // (this bubble handler runs after onUp already cleared the store, with a stale
      // autofillDraggingTo closure). We only handle the formula-range-drag end.
      if (editingAnywhere) {
        dispatch(drag({ y: -1, x: -1 }));
      }
    },
    [editingAnywhere],
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
    // The handle sits at the bottom-right of the selection, which may be the corner of a merge.
    const [lastY, lastX] = merge ? [merge.area.bottom, merge.area.right] : [y, x];
    if (selectingArea.bottom === lastY && selectingArea.right === lastX) {
      return 'gs-autofill-drag';
    }
    return 'gs-autofill-drag gs-hidden';
  }, [editing, pointed, selectingArea, merge]);

  // Merged range: hide the grid lines inside it. Under border-collapse a shared edge may be
  // painted from either neighbour, so both sides of every inner edge are recoloured. Not
  // `transparent`: the grid lines are the --gs-border backdrop behind the table showing through,
  // so the inner edges are painted with the cell surface instead.
  const hidden = 'var(--gs-surface)';
  const mergeBorderStyle = merge
    ? {
        ...(colX > merge.area.left ? { borderLeftColor: hidden } : {}),
        ...(colX < merge.area.right ? { borderRightColor: hidden } : {}),
        ...(rowY > merge.area.top ? { borderTopColor: hidden } : {}),
        ...(rowY < merge.area.bottom ? { borderBottomColor: hidden } : {}),
      }
    : undefined;
  // The host's wrap is stretched from this cell to cover the whole range (the anchor may be
  // above/left of it when scrolled out).
  let mergeWrapStyle: React.CSSProperties | undefined;
  if (merge?.host && sheet) {
    const self = getCellRectPositions(sheet, { y: rowY, x: colX });
    const tl = getCellRectPositions(sheet, { y: merge.area.top, x: merge.area.left });
    const br = getCellRectPositions(sheet, { y: merge.area.bottom, x: merge.area.right });
    mergeWrapStyle = {
      top: tl.top - self.top,
      left: tl.left - self.left,
      width: `calc(100% + ${br.right - tl.left - self.width}px)`,
      height: `calc(100% + ${br.bottom - tl.top - self.height}px)`,
    };
  }

  if (!sheet) {
    return null;
  }

  const ownAddress = merge ? `${x2c(colX)}${y2r(rowY)}` : address;

  if (covered) {
    return (
      <td
        data-x={colX}
        data-y={rowY}
        data-address={ownAddress}
        className="gs-cell gs-merged-covered"
        style={mergeBorderStyle}
      />
    );
  }

  if (!input) {
    return (
      <td key={x} data-x={colX} data-y={rowY} data-address={ownAddress} className="gs-cell gs-hidden">
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
      data-x={colX}
      data-y={rowY}
      data-address={ownAddress}
      className={`gs-cell ${among(selectingArea, { y, x }) ? 'gs-selecting' : ''} ${pointed ? 'gs-choosing' : ''} ${
        editing ? 'gs-editing' : ''
      } ${isPendingCell ? 'gs-pending' : ''} ${merge ? 'gs-merged-host' : ''}`}
      style={{
        ...cell?.style,
        // A merged host paints its background on the stretched wrap (via .gs-cell-inner), not the td.
        ...(merge ? { background: undefined, backgroundColor: undefined } : {}),
        ...mergeBorderStyle,
      }}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
    >
      <div
        ref={wrapRef}
        className={`gs-cell-inner-wrap`}
        style={mergeWrapStyle}
        onMouseDown={handleDragStart}
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
