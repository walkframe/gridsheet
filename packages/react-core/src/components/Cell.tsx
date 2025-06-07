import { useContext, useRef, useCallback, useEffect } from 'react';
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
} from '../store/actions';

import { Context } from '../store';
import { FormulaError } from '../formula/evaluator';
import { insertRef, isRefInsertable } from '../lib/input';
import { isXSheetFocused } from '../store/helpers';
import type { CSSProperties, FC } from 'react';
import { isTouching } from '../lib/events';

type Props = {
  y: number;
  x: number;
  operationStyle?: CSSProperties;
};

export const Cell: FC<Props> = ({ y, x, operationStyle }) => {
  const rowId = y2r(y);
  const colId = x2c(x);
  const address = `${colId}${rowId}`;
  const { store, dispatch } = useContext(Context);
  const isFirstPointed = useRef(true);

  //const [sheetProvided, sheetContext] = useSheetContext();

  const cellRef = useRef<HTMLTableCellElement>(null);
  const {
    table,
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

  // Whether the focus is on another sheet
  const xSheetFocused = isXSheetFocused(store);

  const lastFocused = table.hub.lastFocused;

  const selectingArea = zoneToArea(selectingZone); // (top, left) -> (bottom, right)

  const editing = editingAddress === address;
  const pointed = choosing.y === y && choosing.x === x;
  const _setEditorRect = useCallback(() => {
    const rect = cellRef.current!.getBoundingClientRect();
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
      if (!editing) {
        //const valueString = table.stringify({point: { y, x }, evaluates: false});
        //dispatch(setInputting(valueString));
      }
      return;
    }
    isFirstPointed.current = false;
  }, [pointed, editing]);
  const cell = table.getByPoint({ y, x });
  const writeCell = (value: string) => {
    dispatch(write({ value }));
  };

  let errorMessage = '';
  let rendered: any;
  try {
    rendered = table.render({ table, point: { y, x }, writer: writeCell });
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
  if (!input) {
    return null;
  }

  const editingAnywhere = !!(table.hub.editingAddress || editingAddress);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isTouching(e)) {
      return false;
    }

    if (e.shiftKey) {
      dispatch(drag({ y, x }));
    } else {
      dispatch(select({ startY: y, startX: x, endY: -1, endX: -1 }));
    }

    dispatch(setDragging(true));
    const fullAddress = `${table.sheetPrefix(!xSheetFocused)}${address}`;
    if (editingAnywhere) {
      const inserted = insertRef({ input: lastFocused, ref: fullAddress });
      if (inserted) {
        return false;
      }
    }

    table.hub.lastFocused = input;
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
  };
  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(setDragging(false));
    if (autofillDraggingTo) {
      dispatch(submitAutofill(autofillDraggingTo));
      input.focus();
      return false;
    }
    if (editingAnywhere) {
      dispatch(drag({ y: -1, x: -1 }));
    }
  };

  const handleDragging = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isTouching(e)) {
      return false;
    }
    e.preventDefault();
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
    if (editingAnywhere && !isRefInsertable(lastFocused)) {
      return false;
    }
    dispatch(drag({ y, x }));

    if (editingAnywhere) {
      const newArea = zoneToArea({ ...selectingZone, endY: y, endX: x });
      const fullRange = `${table.sheetPrefix(!xSheetFocused)}${areaToRange(newArea)}`;
      insertRef({ input: lastFocused, ref: fullRange });
    }
    table.hub.reflect(); // Force drawing because the formula is not reflected in largeInput
    return true;
  };

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
      onContextMenu={(e) => {
        if (contextMenuItems.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          dispatch(setContextMenuPosition({ y: e.clientY, x: e.clientX }));
          return false;
        }
        return true;
      }}
      onDoubleClick={(e) => {
        e!.preventDefault();
        setEditingAddress(address);
        const dblclick = document.createEvent('MouseEvents');
        dblclick.initEvent('dblclick', true, true);
        input.dispatchEvent(dblclick);
        return false;
      }}
    >
      <div
        className={`gs-cell-inner-wrap`}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onMouseEnter={handleDragging}
        onTouchMove={handleDragging}
        onMouseUp={handleDragEnd}
        onTouchEnd={handleDragEnd}
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
        {((!editing && pointed && selectingArea.bottom === -1) ||
          (selectingArea.bottom === y && selectingArea.right === x)) && (
          <div
            className="gs-autofill-drag"
            onMouseDown={(e) => {
              dispatch(setAutofillDraggingTo({ x, y }));
              dispatch(setDragging(true));
              e.stopPropagation();
            }}
          ></div>
        )}
      </div>
    </td>
  );
};
