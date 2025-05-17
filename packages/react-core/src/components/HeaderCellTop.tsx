import { FC, useContext } from 'react';
import { x2c } from '../lib/converters';
import { between, zoneToArea } from '../lib/structs';
import { Context } from '../store';
import {
  choose,
  drag,
  select,
  selectCols,
  setContextMenuPosition,
  setEditingAddress,
  setResizingPositionX,
} from '../store/actions';
import { DUMMY_IMG, DEFAULT_WIDTH } from '../constants';
import * as prevention from '../lib/prevention';
import { insertRef, isRefInsertable } from '../lib/input';
import { isDifferentSheetFocused } from '../store/helpers';

type Props = {
  x: number;
};

export const HeaderCellTop: FC<Props> = ({ x }) => {
  const { store, dispatch } = useContext(Context);
  const colId = x2c(x);

  const {
    table,
    choosing,
    selectingZone,
    resizingRect,
    topHeaderSelecting,
    headerHeight,
    editorRef,
    autofillDraggingTo,
  } = store;

  const col = table.getByPoint({ y: 0, x });
  const width = col?.width || DEFAULT_WIDTH;

  const differentSheetFocused = isDifferentSheetFocused(store);
  const lastFocused = table.conn.lastFocused;

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
      onClick={(e) => {
        let startX = e.shiftKey ? selectingZone.startX : x;
        if (startX === -1) {
          startX = choosing.x;
        }
        const fullColId = `${table.sheetPrefix(!differentSheetFocused)}${colId}:${colId}`;
        const inserted = insertRef(lastFocused, fullColId);
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
        dispatch(setEditingAddress(''));
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
        className="gs-th-inner-wrap"
        draggable
        onDragStart={(e) => {
          e!.dataTransfer!.setDragImage(DUMMY_IMG, 0, 0);
          const insertable = isRefInsertable(lastFocused);
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
          if (isRefInsertable(lastFocused)) {
            dispatch(select({ startY: -1, startX: -1, endY: -1, endX: -1 }));
          }
        }}
        onDragEnter={() => {
          const newArea = zoneToArea({ ...selectingZone, endY: 1, endX: x });
          const [left, right] = [x2c(newArea.left), x2c(newArea.right)];
          const fullRange = `${table.sheetPrefix(!differentSheetFocused)}${left}:${right}`;
          insertRef(lastFocused, fullRange);

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
          e!.dataTransfer!.dropEffect = 'move';
          e.preventDefault();
        }}
      >
        <div className="gs-th-inner" style={{ height: headerHeight, position: 'relative' }}>
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
};
