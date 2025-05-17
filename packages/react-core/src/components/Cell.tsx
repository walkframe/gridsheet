import { useContext, useRef, useCallback, useEffect } from 'react';
import { x2c, y2r } from '../lib/converters';
import { zoneToArea, among, zoneShape, areaToZone, areaToRange } from '../lib/structs';
import {
  choose,
  select,
  drag,
  write,
  setEditorRect,
  setContextMenuPosition,
  setAutofillDraggingTo,
  updateTable,
  setEditingAddress,
  setInputting,
} from '../store/actions';

import { DUMMY_IMG } from '../constants';

import { Context } from '../store';
import { FormulaError } from '../formula/evaluator';
import { Autofill } from '../lib/autofill';
import { insertRef, isRefInsertable } from '../lib/input';
import { isDifferentSheetFocused } from '../store/helpers';
import type { CleanupRef } from '../renderers/core';
import type { CSSProperties, FC } from 'react';

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
  const renderedRef = useRef<CleanupRef>(null);
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
    lastEdited,
  } = store;

  // Whether the focus is on another sheet
  const differentSheetFocused = isDifferentSheetFocused(store);

  const lastFocused = table.conn.lastFocused;

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
        const valueString = table.stringify({point: { y, x }, evaluates: false});
        dispatch(setInputting(valueString));
      }
      return;
    }
    isFirstPointed.current = false;
  }, [pointed, editing]);
  useEffect(() => {
    return () => renderedRef.current?.cleanup?.();
  }, []);
  const cell = table.getByPoint({ y, x });
  const writeCell = (value: string) => {
    if (lastEdited !== value) {
      dispatch(write(value));
      return;
    }
  };

  let errorMessage = '';
  let rendered: any;
  try {
    rendered = table.render({ table, point: { y, x }, writer: writeCell, renderedRef });
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

  const editingAnywhere = !!(table.conn.editingAddress || editingAddress);

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
        e.preventDefault();
        dispatch(setContextMenuPosition({ y: e.clientY, x: e.clientX }));
        return false;
      }}
      onClick={(e) => {
        if (autofillDraggingTo) {
          return false;
        }
        const fullAddress = `${table.sheetPrefix(!differentSheetFocused)}${address}`;
        if (editingAnywhere) {
          const inserted = insertRef({input: lastFocused, ref: fullAddress});
          if (inserted) {
            return false;
          }
        }
        dispatch(setEditingAddress(''));
        dispatch(setContextMenuPosition({ y: -1, x: -1 }));
        input.focus();
        if (e.shiftKey) {
          dispatch(drag({ y, x }));
          return;
        } else {
          dispatch(choose({ y, x }));
          dispatch(select({ startY: y, startX: x, endY: -1, endX: -1 }));
          _setEditorRect();
        }
        const valueString = table.stringify({point: { y, x }, evaluates: false});
        dispatch(setInputting(valueString));
      }}
      onDoubleClick={(e) => {
        e!.preventDefault();
        setEditingAddress(address);
        const dblclick = document.createEvent('MouseEvents');
        dblclick.initEvent('dblclick', true, true);
        input.dispatchEvent(dblclick);
        return false;
      }}
      draggable
      onDragStart={(e) => {
        if (autofillDraggingTo) {
          return false;
        }
        e!.dataTransfer!.setDragImage(DUMMY_IMG, 0, 0);
        dispatch(select({ startY: y, startX: x, endY: y, endX: x }));
        const insertable = isRefInsertable(lastFocused);
        
        if (insertable) {
          return editingAnywhere;
        } else if (insertable != null) {
          writeCell(input.value);
        }
        dispatch(choose({ y, x }));
        input.focus();
        dispatch(setInputting(''));
      }}
      onDragEnd={() => {
        if (autofillDraggingTo) {
          if (autofillDraggingTo.x !== x || autofillDraggingTo.y !== y) {
            const autofill = new Autofill(store, autofillDraggingTo);
            dispatch(updateTable(autofill.applied));
            dispatch(select(areaToZone(autofill.wholeArea)));
            input.focus();
          }
          dispatch(setAutofillDraggingTo(null));
          return false;
        }
        const { height: h, width: w } = zoneShape(selectingZone);
        if (h + w === 0) {
          dispatch(select({ startY: -1, startX: -1, endY: -1, endX: -1 }));
        }
        if (isRefInsertable(lastFocused) && editingAnywhere) {
          dispatch(select({ startY: -1, startX: -1, endY: -1, endX: -1 }));
        }
        lastFocused?.focus();
      }}
      onDragEnter={() => {
        if (autofillDraggingTo) {
          if (!among(selectingArea, { x, y })) {
            dispatch(setAutofillDraggingTo({ x, y }));
          }
          return false;
        }
        if (leftHeaderSelecting) {
          dispatch(drag({ y: table.getNumRows(), x }));
          return false;
        }
        if (topHeaderSelecting) {
          dispatch(drag({ y, x: table.getNumCols() }));
          return false;
        }
        dispatch(drag({ y, x }));

        if (editingAnywhere) {
          const newArea = zoneToArea({ ...selectingZone, endY: y, endX: x });
          const fullRange = `${table.sheetPrefix(!differentSheetFocused)}${areaToRange(newArea)}`;
          insertRef({input: lastFocused, ref: fullRange, edgeInsertable: true});
          return true;
        }
        return false;

        //sheetContext?.forceRender?.(); // Force drawing because the formula is not reflected in largeInput
        return true;
      }}
    >
      <div className={`gs-cell-inner-wrap`}>
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
          <div 
            className="gs-cell-rendered"
            ref={renderedRef}
          >{rendered}</div>
        </div>
        {((!editing && pointed && selectingArea.bottom === -1) ||
          (selectingArea.bottom === y && selectingArea.right === x)) && (
          <div
            className="gs-autofill-drag"
            draggable
            onDragStart={(e) => {
              e!.dataTransfer!.setDragImage(DUMMY_IMG, 0, 0);
              dispatch(setAutofillDraggingTo({ x, y }));
              e.stopPropagation();
            }}
          ></div>
        )}
      </div>
    </td>
  );
};
