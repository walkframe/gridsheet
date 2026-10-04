import { useCallback, useContext, useEffect, useState } from 'react';
import type { CSSProperties, FC } from 'react';
import { createPortal } from 'react-dom';

import { Context } from '../store';
import { setAutofillDraggingTo } from '../store/actions';
import { useBrowser } from '../lib/hooks';
import { Autofill, among, getGhostCellSize, x2c } from '@gridsheet/web';
import type { Sheet } from '@gridsheet/web';

// Ghost rows/cols kept beyond the drag target, so there is always room to drag further.
const GHOST_ROWS = 5;
const GHOST_COLS = 2;

// Theme tokens the ghost cells use. The layer is portaled to <body> (outside .gs-root1, whose
// overflow would clip anything drawn past the grid), so copy the resolved values over.
const THEME_VARS = ['--gs-border', '--gs-surface', '--gs-header-bg', '--gs-header-fg', '--gs-accent', '--gs-fg'];

/**
 * How many ghost rows/cols to show past the sheet's edge while an autofill is dragged on an
 * auto-expanding sheet — enough to reach the current drag target plus some slack, capped by
 * the max limits. Zero when the sheet can't grow that way.
 */
const getGhostCount = (sheet: Sheet, draggingTo: { y: number; x: number }) => {
  const mode = sheet.autoExpand;
  const room = (limit: number, current: number) => (limit === -1 ? Infinity : Math.max(0, limit - current));
  const rows =
    mode === 'vertical' || mode === 'both'
      ? Math.min(room(sheet.maxNumRows, sheet.numRows), Math.max(0, draggingTo.y - sheet.numRows) + GHOST_ROWS)
      : 0;
  const cols =
    mode === 'horizontal' || mode === 'both'
      ? Math.min(room(sheet.maxNumCols, sheet.numCols), Math.max(0, draggingTo.x - sheet.numCols) + GHOST_COLS)
      : 0;
  return { rows, cols };
};

type Band = { index: number; start: number; size: number };

// The rendered header cells give each visible row/column's on-screen position, which already
// accounts for scrolling, the scroll-height remap and a centered matrix.
const readBands = (tabular: HTMLElement, selector: string, key: 'x' | 'y', horizontal: boolean): Band[] =>
  Array.from(tabular.querySelectorAll<HTMLElement>(selector))
    .filter((th) => th.dataset[key] != null)
    .map((th) => {
      const r = th.getBoundingClientRect();
      return {
        index: Number(th.dataset[key]),
        start: horizontal ? r.left : r.top,
        size: horizontal ? r.width : r.height,
      };
    });

/**
 * The autoExpand ghost area: the not-yet-existing rows (below) / columns (right) drawn OUTSIDE
 * the grid, right past its last row/column, while an autofill is dragged on an auto-expanding
 * sheet. Dragging onto a ghost cell targets it; releasing grows the sheet (see Autofill).
 * Shown only once the grid is scrolled to that edge, so the ghost always continues the last row/col.
 */
export const AutofillGhost: FC = () => {
  const { store, dispatch } = useContext(Context);
  const { sheetReactive, tabularRef, rootRef, autofillDraggingTo, mode } = store;
  const sheet = sheetReactive.current;
  const { document: doc } = useBrowser();
  const [, setTick] = useState(0);
  const active = !!sheet && !!autofillDraggingTo && sheet.autoExpand !== 'none';

  // Positions are read from the DOM, so re-render on anything that moves the grid.
  useEffect(() => {
    if (!active) {
      return;
    }
    const bump = () => setTick((t) => t + 1);
    const el = tabularRef.current;
    el?.addEventListener('scroll', bump);
    window.addEventListener('resize', bump);
    window.addEventListener('scroll', bump, true);
    return () => {
      el?.removeEventListener('scroll', bump);
      window.removeEventListener('resize', bump);
      window.removeEventListener('scroll', bump, true);
    };
  }, [active, tabularRef]);

  const handleEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const y = Number(e.currentTarget.dataset.y);
      const x = Number(e.currentTarget.dataset.x);
      if (autofillDraggingTo && (y !== autofillDraggingTo.y || x !== autofillDraggingTo.x)) {
        dispatch(setAutofillDraggingTo({ y, x }));
      }
    },
    [autofillDraggingTo],
  );

  const tabular = tabularRef.current;
  const inner = tabular?.querySelector<HTMLElement>(':scope > .gs-tabular-inner');
  if (!active || !doc || !tabular || !inner || !sheet || !autofillDraggingTo) {
    return null;
  }

  const count = getGhostCount(sheet, autofillDraggingTo);
  const ghost = getGhostCellSize(sheet);
  const tab = tabular.getBoundingClientRect();
  const grid = inner.getBoundingClientRect();
  // The grid's last row/col is on screen only when scrolled to that edge.
  const atBottom = tabular.scrollTop + tabular.clientHeight >= tabular.scrollHeight - 1;
  const atRight = tabular.scrollLeft + tabular.clientWidth >= tabular.scrollWidth - 1;
  const showRows = count.rows > 0 && atBottom;
  const showCols = count.cols > 0 && atRight;
  if (!showRows && !showCols) {
    return null;
  }

  const fillArea = new Autofill(store, autofillDraggingTo).wholeArea;
  const viewLeft = tab.left + tabular.clientLeft;
  const viewTop = tab.top + tabular.clientTop;
  const viewRight = viewLeft + tabular.clientWidth;
  const viewBottom = viewTop + tabular.clientHeight;
  const gridRight = Math.min(grid.right, viewRight);
  const gridBottom = Math.min(grid.bottom, viewBottom);
  const headerW = sheet.headerWidth;
  const headerH = sheet.headerHeight;

  const cols = readBands(tabular, '.gs-th-top', 'x', true);
  const rows = readBands(tabular, '.gs-th-left', 'y', false);
  const ghostCols: Band[] = showCols
    ? Array.from({ length: count.cols }, (_, i) => ({
        index: sheet.numCols + 1 + i,
        start: gridRight + i * ghost.width,
        size: ghost.width,
      }))
    : [];

  const cell = (y: number, x: number, style: CSSProperties) => (
    <div
      key={`${y}:${x}`}
      className={`gs-ghost-cell ${among(fillArea, { y, x }) ? 'gs-ghost-target' : ''}`}
      data-y={y}
      data-x={x}
      style={style}
      onMouseEnter={handleEnter}
    />
  );

  const vars: Record<string, string> = {};
  if (rootRef.current) {
    const cs = getComputedStyle(rootRef.current);
    THEME_VARS.forEach((v) => (vars[v] = cs.getPropertyValue(v)));
    vars.fontFamily = cs.fontFamily;
  }

  return createPortal(
    <div className="gs-ghost-layer" data-mode={mode} style={vars as CSSProperties}>
      {showRows && (
        // Rows below the grid: one per ghost row, cells under each visible (and ghost) column.
        <div
          className="gs-ghost-panel"
          style={{
            left: viewLeft,
            top: gridBottom,
            width: (showCols ? gridRight + count.cols * ghost.width : viewRight) - viewLeft,
            height: count.rows * ghost.height,
          }}
        >
          {Array.from({ length: count.rows }, (_, i) => {
            const y = sheet.numRows + 1 + i;
            const top = i * ghost.height;
            return [
              ...[...cols, ...ghostCols].map((c) =>
                cell(y, c.index, { left: c.start - viewLeft, top, width: c.size, height: ghost.height }),
              ),
              <div
                key={`th:${y}`}
                className="gs-ghost-th"
                style={{ left: 0, top, width: headerW, height: ghost.height }}
              >
                {y}
              </div>,
            ];
          })}
        </div>
      )}
      {showCols && (
        // Columns right of the grid: a header per ghost column, cells beside each visible row.
        <div
          className="gs-ghost-panel"
          style={{
            left: gridRight,
            top: viewTop,
            width: count.cols * ghost.width,
            height: gridBottom - viewTop,
          }}
        >
          {ghostCols.map((c, i) => [
            ...rows
              .filter((r) => r.start + r.size > viewTop + headerH)
              .map((r) =>
                cell(r.index, c.index, {
                  left: i * ghost.width,
                  top: r.start - viewTop,
                  width: c.size,
                  height: r.size,
                }),
              ),
            <div
              key={`th:${c.index}`}
              className="gs-ghost-th"
              style={{ left: i * ghost.width, top: 0, width: c.size, height: headerH }}
            >
              {x2c(c.index)}
            </div>,
          ])}
        </div>
      )}
    </div>,
    doc.body,
  );
};
