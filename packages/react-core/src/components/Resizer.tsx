import { useContext } from 'react';
import type { MouseEvent } from 'react';

import { Context } from '../store';
import { setResizingPositionY, setResizingPositionX, updateTable, setStore } from '../store/actions';

import { DEFAULT_HEIGHT, DEFAULT_WIDTH, MIN_WIDTH, MIN_HEIGHT } from '../constants';
import { zoneToArea, makeSequence, between } from '../lib/structs';
import type { CellsByAddressType } from '../types';
import { p2a } from '../lib/converters';

export const Resizer = () => {
  const { store, dispatch } = useContext(Context);
  const {
    resizingPositionY: posY,
    resizingPositionX: posX,
    tableReactive: tableRef,
    leftHeaderSelecting,
    topHeaderSelecting,
    selectingZone,
    editorRef,
    mainRef,
  } = store;
  const table = tableRef.current;

  const [y, startY, endY] = posY;
  const [x, startX, endX] = posX;

  if (mainRef.current == null || editorRef.current == null || !table) {
    return <div className="gs-resizing gs-hidden" />;
  }

  const cell = table.getCellByPoint({ y: y === -1 ? 0 : y, x: x === -1 ? 0 : x }, 'SYSTEM');
  const { y: offsetY, x: offsetX } = mainRef.current.getBoundingClientRect();

  const baseWidth = cell?.width || DEFAULT_WIDTH;
  const baseHeight = cell?.height || DEFAULT_HEIGHT;

  const width = baseWidth + (endX - startX);
  const height = baseHeight + (endY - startY);

  const handleResizeEnd = () => {
    const selectingArea = zoneToArea(selectingZone);
    const { top, left, bottom, right } = selectingArea;
    const diff: CellsByAddressType = {};
    if (x !== -1) {
      let xs = [x];
      if (topHeaderSelecting && between({ start: left, end: right }, x)) {
        xs = makeSequence(left, right + 1);
      }
      xs.forEach((x) => {
        diff[p2a({ y: 0, x })] = { width };
      });
    }
    if (y !== -1) {
      let ys = [y];
      if (leftHeaderSelecting && between({ start: top, end: bottom }, y)) {
        ys = makeSequence(top, bottom + 1);
      }
      ys.forEach((y) => {
        diff[p2a({ y, x: 0 })] = { height };
      });
    }
    table.update({
      diff,
      partial: true,
      operator: 'USER',
      undoReflection: { selectingZone, sheetId: table.sheetId },
    });
    dispatch(
      setStore({
        tableReactive: { current: table },
      }),
    );
    dispatch(setResizingPositionY([-1, -1, -1]));
    dispatch(setResizingPositionX([-1, -1, -1]));
    editorRef.current!.focus();
  };
  const handleResizeMove = (e: MouseEvent) => {
    if (y !== -1) {
      let endY = e.clientY;
      const height = baseHeight + (endY - startY);
      if (height < MIN_HEIGHT) {
        endY += MIN_HEIGHT - height;
      }
      dispatch(setResizingPositionY([y, startY, endY]));
    } else if (x !== -1) {
      let endX = e.clientX;
      const width = baseWidth + (endX - startX);
      if (width < MIN_WIDTH) {
        endX += MIN_WIDTH - width;
      }
      dispatch(setResizingPositionX([x, startX, endX]));
    }
  };

  return (
    <div
      className={`gs-resizing ${y === -1 && x === -1 ? 'gs-hidden' : ''}`}
      onMouseUp={handleResizeEnd}
      onMouseMove={handleResizeMove}
    >
      <div className={`gs-line-vertical ${x === -1 ? 'gs-hidden' : ''}`}>
        <div className={'gs-line'} style={{ width: 1, height: '100%', left: endX - offsetX }}>
          <span style={{ left: '-50%' }}>{width}px</span>
        </div>
      </div>
      <div className={`gs-line-horizontal ${y === -1 ? 'gs-hidden' : ''}`}>
        <div className={'gs-line'} style={{ width: '100%', height: 1, top: endY - offsetY }}>
          <span style={{ top: '-50%' }}>{height}px</span>
        </div>
      </div>
    </div>
  );
};
