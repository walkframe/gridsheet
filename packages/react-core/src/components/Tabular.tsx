import { useEffect, useContext, useState, useCallback, useMemo } from 'react';

import { Cell, type MergeRender } from './Cell';
import { HeaderCellTop } from './HeaderCellTop';
import { HeaderCellLeft } from './HeaderCellLeft';
import { CellStateOverlay } from './CellStateOverlay';

import { Context } from '../store';
import { choose, select, setAutofillDraggingTo, setContextMenuPosition } from '../store/actions';

import type { RefPaletteType, Virtualization } from '../types';
import { virtualize, physicalScrollHeight, getGhostCellSize, SCROLL_CAP, range, x2c } from '@gridsheet/web';
import { p2a, stripAddressAbsolute } from '@gridsheet/web';
import { Lexer, stripSheetName } from '@gridsheet/web';
import { ScrollHandle } from './ScrollHandle';
import { preventSafariBounce } from '@gridsheet/web';
import type { Sheet } from '@gridsheet/web';

// Ghost rows/cols kept beyond the drag target, so there is always room to drag (and
// auto-scroll) further past the sheet's edge.
const GHOST_ROWS = 5;
const GHOST_COLS = 2;

/**
 * How many ghost rows/cols to show past the sheet's edge while an autofill is dragged on an
 * auto-expanding sheet — enough to reach the current drag target plus some slack, capped by
 * the max limits. Zero when the sheet can't grow that way.
 */
const getGhostCount = (sheet: Sheet, draggingTo: { y: number; x: number } | null) => {
  const mode = sheet.autoExpand;
  if (!draggingTo || mode === 'none') {
    return { rows: 0, cols: 0 };
  }
  const room = (limit: number, current: number) => (limit === -1 ? Infinity : Math.max(0, limit - current));
  // A capped (remapped) scroll height can't be extended linearly, so very tall sheets get no row ghosts.
  const rows =
    (mode === 'vertical' || mode === 'both') && sheet.totalHeight <= SCROLL_CAP
      ? Math.min(room(sheet.maxNumRows, sheet.numRows), Math.max(0, draggingTo.y - sheet.numRows) + GHOST_ROWS)
      : 0;
  const cols =
    mode === 'horizontal' || mode === 'both'
      ? Math.min(room(sheet.maxNumCols, sheet.numCols), Math.max(0, draggingTo.x - sheet.numCols) + GHOST_COLS)
      : 0;
  return { rows, cols };
};

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
  } = store;
  const sheet = sheetReactive.current;

  const [virtualized, setVirtualized] = useState<Virtualization | null>(null);

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

  const ghostCount = getGhostCount(sheet, autofillDraggingTo);
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
