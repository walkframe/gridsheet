import type { FC } from 'react';
import { useContext } from 'react';
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
import { isDifferentSheetFocused } from '../store/helpers';
import { ScrollHandle } from './ScrollHandle';
import { isTouching } from '../lib/events';

type Props = {
  x: number;
};

export const HeaderCellTop: FC<Props> = ({ x }) => {
  const colId = x2c(x);
  const { store, dispatch } = useContext(Context);

  const {
    table,
    editingAddress,
    choosing,
    selectingZone,
    topHeaderSelecting,
    headerHeight,
    editorRef,
    autofillDraggingTo,
    dragging,
    contextMenuItems,
  } = store;

  const col = table.getByPoint({ y: 0, x });
  const width = col?.width || DEFAULT_WIDTH;

  const differentSheetFocused = isDifferentSheetFocused(store);
  const lastFocused = table.conn.lastFocused;

  const editingAnywhere = !!(table.conn.editingAddress || editingAddress);

  const writeCell = (value: string) => {
    dispatch(write({ value, point: choosing }));
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isTouching(e)) {
      return false;
    }

    if (dragging) {
      return false;
    }

    dispatch(select({ startY: 1, startX: x, endY: -1, endX: x }));
    const fullAddress = `${table.sheetPrefix(!differentSheetFocused)}${colId}:${colId}`;
    if (editingAnywhere) {
      const inserted = insertRef({ input: lastFocused, ref: fullAddress });
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
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(setDragging(false));
    if (autofillDraggingTo) {
      dispatch(submitAutofill(autofillDraggingTo));
      editorRef.current!.focus();
      return false;
    }
  };

  const handleDragging = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isTouching(e)) {
      return false;
    }
    e.preventDefault();
    e.stopPropagation();

    if (autofillDraggingTo) {
      dispatch(setAutofillDraggingTo({ y: 1, x }));
      return false;
    }

    const newArea = zoneToArea({ ...selectingZone, endY: 1, endX: x });
    const [left, right] = [x2c(newArea.left), x2c(newArea.right)];
    const fullRange = `${table.sheetPrefix(!differentSheetFocused)}${left}:${right}`;
    insertRef({ input: lastFocused, ref: fullRange });

    if (autofillDraggingTo == null) {
      const { startY } = selectingZone;
      if (startY === 1) {
        dispatch(drag({ y: table.getNumRows(), x }));
      } else {
        dispatch(drag({ y: 1, x }));
      }
    }
    return false;
  };

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
          e.preventDefault();
          e.stopPropagation();
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
        onMouseMove={handleDragging}
        onTouchMove={handleDragging}
        onMouseUp={handleDragEnd}
        onTouchEnd={handleDragEnd}
      >
        <div className="gs-th-inner" style={{ height: headerHeight, position: 'relative' }}>
          {!topHeaderSelecting ? <ScrollHandle style={{ position: 'absolute' }} vertical={-1} /> : null}
          {col?.labeler ? table.getLabel(col.labeler, x) : colId}
          {!dragging && (
            <div
              className={`gs-resizer ${prevention.hasOperation(col?.prevention, prevention.Resize) ? 'gs-protected' : ''}`}
              style={{ height: headerHeight }}
              onMouseDown={(e) => {
                dispatch(setResizingPositionX([x, e.clientX, e.clientX]));
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <i />
            </div>
          )}
        </div>
      </div>
    </th>
  );
};
