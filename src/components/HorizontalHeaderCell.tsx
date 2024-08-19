import React from 'react';
import { x2c } from '../lib/converters';
import { areaToRange, between, zoneToArea } from '../lib/structs';
import { Context } from '../store';
import { choose, drag, select, selectCols, setContextMenuPosition, setResizingPositionX } from '../store/actions';
import { DUMMY_IMG, DEFAULT_WIDTH } from '../constants';
import * as prevention from '../lib/prevention';
import { useSheetContext } from './SheetProvider';
import { insertRef, isRefInsertable } from '../lib/input';

type Props = {
  x: number;
};

export const HorizontalHeaderCell: React.FC<Props> = React.memo(({ x }) => {
  const { store, dispatch } = React.useContext(Context);
  const colId = x2c(x);

  const {
    table,
    choosing,
    selectingZone,
    resizingRect,
    verticalHeaderSelecting,
    headerHeight,
    editorRef,
    autofillDraggingTo,
  } = store;

  const col = table.getByPoint({ y: 0, x });
  const width = col?.width || DEFAULT_WIDTH;

  const [sheetProvided, sheetContext] = useSheetContext();
  const differentSheetFocused = sheetProvided && sheetContext?.lastFocusedRef !== store.lastFocusedRef;

  const lastFocusedRef = sheetContext?.lastFocusedRef || store.lastFocusedRef;
  const lastInput = lastFocusedRef.current;

  return (
    <th
      data-x={x}
      className={`gs-header gs-header-horizontal gs-header-top ${choosing.x === x ? 'gs-pointed' : ''} ${
        between({ start: selectingZone.startX, end: selectingZone.endX }, x)
          ? verticalHeaderSelecting
            ? 'gs-header-selecting'
            : 'gs-selecting'
          : ''
      } ${x === table.getNumCols() ? 'gs-header-top-end' : ''}`}
      style={{ width, minWidth: width, maxWidth: width }}
      onClick={(e) => {
        let startX = e.shiftKey ? selectingZone.startX : x;
        if (startX === -1) {
          startX = choosing.x;
        }
        const fullColId = `${table.sheetPrefix(!differentSheetFocused)}${colId}:${colId}`;
        const inserted = insertRef(lastInput, fullColId);
        if (inserted) {
          return false;
        }

        dispatch(
          selectCols({
            range: { start: startX, end: x },
            numRows: table.getNumRows(),
          }),
        );
        dispatch(setContextMenuPosition({ y: -1, x: -1 }));
        dispatch(choose({ y: 1, x: startX }));
        editorRef.current!.focus();
        return false;
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        dispatch(setContextMenuPosition({ y: e.clientY, x: e.clientX }));
        return false;
      }}
    >
      <div
        className="gs-header-outer"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
          const insertable = isRefInsertable(lastInput);
          if (insertable) {
            dispatch(select({ startY: table.getNumRows(), startX: x, endY: 0, endX: x }));
            return false;
          }
          dispatch(
            selectCols({
              range: { start: x, end: x },
              numRows: table.getNumRows(),
            }),
          );
          dispatch(choose({ y: 1, x }));
          return false;
        }}
        onDragEnd={() => {
          if (isRefInsertable(lastInput)) {
            dispatch(select({ startY: -1, startX: -1, endY: -1, endX: -1 }));
          }
        }}
        onDragEnter={() => {
          const newArea = zoneToArea({ ...selectingZone, endY: 1, endX: x });
          const [left, right] = [x2c(newArea.left), x2c(newArea.right)];
          const fullRange = `${table.sheetPrefix(!differentSheetFocused)}${left}:${right}`;
          insertRef(lastInput, fullRange);

          if (resizingRect.x === -1 && autofillDraggingTo == null) {
            const { startY } = selectingZone;
            if (startY === 1) {
              dispatch(drag({ y: table.getNumRows(), x }));
            } else {
              dispatch(drag({ y: 1, x }));
            }
          }
          return false;
        }}
        onDragOver={(e) => {
          e.dataTransfer.dropEffect = 'move';
          e.preventDefault();
        }}
      >
        <div className="gs-header-inner" style={{ height: headerHeight, position: 'relative' }}>
          {col?.labeler ? table.getLabel(col.labeler, x) : colId}
          <div
            className={`gs-resizer ${prevention.isPrevented(col?.prevention, prevention.Resize) ? 'gs-protected' : ''}`}
            style={{ height: headerHeight }}
            onMouseDown={(e) => {
              dispatch(setResizingPositionX([x, e.clientX, e.clientX]));
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <i />
          </div>
        </div>
      </div>
    </th>
  );
});
