import { useEffect, useRef } from 'react';
import type { Dispatch, RefObject } from 'react';
import { zoneToArea, among, focus } from '@gridsheet/web';

import type { StoreType } from '../types';
import {
  choose,
  select,
  drag,
  selectCols,
  selectRows,
  setDragging,
  setAutofillDraggingTo,
  setContextMenuPosition,
  setColumnMenu,
  setRowMenu,
  setResizingPositionX,
  setResizingPositionY,
} from '../store/actions';

// Touch gestures for the grid. The mouse handlers on Cell / HeaderCell* stay the single
// implementation of selection & editing; this hook only decides what a touch *means* and
// then either drives the store directly or replays it as the mouse events those handlers
// (and StoreObserver's edge auto-scroll) already understand.
//
//   tap                      → select (replayed as mousedown/mouseup)
//   double tap               → edit, with the soft keyboard
//   long press on a cell     → context menu
//   long press on a header   → column / row menu
//   drag from the cursor cell or a selected header → extend the selection
//   drag the autofill handle → autofill
//   drag a header resizer    → resize
//   anything else            → native scroll (no selection change)

const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE = 8;
const DOUBLE_TAP_MS = 350;
// Dragging within this distance of the grid's edge (inside the headers for top/left)
// auto-scrolls; a finger can't go *past* the edge when the grid fills the screen.
const EDGE_BAND = 24;
const EDGE_SPEED = 12;

const INTERACTIVE = 'input, textarea, select, button, a, label, [contenteditable="true"], [contenteditable=""]';

type Mode =
  | 'pending' // undecided: becomes a tap, a long press, or a native scroll
  | 'range-pending' // started on the cursor cell: becomes a range drag on move
  | 'header-pending' // started on a selected header: becomes a header range drag on move
  | 'range'
  | 'header-range'
  | 'autofill'
  | 'resize'
  | 'resize-pending'
  | 'done'; // handled (long press fired) or abandoned (scroll / multi-touch)

type Point = { y: number; x: number };

const pointOf = (el: Element | null): Point | null => {
  const cell = el?.closest<HTMLElement>('.gs-cell, .gs-ghost-cell');
  if (!cell) {
    return null;
  }
  const y = Number(cell.dataset.y);
  const x = Number(cell.dataset.x);
  return Number.isNaN(y) || Number.isNaN(x) ? null : { y, x };
};

// The cell under a viewport point, looking through overlays such as the scroll handles.
const cellAt = (x: number, y: number): Point | null => {
  for (const el of document.elementsFromPoint(x, y)) {
    const p = pointOf(el);
    if (p) {
      return p;
    }
  }
  return null;
};

const indexOf = (el: Element | null, key: 'x' | 'y'): number | null => {
  const v = el?.closest<HTMLElement>(`[data-${key}]`)?.dataset[key];
  const n = Number(v);
  return v == null || Number.isNaN(n) ? null : n;
};

const mouse = (type: string, x: number, y: number, buttons: number) =>
  new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, buttons });

export const useTouchGestures = (
  tabularRef: RefObject<HTMLDivElement>,
  store: StoreType,
  dispatch: Dispatch<any>,
  // Tabular renders a placeholder until the registry is ready; attach once the grid exists.
  ready: boolean,
) => {
  const latest = useRef({ store, dispatch });
  latest.current = { store, dispatch };

  useEffect(() => {
    const el = tabularRef.current;
    if (!el || !ready) {
      return;
    }
    let lastTap = { at: 0, key: '' };
    // Set while a touch is down (and briefly after) so the browser's own long-press
    // contextmenu (Android) doesn't open a second menu on top of ours.
    let touchActiveUntil = 0;

    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (e.touches.length !== 1 || !target?.closest || target.closest(INTERACTIVE)) {
        return;
      }
      const { store: s0 } = latest.current;
      const sheet = s0.sheetReactive.current;
      if (!sheet) {
        return;
      }
      const t0 = e.touches[0];
      const start = { x: t0.clientX, y: t0.clientY };
      let last = start;
      let mode: Mode = 'pending';
      let lastKey = '';
      touchActiveUntil = Infinity;

      const resizer = target.closest('.gs-resizer');
      const th = target.closest<HTMLElement>('.gs-th');
      const isTop = !!th?.classList.contains('gs-th-top');
      const editing = !!(sheet.registry.editingAddress || s0.editingAddress);
      if (resizer) {
        mode = resizer.classList.contains('gs-protected') ? 'done' : 'resize-pending';
      } else if (target.closest('.gs-autofill-drag')) {
        const p = pointOf(target);
        if (p) {
          mode = 'autofill';
          const { dispatch: d } = latest.current;
          d(setAutofillDraggingTo(p));
          d(setDragging(true));
        }
      } else if (th) {
        if (th.classList.contains('gs-th-selecting') && !editing) {
          mode = 'header-pending';
        }
      } else if (target.closest('.gs-cell.gs-choosing') && !editing) {
        mode = 'range-pending';
      }

      const longPress =
        // A resizer is thin and near the header middle; holding it still is a long press too.
        mode === 'pending' || mode === 'range-pending' || mode === 'header-pending' || mode === 'resize-pending'
          ? window.setTimeout(() => {
              mode = 'done';
              openMenu(target, start);
            }, LONG_PRESS_MS)
          : 0;

      // Listen on the target itself: a virtualized row can be unmounted mid-drag, and
      // touch events keep targeting the detached node, so they'd never bubble to `el`.
      let raf = 0;
      const cleanup = () => {
        window.clearTimeout(longPress);
        cancelAnimationFrame(raf);
        target.removeEventListener('touchmove', onMove);
        target.removeEventListener('touchend', onEnd);
        target.removeEventListener('touchcancel', onCancel);
        touchActiveUntil = performance.now() + 600;
      };

      // Extend the range / autofill to the cell under the finger (clamped into the cells).
      const extend = () => {
        const { store: s, dispatch: d } = latest.current;
        const sh = s.sheetReactive.current;
        if (!sh) {
          return;
        }
        const r = el.getBoundingClientRect();
        const x = Math.min(Math.max(last.x, r.left + sh.headerWidth + 1), r.right - 1);
        const y = Math.min(Math.max(last.y, r.top + sh.headerHeight + 1), r.bottom - 1);
        const p = cellAt(x, y);
        if (p && `${p.y}:${p.x}` !== lastKey) {
          lastKey = `${p.y}:${p.x}`;
          d(mode === 'autofill' ? setAutofillDraggingTo(p) : drag(p));
        }
      };

      // While the finger rests near an edge, keep scrolling and extending.
      const edgeScroll = () => {
        raf = 0;
        const sh = latest.current.store.sheetReactive.current;
        if ((mode !== 'range' && mode !== 'autofill') || !sh) {
          return;
        }
        const r = el.getBoundingClientRect();
        const dy =
          last.y > r.bottom - EDGE_BAND ? EDGE_SPEED : last.y < r.top + sh.headerHeight + EDGE_BAND ? -EDGE_SPEED : 0;
        const dx =
          last.x > r.right - EDGE_BAND ? EDGE_SPEED : last.x < r.left + sh.headerWidth + EDGE_BAND ? -EDGE_SPEED : 0;
        if (!dy && !dx) {
          return;
        }
        el.scrollTop += dy;
        el.scrollLeft += dx;
        extend();
        raf = requestAnimationFrame(edgeScroll);
      };

      const onMove = (ev: TouchEvent) => {
        const t = ev.touches[0];
        if (!t || ev.touches.length > 1) {
          return;
        }
        last = { x: t.clientX, y: t.clientY };
        const moved = Math.hypot(last.x - start.x, last.y - start.y) > MOVE_TOLERANCE;
        const { store: s, dispatch: d } = latest.current;
        const sh = s.sheetReactive.current;
        if (moved) {
          window.clearTimeout(longPress);
        }
        if (!sh) {
          return;
        }
        switch (mode) {
          case 'pending':
            if (moved) {
              mode = 'done'; // native scroll
            }
            return;
          case 'range-pending': {
            if (!moved) {
              return;
            }
            const p = pointOf(target);
            if (!p) {
              mode = 'done';
              return;
            }
            mode = 'range';
            d(select({ startY: p.y, startX: p.x, endY: -1, endX: -1 }));
            d(setDragging(true));
            break;
          }
          case 'header-pending':
            if (!moved) {
              return;
            }
            mode = 'header-range';
            break;
          case 'resize-pending': {
            if (!moved) {
              return;
            }
            const idx = indexOf(target, isTop ? 'x' : 'y');
            if (idx == null) {
              mode = 'done';
              return;
            }
            mode = 'resize';
            if (isTop) {
              d(setResizingPositionX([idx, start.x, start.x]));
            } else {
              d(setResizingPositionY([idx, start.y, start.y]));
            }
            break;
          }
        }
        if (mode === 'done') {
          return;
        }
        ev.preventDefault();
        const under = document.elementFromPoint(last.x, last.y);
        if (mode === 'resize') {
          // The overlay (Resizer) owns the clamping and the commit; drive it like a mouse.
          s.mainRef.current?.querySelector('.gs-resizing')?.dispatchEvent(mouse('mousemove', last.x, last.y, 1));
          return;
        }
        if (mode === 'header-range') {
          const { startY, startX } = s.selectingZone;
          if (isTop) {
            const x = indexOf(under, 'x');
            if (x != null && x >= 1 && String(x) !== lastKey) {
              lastKey = String(x);
              d(drag(startY === 1 ? { y: sh.numRows, x } : { y: 1, x }));
            }
          } else {
            const y = indexOf(under, 'y');
            if (y != null && y >= 1 && String(y) !== lastKey) {
              lastKey = String(y);
              d(drag(startX === 1 ? { y, x: sh.numCols } : { y, x: 1 }));
            }
          }
          return;
        }
        // range / autofill
        extend();
        if (!raf) {
          raf = requestAnimationFrame(edgeScroll);
        }
      };

      const onEnd = (ev: TouchEvent) => {
        cleanup();
        const { store: s } = latest.current;
        switch (mode) {
          case 'range':
          case 'autofill':
            // StoreObserver's mouseup handler submits the autofill and clears `dragging`.
            ev.preventDefault();
            window.dispatchEvent(mouse('mouseup', last.x, last.y, 0));
            return;
          case 'resize':
            ev.preventDefault();
            s.mainRef.current?.querySelector('.gs-resizing')?.dispatchEvent(mouse('mouseup', last.x, last.y, 0));
            return;
          case 'header-range':
          case 'done':
            // Swallow the emulated mouse events of a long press / drag.
            if (ev.cancelable) {
              ev.preventDefault();
            }
            return;
          case 'resize-pending':
          case 'pending':
          case 'range-pending':
          case 'header-pending':
            if (!ev.cancelable) {
              return; // the browser already treated it as a scroll
            }
            ev.preventDefault();
            tap(target, start);
        }
      };

      // The system took the touch over (e.g. a gesture or an incoming call): end a drag
      // where it is, drop a resize.
      const onCancel = () => {
        cleanup();
        const { dispatch: d } = latest.current;
        if (mode === 'range' || mode === 'autofill') {
          window.dispatchEvent(mouse('mouseup', last.x, last.y, 0));
        } else if (mode === 'resize') {
          d(setResizingPositionX([-1, -1, -1]));
          d(setResizingPositionY([-1, -1, -1]));
        }
      };

      target.addEventListener('touchmove', onMove, { passive: false });
      target.addEventListener('touchend', onEnd, { passive: false });
      target.addEventListener('touchcancel', onCancel);
    };

    // A tap is replayed as a mouse click so it goes through exactly the mouse path
    // (selection, formula ref insertion while editing, header selection). Done by hand
    // rather than relying on the browser's emulated mouse events, which iOS only fires
    // for elements it considers clickable.
    const tap = (target: HTMLElement, at: { x: number; y: number }) => {
      const p = pointOf(target);
      const key = p ? `${p.y}:${p.x}` : '';
      const now = performance.now();
      const isDouble = !!p && key === lastTap.key && now - lastTap.at < DOUBLE_TAP_MS;
      lastTap = { at: isDouble ? 0 : now, key };
      if (isDouble) {
        startEditing();
        return;
      }
      // A tap on a resizer selects the header instead of starting a resize.
      const el = target.closest('.gs-resizer')?.closest<HTMLElement>('.gs-th-inner-wrap') ?? target;
      el.dispatchEvent(mouse('mousedown', at.x, at.y, 1));
      el.dispatchEvent(mouse('mouseup', at.x, at.y, 0));
    };

    const startEditing = () => {
      const input = latest.current.store.editorRef.current;
      if (!input) {
        return;
      }
      // The editor keeps inputmode="none" while not editing so a plain tap doesn't pop up
      // the soft keyboard. Lift it and re-focus within this touch (a user gesture) so the
      // keyboard does open, then enter edit mode through the editor's dblclick handler.
      input.removeAttribute('inputmode');
      input.blur();
      focus(input);
      input.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
    };

    const openMenu = (target: HTMLElement, at: { x: number; y: number }) => {
      const { store: s, dispatch: d } = latest.current;
      const sheet = s.sheetReactive.current;
      if (!sheet) {
        return;
      }
      const th = target.closest<HTMLElement>('.gs-th');
      if (th) {
        const inner = th.querySelector('.gs-th-inner') ?? th;
        const rect = inner.getBoundingClientRect();
        const { selectingZone: z } = s;
        if (th.classList.contains('gs-th-top')) {
          const x = indexOf(th, 'x');
          if (x == null) {
            return;
          }
          if (th.querySelector('.gs-column-menu-btn')) {
            const selected = x >= Math.min(z.startX, z.endX) && x <= Math.max(z.startX, z.endX) && z.startY === 1;
            if (!selected || z.endY !== sheet.numRows) {
              d(selectCols({ range: { start: x, end: x }, numRows: sheet.numRows }));
            }
            d(setColumnMenu({ x, position: { y: rect.bottom, x: rect.left } }));
            return;
          }
        } else {
          const y = indexOf(th, 'y');
          if (y == null) {
            return;
          }
          if (th.querySelector('.gs-row-menu-btn')) {
            const selected = y >= Math.min(z.startY, z.endY) && y <= Math.max(z.startY, z.endY) && z.startX === 1;
            if (!selected || z.endX !== sheet.numCols) {
              d(selectRows({ range: { start: y, end: y }, numCols: sheet.numCols }));
            }
            d(setRowMenu({ y, position: { y: rect.bottom, x: rect.right } }));
            return;
          }
        }
        if (s.contextMenu.length > 0) {
          d(setContextMenuPosition({ y: at.y, x: at.x }));
        }
        return;
      }
      const p = pointOf(target);
      if (!p || s.contextMenu.length === 0) {
        return;
      }
      // Like a right click on desktop spreadsheets: act on the pressed cell unless it's
      // already part of the selection.
      const area = zoneToArea(s.selectingZone);
      const inSelection = (area.bottom !== -1 && among(area, p)) || (s.choosing.y === p.y && s.choosing.x === p.x);
      if (!inSelection) {
        d(choose(p));
        d(select({ startY: p.y, startX: p.x, endY: p.y, endX: p.x }));
      }
      d(setContextMenuPosition({ y: at.y, x: at.x }));
    };

    const onContextMenu = (e: MouseEvent) => {
      if (performance.now() < touchActiveUntil) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('contextmenu', onContextMenu, true);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('contextmenu', onContextMenu, true);
    };
  }, [tabularRef, ready]);
};
