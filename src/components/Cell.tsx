import React from 'react';
import { x2c, y2r } from '../lib/converters';
import { zoneToArea, among, zoneShape, areaToZone } from '../lib/structs';
import {
  choose,
  select,
  drag,
  write,
  setEditorRect,
  setContextMenuPosition,
  setAutofillDraggingTo,
  updateTable,
} from '../store/actions';

import { DUMMY_IMG } from '../constants';
import { AreaType, PointType, StoreType } from '../types';

import { Context } from '../store';
import { FormulaError } from '../formula/evaluator';
import { Autofill } from '../lib/autofill';

type Props = {
  y: number;
  x: number;
};

export const Cell: React.FC<Props> = React.memo(({ y, x }) => {
  const rowId = y2r(y);
  const colId = x2c(x);
  const address = `${colId}${rowId}`;
  const { store, dispatch } = React.useContext(Context);

  const cellRef = React.useRef<HTMLTableCellElement | null>(null);
  const {
    table,
    editingCell,
    choosing,
    selectingZone,
    verticalHeaderSelecting,
    horizontalheaderSelecting,
    copyingZone,
    searchQuery,
    matchingCells,
    matchingCellIndex,
    editorRef,
    showAddress,
    autofillDraggingTo,
  } = store;

  const [before, setBefore] = React.useState('');
  const matchingCell = matchingCells[matchingCellIndex];

  const selectingArea = zoneToArea(selectingZone); // (top, left) -> (bottom, right)
  const copyingArea = zoneToArea(copyingZone); // (top, left) -> (bottom, right)
  const autofill = autofillDraggingTo ? new Autofill(store, autofillDraggingTo) : null;
  const editing = editingCell === address;
  const pointed = choosing.y === y && choosing.x === x;
  const _setEditorRect = React.useCallback(() => {
    const rect = cellRef.current?.getBoundingClientRect();
    if (rect) {
      dispatch(
        setEditorRect({
          y: rect.top,
          x: rect.left,
          height: rect.height,
          width: rect.width,
        }),
      );
    }
  }, []);

  React.useEffect(() => {
    if (pointed) {
      _setEditorRect();
    }
  }, [pointed, editing]);
  const cell = table.getByPoint({ y, x });
  const writeCell = (value: string) => {
    if (before !== value) {
      dispatch(write(value));
    }
    setBefore('');
  };

  let matching = false;
  if (searchQuery && table.stringify({ y, x }).indexOf(searchQuery) !== -1) {
    matching = true;
  }

  let errorMessage = '';
  let rendered;
  try {
    rendered = table.render({ y, x }, writeCell);
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
  return (
    <td
      key={x}
      ref={cellRef}
      data-x={x}
      data-y={y}
      data-address={address}
      className={`gs-cell ${among(copyingArea, { y, x }) ? 'gs-copying' : ''} ${
        among(selectingArea, { y, x }) ? 'gs-selected' : ''
      } ${pointed ? 'gs-pointed' : ''} ${editing ? 'gs-editing' : ''} ${
        matching ? 'gs-matching' : ''
      } ${matchingCell === address ? 'gs-searching' : ''} ${
        autofill ? (among(autofill.wholeArea, { y, x }) ? 'gs-autofill-dragging' : '') : ''
      }`}
      style={{
        ...cell?.style,
        ...getCellStyle({
          target: { y, x },
          store,
          pointed,
          selectingArea,
          copyingArea,
        }),
        ...autofill?.getCellStyle?.({ y, x }),
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
        dispatch(setContextMenuPosition({ y: -1, x: -1 }));
        if (e.shiftKey) {
          dispatch(drag({ y, x }));
        } else {
          dispatch(choose({ y, x }));
          dispatch(select({ startY: -1, startX: -1, endY: -1, endX: -1 }));
        }
        editorRef.current!.focus();
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        const dblclick = document.createEvent('MouseEvents');
        dblclick.initEvent('dblclick', true, true);
        editorRef.current!.dispatchEvent(dblclick);
        return false;
      }}
      draggable
      onDragStart={(e) => {
        if (autofillDraggingTo) {
          return false;
        }
        e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
        dispatch(choose({ y, x }));
        dispatch(select({ startY: y, startX: x, endY: y, endX: x }));
      }}
      onDragEnd={() => {
        if (autofillDraggingTo) {
          if (autofillDraggingTo.x !== x || autofillDraggingTo.y !== y) {
            const autofill = new Autofill(store, autofillDraggingTo);
            dispatch(updateTable(autofill.applied));
            dispatch(select(areaToZone(autofill.wholeArea)));
          }
          dispatch(setAutofillDraggingTo(null));
          return false;
        }
        const { height: h, width: w } = zoneShape(selectingZone);
        if (h + w === 0) {
          dispatch(select({ startY: -1, startX: -1, endY: -1, endX: -1 }));
        }
      }}
      onDragEnter={() => {
        if (autofillDraggingTo) {
          if (!among(selectingArea, { x, y })) {
            dispatch(setAutofillDraggingTo({ x, y }));
          }
          return false;
        }
        if (verticalHeaderSelecting) {
          dispatch(drag({ y: table.getNumRows(), x }));
          return false;
        }
        if (horizontalheaderSelecting) {
          dispatch(drag({ y, x: table.getNumCols() }));
          return false;
        }
        dispatch(drag({ y, x }));
        return false;
      }}
    >
      <div className={`gs-cell-rendered-wrapper-outer`}>
        <div
          className={'gs-cell-rendered-wrapper-inner'}
          style={{
            justifyContent: cell?.justifyContent || 'left',
            alignItems: cell?.alignItems || 'start',
          }}
        >
          {errorMessage && <div className="formula-error-triangle" title={errorMessage} />}
          {showAddress && <div className="gs-cell-label">{address}</div>}
          <div className="gs-cell-rendered" style={cell?.style}>{rendered}</div>
        </div>
        {((pointed && selectingArea.bottom === -1) || (selectingArea.bottom === y && selectingArea.right === x)) && (
          <div
            className="gs-autofill-drag"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
              dispatch(setAutofillDraggingTo({ x, y }));
              e.stopPropagation();
              //e.preventDefault();
              //return false;
            }}
          ></div>
        )}
      </div>
    </td>
  );
});

const BORDER_POINTED = 'solid 2px #0077ff';
const BORDER_SELECTED = 'solid 1px #0077ff';
const BORDER_CUTTING = 'dotted 2px #0077ff';
const BORDER_COPYING = 'dashed 2px #0077ff';

const getCellStyle = ({
  target,
  pointed,
  selectingArea,
  copyingArea,
  store,
}: {
  target: PointType;
  pointed: boolean;
  selectingArea: AreaType;
  copyingArea: AreaType;
  store: StoreType;
}): React.CSSProperties => {
  const style: React.CSSProperties = {};
  const { cutting } = store;
  const { y, x } = target;
  if (pointed) {
    style.borderTop = BORDER_POINTED;
    style.borderBottom = BORDER_POINTED;
    style.borderLeft = BORDER_POINTED;
    style.borderRight = BORDER_POINTED;
  } else {
    // selecting style
    const { top, left, bottom, right } = selectingArea;
    if (top === y && left <= x && x <= right) {
      style.borderTop = BORDER_SELECTED;
    }
    if (bottom === y && left <= x && x <= right) {
      style.borderBottom = BORDER_SELECTED;
    }
    if (left === x && top <= y && y <= bottom) {
      style.borderLeft = BORDER_SELECTED;
    }
    if (right === x && top <= y && y <= bottom) {
      style.borderRight = BORDER_SELECTED;
    }
  }
  // copy or cut style
  {
    const { top, left, bottom, right } = copyingArea;
    const border = cutting ? BORDER_CUTTING : BORDER_COPYING;
    if (top === y && left <= x && x <= right) {
      style.borderTop = border;
    }
    if (bottom === y && left <= x && x <= right) {
      style.borderBottom = border;
    }
    if (left === x && top <= y && y <= bottom) {
      style.borderLeft = border;
    }
    if (right === x && top <= y && y <= bottom) {
      style.borderRight = border;
    }
  }
  return style;
};
