import type { CSSProperties } from 'react';
import { useEffect, useRef, useContext } from 'react';
import { Context } from '../store';
import { drag, setAutofillDraggingTo, setDragging, submitAutofill } from '../store/actions';
import { getAreaInTabular } from '../lib/virtualization';
import { insertRef, isFocus } from '../lib/input';
import { areaToRange, zoneToArea } from '../lib/structs';
import { isXSheetFocused } from '../store/helpers';

type Props = {
  style: CSSProperties;
  horizontal?: number;
  vertical?: number;
};

const acceleration = 0.4;
const maxSpeed = 200;

let lastScrollTime = new Date().getTime();
let currentSpeed = 0;

export function ScrollHandle({ style, horizontal = 0, vertical = 0 }: Props) {
  const scrollRef = useRef<number | null>(null);
  const { store, dispatch } = useContext(Context);
  const { tabularRef, autofillDraggingTo, dragging, selectingZone, editorRef, table, searchInputRef, editingAddress } =
    store;

  let isScrolling = false;
  const xSheetFocused = isXSheetFocused(store);
  const editingAnywhere = !!(table.wire.editingAddress || editingAddress);

  const getDestEdge = (e: React.MouseEvent) => {
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
  };

  const scrollStep = (e: React.MouseEvent) => {
    if (!isScrolling || tabularRef.current === null) {
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
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
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
  };

  function stopScroll() {
    if (scrollRef.current !== null) {
      cancelAnimationFrame(scrollRef.current);
      scrollRef.current = null;
    }
    isScrolling = false;
    if (!isFocus(searchInputRef.current)) {
      // Pressing Enter on a search result will not focus the editor.
      editorRef.current?.focus?.();
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
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
  };

  useEffect(() => {
    return stopScroll;
  }, []);

  if (!dragging && !autofillDraggingTo) {
    return null;
  }

  if (!editorRef.current) {
    return null;
  }

  return (
    <div
      style={{ ...style, backgroundColor: 'rgba(0, 0, 0, 0)' }}
      className="gs-scroll-handle"
      onMouseUp={(e) => {
        stopScroll();
        dispatch(setDragging(false));
        requestAnimationFrame(() => handleMouseUp(e));
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => {
        stopScroll();
      }}
    />
  );
}
