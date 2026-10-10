import { useEffect, useLayoutEffect, useContext, useState, useCallback, useMemo, useRef } from 'react';

import { Cell, type MergeRender } from './Cell';
import { HeaderCellTop } from './HeaderCellTop';
import { HeaderCellLeft } from './HeaderCellLeft';
import { CellStateOverlay } from './CellStateOverlay';

import { Context } from '../store';
import { choose, select, setAutofillDraggingTo, setContextMenuPosition } from '../store/actions';

import type { RefPaletteType, Virtualization } from '../types';
import {
  virtualize,
  physicalScrollHeight,
  getGhostCellSize,
  SCROLL_CAP,
  range,
  x2c,
  complementSelectingArea,
  zoneToArea,
  smartScroll,
} from '@gridsheet/web';
import { p2a, stripAddressAbsolute } from '@gridsheet/web';
import { Lexer, stripSheetName } from '@gridsheet/web';
import { ScrollHandle } from './ScrollHandle';
import { useTouchGestures } from './useTouchGestures';
import { preventSafariBounce } from '@gridsheet/web';

// Like Handsontable's autoInsertRow: while a fill drag reaches the last (real or provisional)
// row/column — or the pointer is held past the grid — add one provisional ghost row/column every
// GHOST_INTERVAL_MS. Ghosts are display-only (no sheet change, no history); releasing the fill
// grows the sheet up to the reached row/column in one undo step (see Autofill), and any unreached
// ghosts simply disappear.
const GHOST_INTERVAL_MS = 200;
// The further past the edge the pointer is, the faster ghosts are added: the interval shrinks
// by one step per GHOST_SPEEDUP_PX of distance, down to GHOST_MIN_INTERVAL_MS.
const GHOST_SPEEDUP_PX = 24;
const GHOST_MIN_INTERVAL_MS = 20;
const ghostInterval = (distance: number) =>
  Math.max(GHOST_MIN_INTERVAL_MS, GHOST_INTERVAL_MS / (1 + Math.max(0, distance) / GHOST_SPEEDUP_PX));

const roomFor = (limit: number, current: number) => (limit === -1 ? Infinity : Math.max(0, limit - current));

export const Tabular = () => {
  const [palette, setPalette] = useState<RefPaletteType>({});
  const { store, dispatch } = useContext(Context);
  const {
    sheetReactive,
    choosing,
    editingAddress,
    tabularRef,
    mainRef,
    sheetWidth,
    sheetHeight,
    fixedWidth,
    fixedHeight,
    inputting,
    leftHeaderSelecting,
    topHeaderSelecting,
    contextMenu,
    autofillDraggingTo,
    selectingZone,
  } = store;
  const sheet = sheetReactive.current;

  useTouchGestures(tabularRef, store, dispatch, !!sheet?.registry.ready);

  const [virtualized, setVirtualized] = useState<Virtualization | null>(null);

  // autoExpand: provisional ghost rows/cols shown while dragging an autofill (see GHOST_INTERVAL_MS).
  const [ghostCount, setGhostCount] = useState({ rows: 0, cols: 0 });
  // Whether the pointer is past the grid content's bottom/right edge during the drag — dragging
  // down from the last row never moves the target onto a new row, so this alone must start the
  // growth. Measured from the content (not the scroll box), which may sit inside a larger box.
  const [pastEdge, setPastEdge] = useState({ bottom: false, right: false });
  // How far past the content's bottom/right edge the pointer is (px); read when scheduling growth.
  const pastDistance = useRef({ bottom: 0, right: 0 });
  // Last pointer position during the drag. The content edge moves as ghosts are added or the grid
  // scrolls (with the pointer held still), so pastEdge is re-evaluated then too, not only on moves.
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const evalPastEdge = useCallback(() => {
    const el = tabularRef.current;
    const inner = el?.querySelector<HTMLElement>(':scope > .gs-tabular-inner');
    const p = pointerRef.current;
    if (!el || !inner || !p) {
      return;
    }
    const box = el.getBoundingClientRect();
    const content = inner.getBoundingClientRect();
    const dBottom = p.y - Math.min(content.bottom, box.bottom);
    const dRight = p.x - Math.min(content.right, box.right);
    pastDistance.current = { bottom: Math.max(0, dBottom), right: Math.max(0, dRight) };
    // Only once scrolled to that edge — before that, edge auto-scroll walks the real rows/cols.
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    let bottom = dBottom > 0 && atBottom;
    let right = dRight > 0 && atRight;
    // Past both edges (a corner): follow the dominant direction only.
    if (bottom && right) {
      bottom = dBottom >= dRight;
      right = !bottom;
    }
    const next = { bottom, right };
    setPastEdge((prev) => (prev.bottom === next.bottom && prev.right === next.right ? prev : next));
  }, []);
  const autoExpanding = !!sheet && !!autofillDraggingTo && sheet.autoExpand !== 'none';

  useEffect(() => {
    if (!autoExpanding) {
      setGhostCount((c) => (c.rows || c.cols ? { rows: 0, cols: 0 } : c));
      setPastEdge((p) => (p.bottom || p.right ? { bottom: false, right: false } : p));
      return;
    }
    const onMove = (e: MouseEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
      evalPastEdge();
    };
    const el = tabularRef.current;
    window.addEventListener('mousemove', onMove, true);
    el?.addEventListener('scroll', evalPastEdge);
    return () => {
      window.removeEventListener('mousemove', onMove, true);
      el?.removeEventListener('scroll', evalPastEdge);
      pointerRef.current = null;
    };
  }, [autoExpanding]);
  // Ghosts were added (the content grew). While growing past an edge, stay pinned to it (the new
  // ghost would otherwise sit just out of view and "not scrolled to the edge" would stop growth),
  // then re-check whether the pointer is still past the content.
  useLayoutEffect(() => {
    if (!autoExpanding) {
      return;
    }
    const el = tabularRef.current;
    if (el && pastEdge.bottom) {
      el.scrollTop = el.scrollHeight;
    }
    if (el && pastEdge.right) {
      el.scrollLeft = el.scrollWidth;
    }
    evalPastEdge();
  }, [autoExpanding, ghostCount]);
  // Keep the drag target in view as ghosts are added past the viewport, so the growth is visible.
  useEffect(() => {
    if (!autoExpanding || !sheet || !autofillDraggingTo) {
      return;
    }
    if (autofillDraggingTo.y > sheet.numRows || autofillDraggingTo.x > sheet.numCols) {
      smartScroll(sheet, tabularRef.current, autofillDraggingTo);
    }
  }, [autoExpanding, ghostCount, autofillDraggingTo]);

  let growRows = false;
  let growCols = false;
  if (autoExpanding && sheet && autofillDraggingTo) {
    const mode = sheet.autoExpand;
    // Grow only while the pointer is past the grid content's edge (in the whitespace of a larger
    // box, or outside it) — never while it's over a cell, real or ghost — and the target has
    // reached the last (ghost) row/col. A capped (remapped) scroll height can't be extended
    // linearly, so very tall sheets get no row ghosts.
    growRows =
      (mode === 'vertical' || mode === 'both') &&
      pastEdge.bottom &&
      sheet.totalHeight <= SCROLL_CAP &&
      ghostCount.rows < roomFor(sheet.maxNumRows, sheet.numRows) &&
      autofillDraggingTo.y >= sheet.numRows + ghostCount.rows;
    growCols =
      (mode === 'horizontal' || mode === 'both') &&
      pastEdge.right &&
      ghostCount.cols < roomFor(sheet.maxNumCols, sheet.numCols) &&
      autofillDraggingTo.x >= sheet.numCols + ghostCount.cols;
  }
  // Past the content's edge there is no cell under the pointer to target, so keep the target on
  // the last (ghost) row/column — the fill then follows the growth.
  useEffect(() => {
    if (!autoExpanding || !sheet || !autofillDraggingTo || (!pastEdge.bottom && !pastEdge.right)) {
      return;
    }
    const src = complementSelectingArea(zoneToArea(selectingZone), choosing);
    const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
    const mode = sheet.autoExpand;
    let next = autofillDraggingTo;
    if (pastEdge.bottom && (mode === 'vertical' || mode === 'both')) {
      next = { y: sheet.numRows + ghostCount.rows, x: clamp(autofillDraggingTo.x, src.left, src.right) };
    } else if (pastEdge.right && (mode === 'horizontal' || mode === 'both')) {
      next = { y: clamp(autofillDraggingTo.y, src.top, src.bottom), x: sheet.numCols + ghostCount.cols };
    }
    if (next.y !== autofillDraggingTo.y || next.x !== autofillDraggingTo.x) {
      dispatch(setAutofillDraggingTo(next));
    }
  }, [autoExpanding, pastEdge, ghostCount, autofillDraggingTo]);

  useEffect(() => {
    if (!growRows && !growCols) {
      return;
    }
    const t = window.setTimeout(
      () => setGhostCount((c) => ({ rows: c.rows + (growRows ? 1 : 0), cols: c.cols + (growCols ? 1 : 0) })),
      ghostInterval(growRows ? pastDistance.current.bottom : pastDistance.current.right),
    );
    return () => window.clearTimeout(t);
  }, [growRows, growCols, ghostCount]);

  // Mark on .gs-main whether the grid overflows the viewport per axis, so the matrix outer
  // border hugs the content when it fits (border on the inner) and switches to a fixed
  // viewport overlay when it scrolls. Runs after every render (so it always catches the
  // ready flip, content growth and size changes) but reads layout inside rAF — after paint
  // — so it never blocks the render/paint the way a synchronous reflow would, and only
  // writes the attribute when the value actually changes.
  useEffect(() => {
    const t = tabularRef.current;
    const m = mainRef.current;
    if (!t || !m) {
      return;
    }
    const raf = requestAnimationFrame(() => {
      const ox = String(t.scrollWidth > t.clientWidth + 1);
      const oy = String(t.scrollHeight > t.clientHeight + 1);
      if (m.getAttribute('data-overflow-x') !== ox) {
        m.setAttribute('data-overflow-x', ox);
      }
      if (m.getAttribute('data-overflow-y') !== oy) {
        m.setAttribute('data-overflow-y', oy);
      }
    });
    return () => cancelAnimationFrame(raf);
  });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Dragging an autofill onto a ghost cell targets that (not yet existing) cell.
  const handleGhostMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!autofillDraggingTo) {
        return;
      }
      const y = Number(e.currentTarget.dataset.y);
      const x = Number(e.currentTarget.dataset.x);
      if (y !== autofillDraggingTo.y || x !== autofillDraggingTo.x) {
        dispatch(setAutofillDraggingTo({ y, x }));
      }
    },
    [autofillDraggingTo],
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (sheet) {
        setVirtualized(virtualize(sheet, e.currentTarget));
      }
    },
    [sheetReactive],
  );

  const handleSelectAllClick = useCallback(() => {
    if (!sheet) {
      return;
    }
    dispatch(choose({ y: -1, x: -1 }));
    requestAnimationFrame(() => {
      dispatch(choose({ y: 1, x: 1 }));
      dispatch(
        select({
          startY: 1,
          startX: 1,
          endY: sheet.numRows,
          endX: sheet.numCols,
        }),
      );
    });
  }, [sheetReactive]);

  useEffect(() => {
    if (!sheet) {
      return;
    }
    const formulaEditing = editingAddress && inputting.startsWith('=');
    if (!formulaEditing) {
      setPalette({});
      sheet.registry.paletteBySheetName = {};
      return;
    }
    const palette: RefPaletteType = {};
    const paletteBySheetName: { [sheetName: string]: RefPaletteType } = {};
    const lexer = new Lexer(inputting.substring(1));
    lexer.tokenize();

    let i = 0;
    for (const token of lexer.tokens) {
      if (token.type === 'REF' || token.type === 'RANGE') {
        const normalizedRef = stripAddressAbsolute(token.stringify());
        const splitterIndex = normalizedRef.indexOf('!');
        if (splitterIndex !== -1) {
          const sheetName = normalizedRef.substring(0, splitterIndex);
          const ref = normalizedRef.substring(splitterIndex + 1);
          const stripped = stripSheetName(sheetName);
          const upperRef = ref.toUpperCase();
          if (paletteBySheetName[stripped] == null) {
            paletteBySheetName[stripped] = {};
          }
          if (paletteBySheetName[stripped][upperRef] == null) {
            paletteBySheetName[stripped][upperRef] = i++;
          }
        } else {
          const upperRef = normalizedRef.toUpperCase();
          if (palette[upperRef] == null) {
            palette[upperRef] = i++;
          }
        }
      }
    }
    setPalette(palette);
    sheet.registry.paletteBySheetName = paletteBySheetName;
  }, [store.inputting, store.editingAddress, sheetReactive]);

  useEffect(() => {
    if (!sheet) {
      return;
    }
    sheet.registry.choosingAddress = p2a(choosing);
    sheet.registry.choosingSheetId = sheet.id;
  }, [choosing]);

  useEffect(() => {
    if (!sheet) {
      return;
    }
    setVirtualized(virtualize(sheet, tabularRef.current));
  }, [
    tabularRef.current,
    sheetReactive,
    mainRef.current?.clientHeight,
    mainRef.current?.clientWidth,
    sheetHeight,
    sheetWidth,
  ]);

  useEffect(() => {
    const el = tabularRef.current;
    if (!el) {
      return;
    }
    return preventSafariBounce(el);
  }, [sheetReactive]);

  // Eager resolution: virtualization only renders/solves visible cells, so
  // off-screen async formulas would never fire. When the sheet opts in via
  // `eager`, fire every off-screen async cell after each update. resolveAll()
  // is idempotent — resolved/pending cells are cache hits — so it converges
  // once all async formulas have settled.
  useEffect(() => {
    if (!sheet || !sheet.eager || !sheet.registry.ready) {
      return;
    }
    sheet.resolveAll();
  }, [sheet, sheetReactive]);

  // Which rendered cells belong to a merged range, and which one of them draws it (the host:
  // the anchor, or the first rendered cell of the range when the anchor is scrolled out).
  const mergeRenders = useMemo(() => {
    const map = new Map<string, MergeRender>();
    const ys = virtualized?.ys ?? [];
    const xs = virtualized?.xs ?? [];
    if (!sheet || ys.length === 0 || xs.length === 0) {
      return map;
    }
    const [y0, y1, x0, x1] = [ys[0], ys[ys.length - 1], xs[0], xs[xs.length - 1]];
    for (const area of sheet.getMerges()) {
      if (area.bottom < y0 || area.top > y1 || area.right < x0 || area.left > x1) {
        continue;
      }
      const rows = ys.filter((y) => y >= area.top && y <= area.bottom);
      if (rows.length === 0) {
        continue;
      }
      const host: MergeRender = { area, host: true };
      const covered: MergeRender = { area, host: false };
      const left = Math.max(area.left, x0);
      const right = Math.min(area.right, x1);
      for (const y of rows) {
        for (let x = left; x <= right; x++) {
          map.set(`${y}:${x}`, y === rows[0] && x === left ? host : covered);
        }
      }
    }
    return map;
  }, [sheet, sheet?.currentVersion, virtualized]);

  const mergedRefs: RefPaletteType = {
    ...palette,
    ...(sheet ? sheet.registry.paletteBySheetName[sheet.name] : {}),
  };

  if (!sheet || !sheet.registry.ready) {
    return null;
  }

  const ghostSize = getGhostCellSize(sheet);
  const ghostHeight = ghostCount.rows * ghostSize.height;
  const ghostWidth = ghostCount.cols * ghostSize.width;
  const scrollHeight = physicalScrollHeight(sheet);
  const ghostXs = ghostCount.cols > 0 ? range(sheet.numCols + 1, sheet.numCols + ghostCount.cols) : [];
  // Ghost rows follow the last row, so they only render once the rendered window reaches the
  // bottom (offset-based, so trailing filtered — zero-height — rows don't hide them).
  const lastRendered = virtualized?.ys?.[virtualized.ys.length - 1];
  const lastRowRendered = lastRendered != null && sheet.getOffsetTop(lastRendered + 1) >= sheet.totalHeight;
  const ghostYs =
    ghostCount.rows > 0 && lastRowRendered ? range(sheet.numRows + 1, sheet.numRows + ghostCount.rows) : [];
  const ghostCell = (y: number, x: number) => (
    <td key={`ghost-${x}`} className="gs-ghost-cell" data-y={y} data-x={x} onMouseEnter={handleGhostMouseEnter} />
  );

  return (
    <>
      <div
        className="gs-tabular"
        style={{
          // When a size is explicitly configured, keep that box so a smaller grid can be
          // centered within it (see .gs-tabular in tabular.less); otherwise shrink to fit.
          width: sheetWidth === -1 ? undefined : fixedWidth ? sheetWidth : Math.min(sheetWidth, sheet.totalWidth),
          height: sheetHeight === -1 ? undefined : fixedHeight ? sheetHeight : Math.min(sheetHeight, sheet.totalHeight),
        }}
        ref={tabularRef}
        onMouseMove={handleMouseMove}
        onScroll={handleScroll}
      >
        <div
          className={'gs-tabular-inner'}
          style={{
            // Ghost rows/cols (autoExpand) widen the scrollable content only while dragging an autofill.
            width: sheet.totalWidth + ghostWidth,
            // Physical scroll height is capped below the browser's ~2^24px precision limit;
            // virtualize() maps this back to the sheet's full virtual height (see SCROLL_CAP).
            height: scrollHeight + ghostHeight,
            overflow: 'clip',
          }}
        >
          <CellStateOverlay refs={mergedRefs} />
          <table className={`gs-table`}>
            <thead className="gs-thead" style={{ height: sheet.headerHeight }}>
              <tr className="gs-row">
                <th
                  className="gs-th gs-th-left gs-th-top"
                  style={{ position: 'sticky', width: sheet.headerWidth, height: sheet.headerHeight }}
                  onClick={handleSelectAllClick}
                >
                  <div className="gs-th-inner">
                    <ScrollHandle
                      className={leftHeaderSelecting || topHeaderSelecting ? 'gs-hidden' : ''}
                      style={{ position: 'absolute' }}
                      horizontal={leftHeaderSelecting ? 0 : -1}
                      vertical={topHeaderSelecting ? 0 : -1}
                    />
                    {contextMenu.length > 0 && (
                      <button
                        className="gs-menu-btn gs-corner-menu-btn"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          (e.currentTarget as HTMLElement).dataset.pressX = String(e.clientX);
                          (e.currentTarget as HTMLElement).dataset.pressY = String(e.clientY);
                        }}
                        onMouseUp={(e) => {
                          e.stopPropagation();
                          const btn = e.currentTarget as HTMLElement;
                          const pressX = Number(btn.dataset.pressX ?? e.clientX);
                          const pressY = Number(btn.dataset.pressY ?? e.clientY);
                          const moved = Math.abs(e.clientX - pressX) > 4 || Math.abs(e.clientY - pressY) > 4;
                          if (moved) {
                            return;
                          }
                          const rect = btn.getBoundingClientRect();
                          dispatch(setContextMenuPosition({ y: rect.bottom, x: rect.left }));
                        }}
                      >
                        ⋮
                      </button>
                    )}
                  </div>
                </th>
                <th
                  className="gs-adjuster gs-adjuster-horizontal gs-adjuster-horizontal-left"
                  style={{ width: virtualized?.adjuster?.left ?? 1 }}
                ></th>
                {virtualized?.xs?.map?.((x) => <HeaderCellTop x={x} key={x} />)}
                <th
                  className="gs-adjuster gs-adjuster-horizontal gs-adjuster-horizontal-right"
                  style={{ width: virtualized?.adjuster?.right }}
                ></th>
                {ghostXs.map((x) => (
                  <th
                    key={`ghost-${x}`}
                    className="gs-th gs-ghost-th gs-ghost-th-top"
                    style={{ width: ghostSize.width, minWidth: ghostSize.width, maxWidth: ghostSize.width }}
                  >
                    <div className="gs-th-inner">{x2c(x)}</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="gs-sheet-body-adjuster">
              <tr className="gs-row">
                <th
                  className={`gs-adjuster gs-adjuster-horizontal gs-adjuster-vertical`}
                  style={{ height: virtualized?.adjuster?.top ?? 1 }}
                ></th>
                <td className="gs-adjuster gs-adjuster-vertical"></td>
                {virtualized?.xs?.map((x) => <td className="gs-adjuster gs-adjuster-vertical" key={x}></td>)}
                <th className={`gs-adjuster gs-adjuster-horizontal gs-adjuster-vertical`}></th>
                {ghostXs.map((x) => (
                  <td className="gs-adjuster gs-adjuster-vertical" key={`ghost-${x}`}></td>
                ))}
              </tr>
            </tbody>

            <tbody className="gs-sheet-body-data">
              {virtualized?.ys?.map((y) => {
                return (
                  <tr key={y} className={`gs-row ${y % 2 === 0 ? 'gs-row-even' : 'gs-row-odd'}`}>
                    <HeaderCellLeft y={y} />
                    <td className="gs-adjuster gs-adjuster-horizontal gs-adjuster-horizontal-left" />
                    {virtualized?.xs?.map((x) => <Cell key={x} y={y} x={x} merge={mergeRenders.get(`${y}:${x}`)} />)}
                    <td className="gs-adjuster gs-adjuster-horizontal gs-adjuster-horizontal-right" />
                    {ghostXs.map((x) => ghostCell(y, x))}
                  </tr>
                );
              })}
              {/* autoExpand ghost rows: shown past the last row only while an autofill is dragged. */}
              {ghostYs.map((y) => (
                <tr key={`ghost-${y}`} className="gs-row gs-ghost-row" style={{ height: ghostSize.height }}>
                  <th className="gs-th gs-ghost-th gs-ghost-th-left">
                    <div className="gs-th-inner" style={{ width: sheet.headerWidth }}>
                      {y}
                    </div>
                  </th>
                  <td className="gs-adjuster gs-adjuster-horizontal gs-adjuster-horizontal-left" />
                  {virtualized?.xs?.map((x) => ghostCell(y, x))}
                  <td className="gs-adjuster gs-adjuster-horizontal gs-adjuster-horizontal-right" />
                  {ghostXs.map((x) => ghostCell(y, x))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
