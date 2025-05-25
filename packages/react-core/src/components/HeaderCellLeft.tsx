import type { FC } from 'react';
import { useContext } from 'react';
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
import { isDifferentSheetFocused } from '../store/helpers';
import { ScrollHandle } from './ScrollHandle';
import { isTouching } from '../lib/events';

type Props = {
  y: number;
};

export const HeaderCellLeft: FC<Props> = ({ y }) => {
  const rowId = `${y2r(y)}`;
  const { store, dispatch } = useContext(Context);

  const {
    choosing,
    editingAddress,
    selectingZone,
    leftHeaderSelecting,
    headerWidth,
    editorRef,
    table,
    autofillDraggingTo,
    lastEdited,
    dragging,
  } = store;

  const row = table.getByPoint({ y, x: 0 });
  const height = row?.height || DEFAULT_HEIGHT;

  const differentSheetFocused = isDifferentSheetFocused(store);
  const lastFocused = table.conn.lastFocused;

  const editingAnywhere = !!(table.conn.editingAddress || editingAddress);

  const writeCell = (value: string) => {
    if (lastEdited !== value) {
      dispatch(write({value, point: choosing}));
      return;
    }
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (dragging) {
        return false;
      }
  
      dispatch(select({startY: y, startX: 1, endY: y, endX: -1}));
      const fullAddress = `${table.sheetPrefix(!differentSheetFocused)}${rowId}:${rowId}`;
      if (editingAnywhere) {
        const inserted = insertRef({input: lastFocused, ref: fullAddress});
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
    }
  
    const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dispatch(setDragging(false));
      if (autofillDraggingTo) {
        dispatch(submitAutofill(autofillDraggingTo));
        editorRef.current!.focus();
        return false;
      }
    }
    
    const handleDragging = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isTouching(e)) {
        return false;
      }
      e.preventDefault();
      e.stopPropagation();
  
      if (autofillDraggingTo) {
        dispatch(setAutofillDraggingTo({ y, x: 1 }));
        return false;
      }
  
      const newArea = zoneToArea({ ...selectingZone, endY: y, endX: 1 });
      const [top, bottom] = [y2r(newArea.top), y2r(newArea.bottom)];
      const fullRange = `${table.sheetPrefix(!differentSheetFocused)}${top}:${bottom}`;
      insertRef({input: lastFocused, ref: fullRange});

      if (autofillDraggingTo == null) {
        const { startX } = selectingZone;
        if (startX === 1) {
          dispatch(drag({ y, x: table.getNumCols() }));
        } else {
          dispatch(drag({ y, x: 1 }));
        }
      }
      return false;
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
      onContextMenu={(e) => {
        e.preventDefault();
        dispatch(setContextMenuPosition({ y: e.clientY, x: e.clientX }));
        return false;
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
        <div className="gs-th-inner" style={{ width: headerWidth, position: 'relative' }}>
          { 
            !leftHeaderSelecting ? 
            <ScrollHandle style={{ position: 'absolute' }} horizontal={-1} /> : null 
          }
          {row?.labeler ? table.getLabel(row.labeler, y) : rowId}
          <div
            className={`gs-resizer ${prevention.hasOperation(row?.prevention, prevention.Resize) ? 'gs-protected' : ''}`}
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
};
