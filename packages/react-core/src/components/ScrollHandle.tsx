import type { CSSProperties } from 'react';
import { useEffect, useRef, useContext, useCallback } from 'react';
import { Context } from '../store';
import { drag, setAutofillDraggingTo, setDragging } from '../store/actions';
import { getAreaInTabular } from '@gridsheet/web';
import { insertRef, isFocus } from '@gridsheet/web';
import { focus } from '@gridsheet/web';
import { areaToRange, zoneToArea } from '@gridsheet/web';
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
    sheetReactive: sheetRef,
    searchInputRef,
    editingAddress,
  } = store;
  const sheet = sheetRef.current;

  // The rAF scroll loop below closes over one render's props. When it dispatches
  // (re-render), the running loop keeps the OLD closure — including a stale, still-truthy
  // autofillDraggingTo — so it re-arms the autofill every frame. Read the LIVE store
  // through a ref instead, so the loop sees the drag end and stops.
  const storeRef = useRef(store);
  storeRef.current = store;

  let isScrolling = false;
  const xSheetFocused = isXSheetFocused(store);
  const editingAnywhere = !!(sheet?.registry.editingAddress || editingAddress);

  const getDestEdge = useCallback(
    (e: React.MouseEvent) => {
      if (!sheet) {
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
    [sheet, horizontal, vertical, selectingZone],
  );

  // The autoExpand ghost cell just inside the scrolling edge, if any. getDestEdge finds the edge
  // from header cells, which ghost rows/cols don't have. This strip sits on top of the grid,
  // so look through it with elementsFromPoint.
  const getGhostEdgePoint = useCallback(
    (e: React.MouseEvent) => {
      const el = tabularRef.current;
      if (!el) {
        return null;
      }
      const r = el.getBoundingClientRect();
      const px = horizontal > 0 ? r.right - 2 : Math.min(Math.max(e.clientX, r.left + 1), r.right - 2);
      const py = vertical > 0 ? r.bottom - 2 : Math.min(Math.max(e.clientY, r.top + 1), r.bottom - 2);
      const ghost = document
        .elementsFromPoint(px, py)
        .find((node) => (node as HTMLElement).classList?.contains('gs-ghost-cell')) as HTMLElement | undefined;
      if (!ghost) {
        return null;
      }
      return { y: Number(ghost.dataset.y), x: Number(ghost.dataset.x) };
    },
    [horizontal, vertical],
  );

  const scrollStep = useCallback(
    (e: React.MouseEvent) => {
      if (!isScrolling || tabularRef.current === null || !sheet) {
        return;
      }
      // The drag has ended (the mouseup landed off this strip, e.g. on a cell, or the
      // strip hid at the edge so its onMouseUp/onMouseLeave never fired). Stop now —
      // otherwise this loop keeps scrolling and re-dispatching setAutofillDraggingTo
      // forever, so the autofill can never be cleared and the grid can't be scrolled.
      const live = storeRef.current;
      if (!live.dragging && !live.autofillDraggingTo) {
        if (scrollRef.current !== null) {
          cancelAnimationFrame(scrollRef.current);
          scrollRef.current = null;
        }
        isScrolling = false;
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
      focus(editorRef.current);

      const { x, y } = getDestEdge(e);
      if (live.autofillDraggingTo) {
        const { y: curY, x: curX } = live.autofillDraggingTo;
        // On an auto-expanding sheet the drag scrolls on into ghost rows/cols past the last
        // row/col, which have no header cells for getDestEdge to find — target that cell instead.
        const ghostPoint = getGhostEdgePoint(e);
        // Past the last row/col of an auto-expanding sheet (e.g. the ghosts don't fill the box yet,
        // so there's none at the edge), Tabular keeps the target on the last ghost and grows it.
        // Snapping it back to the last real row/col here would fight that every frame and stall it.
        const r = tabularRef.current.getBoundingClientRect();
        const mode = sheet.autoExpand;
        const ownedByGhosts =
          !ghostPoint &&
          (((mode === 'vertical' || mode === 'both') && e.clientY > r.bottom && y >= sheet.numRows) ||
            ((mode === 'horizontal' || mode === 'both') && e.clientX > r.right && x >= sheet.numCols));
        if (!ownedByGhosts) {
          dispatch(setAutofillDraggingTo(ghostPoint ?? { y: y === -1 ? curY : y, x: x === -1 ? curX : x }));
        }
      } else {
        if (editingAnywhere) {
          const newArea = zoneToArea({ ...selectingZone, endY: y, endX: x });
          const sheetPrefix = sheet.sheetPrefix(!xSheetFocused);
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
      sheet,
      horizontal,
      vertical,
      autofillDraggingTo,
      editingAnywhere,
      selectingZone,
      xSheetFocused,
      getDestEdge,
      getGhostEdgePoint,
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
      focus(editorRef.current);
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

      if (autofillDraggingTo) {
        // Don't submit here: StoreObserver's capture-phase window mouseup is the sole authority
        // for ending a drag and has already submitted the fill. Submitting again (a frame later,
        // from this render's stale closure) applied the fill twice — two undo steps, and the
        // second targeted the edge computed from header cells, which may not even exist.
        focus(editorRef.current);
      } else {
        if (editingAnywhere) {
          // inserting a range
          dispatch(drag({ y: -1, x: -1 })); // Reset dragging
        }
      }
    },
    [autofillDraggingTo, editingAnywhere],
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

  // The directional auto-scroll strips (right/bottom/left/top edges) sit on top of the
  // grid (zIndex). At an edge where there is nothing left to scroll to, such a strip only
  // gets in the way — e.g. it covers the rightmost column's cells, so dragging the
  // autofill handle straight down stays over the strip and never reaches the cells below.
  // Only render a directional strip while it can actually scroll in that direction; the
  // beyond-edge catch-all handle (horizontal === 0 && vertical === 0) always renders.
  const t = tabularRef.current;
  const cannotScrollHere =
    !!t &&
    ((horizontal > 0 && t.scrollLeft + t.clientWidth >= t.scrollWidth - 1) ||
      (horizontal < 0 && t.scrollLeft <= 0) ||
      (vertical > 0 && t.scrollTop + t.clientHeight >= t.scrollHeight - 1) ||
      (vertical < 0 && t.scrollTop <= 0));

  if (!editorRef.current || (!dragging && !autofillDraggingTo) || cannotScrollHere) {
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
