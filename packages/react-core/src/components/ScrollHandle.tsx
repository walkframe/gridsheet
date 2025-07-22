import type { CSSProperties } from 'react';
import { useEffect, useRef, useContext, useCallback } from 'react';
import { Context } from '../store';
import { drag, setAutofillDraggingTo, setDragging, submitAutofill } from '../store/actions';
import { getAreaInTabular } from '../lib/virtualization';
import { insertRef, isFocus } from '../lib/input';
import { areaToRange, zoneToArea } from '../lib/structs';
import { isXSheetFocused } from '../store/helpers';

type Props = {
  className?: string;
  style: CSSProperties;
  horizontal?: number;
  vertical?: number;
};

const acceleration = 0.4;
const maxSpeed = 200;

let lastScrollTime = new Date().getTime();
let currentSpeed = 0;

export function ScrollHandle({ style, horizontal = 0, vertical = 0, className = '' }: Props) {
  const scrollRef = useRef<number | null>(null);
  const { store, dispatch } = useContext(Context);
  const {
    tabularRef,
    autofillDraggingTo,
    dragging,
    selectingZone,
    editorRef,
    tableReactive: tableRef,
    searchInputRef,
    editingAddress,
  } = store;
  const table = tableRef.current;

  let isScrolling = false;
  const xSheetFocused = isXSheetFocused(store);
  const editingAnywhere = !!(table?.wire.editingAddress || editingAddress);

  const getDestEdge = useCallback(
    (e: React.MouseEvent) => {
      if (!table) {
        return { x: -1, y: -1 };
      }
      if (horizontal == 0 && vertical == 0) {
        const tabularRect = tabularRef.current!.getBoundingClientRect();
        const { left, top, right, bottom } = tabularRect;
        horizontal = e.pageX > right ? 1 : e.pageX < left ? -1 : 0;
        if (horizontal === 0) {
          vertical = e.pageY > bottom ? 1 : e.pageY < top ? -1 : 0;
        }
      }
      const area = getAreaInTabular(tabularRef.current!);
      let { endX: x, endY: y } = selectingZone;
      if (horizontal) {
        x = horizontal > 0 ? area.right : area.left;
      } else if (vertical) {
        y = vertical > 0 ? area.bottom : area.top;
      }
      return { x, y };
    },
    [table, horizontal, vertical, selectingZone],
  );

  const scrollStep = useCallback(
    (e: React.MouseEvent) => {
      if (!isScrolling || tabularRef.current === null || !table) {
        return;
      }
      const now = new Date().getTime();
      if (now - lastScrollTime > 1000) {
        currentSpeed = 0;
      }
      lastScrollTime = now;

      tabularRef.current.scrollBy({
        left: currentSpeed * horizontal!,
        top: currentSpeed * vertical!,
      });
      editorRef.current!.focus();

      const { x, y } = getDestEdge(e);
      if (autofillDraggingTo) {
        const { y: curY, x: curX } = autofillDraggingTo;
        dispatch(setAutofillDraggingTo({ y: y === -1 ? curY : y, x: x === -1 ? curX : x }));
      } else {
        if (editingAnywhere) {
          const newArea = zoneToArea({ ...selectingZone, endY: y, endX: x });
          const sheetPrefix = table.sheetPrefix(!xSheetFocused);
          const sheetRange = areaToRange(newArea);
          const fullRange = `${sheetPrefix}${sheetRange}`;
          insertRef({ input: editorRef.current, ref: fullRange });
        }
        dispatch(drag({ y, x }));
      }
      currentSpeed = Math.min(currentSpeed + acceleration, maxSpeed);
      scrollRef.current = requestAnimationFrame(() => scrollStep(e));
    },
    [
      isScrolling,
      table,
      horizontal,
      vertical,
      autofillDraggingTo,
      editingAnywhere,
      selectingZone,
      xSheetFocused,
      getDestEdge,
    ],
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isScrolling) {
        return;
      }
      isScrolling = true;

      if (horizontal === 0 || vertical === 0) {
        const tabularRect = tabularRef.current!.getBoundingClientRect();
        const { left, top, right, bottom } = tabularRect;

        horizontal ||= e.pageX > right ? 1 : e.pageX < left ? -1 : 0;
        if (horizontal === 0) {
          vertical ||= e.pageY > bottom ? 1 : e.pageY < top ? -1 : 0;
        }
      }
      scrollRef.current = requestAnimationFrame(() => scrollStep(e));
    },
    [isScrolling, horizontal, vertical, scrollStep],
  );

  const stopScroll = useCallback(() => {
    if (scrollRef.current !== null) {
      cancelAnimationFrame(scrollRef.current);
      scrollRef.current = null;
    }
    isScrolling = false;
    if (!isFocus(searchInputRef.current)) {
      // Pressing Enter on a search result will not focus the editor.
      editorRef.current?.focus?.();
    }
  }, []);

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const area = getAreaInTabular(tabularRef.current!);
      if (area.bottom === -1 || area.right === -1) {
        return;
      }

      const { x, y } = getDestEdge(e);
      if (autofillDraggingTo) {
        const { y: curY, x: curX } = autofillDraggingTo;
        dispatch(submitAutofill({ y: y === -1 ? curY : y, x: x === -1 ? curX : x }));
        editorRef.current!.focus();
      } else {
        if (editingAnywhere) {
          // inserting a range
          dispatch(drag({ y: -1, x: -1 })); // Reset dragging
        }
      }
    },
    [autofillDraggingTo, editingAnywhere, getDestEdge],
  );

  const handleMouseUpWrapper = useCallback(
    (e: React.MouseEvent) => {
      stopScroll();
      dispatch(setDragging(false));
      requestAnimationFrame(() => handleMouseUp(e));
    },
    [stopScroll, handleMouseUp],
  );

  const handleMouseLeave = useCallback(() => {
    stopScroll();
  }, [stopScroll]);

  useEffect(() => {
    return stopScroll;
  }, [stopScroll]);

  if (!editorRef.current || (!dragging && !autofillDraggingTo)) {
    return <div className={`gs-scroll-handle gs-hidden ${className}`} />;
  }

  return (
    <div
      style={style}
      className={`gs-scroll-handle ${className}`}
      onMouseUp={(e) => {
        handleMouseUpWrapper(e);
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  );
}
