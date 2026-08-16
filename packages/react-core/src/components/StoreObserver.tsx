import type { FC, MutableRefObject } from 'react';
import { createRef, useContext, useEffect, useRef, useState } from 'react';

import type { OptionsType, Props, SheetHandle, StoreHandle } from '../types';
import { Context } from '../store';

import { setStore, updateSheet, submitAutofill, setDragging, setAutofillDraggingTo, drag } from '../store/actions';

import { usePluginContext } from './PluginBase';
import { Sheet } from '@gridsheet/web';

type StoreObserverProps = Omit<OptionsType, 'sheetHeight' | 'sheetWidth'> & {
  // GridSheet always passes the resolved pixel size here, even in string-based fill mode.
  sheetHeight?: number;
  sheetWidth?: number;
  fixedWidth?: boolean;
  fixedHeight?: boolean;
  sheetName?: string;
  sheetRef?: MutableRefObject<SheetHandle | null>;
  storeRef?: MutableRefObject<StoreHandle | null>;
};

export const createSheetRef = () => createRef<SheetHandle | null>();
export const useSheetRef = () => useRef<SheetHandle | null>(null);
export const createStoreRef = () => createRef<StoreHandle | null>();
export const useStoreRef = () => useRef<StoreHandle | null>(null);
export const StoreObserver: FC<StoreObserverProps> = ({
  sheetName,
  sheetHeight,
  sheetWidth,
  fixedWidth,
  fixedHeight,
  sheetRef,
  storeRef,
  editingOnEnter,
  mode,
}) => {
  const { store, dispatch } = useContext(Context);
  const { sheetReactive } = store;
  const sheet = sheetReactive.current;

  // Drag-during-scroll + robust drag-end. A capture-phase mousemove tracks the
  // cursor (Tabular stopPropagations mousemove, so bubble listeners never see it over
  // the grid). While a drag is active and the cursor is at/past a container edge (incl.
  // over the toolbar below the grid) an rAF loop scrolls and extends the selection to
  // the cell now under the cursor — but ONLY when that cell CHANGES, so holding at the
  // bottom dispatches nothing (no re-render/edit flood, no freeze). A capture mouseup
  // (and a button-up mousemove for releases we never got a mouseup for) ends it exactly
  // once and submits/clears, so autofillDraggingTo can never stay set and block clicks.
  const dragRef = useRef({ store, dispatch });
  dragRef.current = { store, dispatch };
  useEffect(() => {
    let raf = 0;
    let running = false;
    let dead = false;
    let cx = 0;
    let cy = 0;
    let lastCell = '';
    let lastExtend = 0;
    const EDGE = 0;
    const SPEED = 18;

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const finish = () => {
      if (dead) {
        return;
      }
      dead = true;
      stop();
      const { store: s, dispatch: d } = dragRef.current;
      if (s.autofillDraggingTo) {
        d(submitAutofill(s.autofillDraggingTo));
      }
      if (s.dragging) {
        d(setDragging(false));
      }
    };

    const tick = () => {
      if (dead || !running) {
        return;
      }
      const { store: s, dispatch: d } = dragRef.current;
      const el = s.tabularRef?.current;
      if (!el || !(s.dragging || s.autofillDraggingTo)) {
        running = false;
        return;
      }
      const r = el.getBoundingClientRect();
      const dy = cy > r.bottom - EDGE ? SPEED : cy < r.top + EDGE ? -SPEED : 0;
      const dx = cx > r.right - EDGE ? SPEED : cx < r.left + EDGE ? -SPEED : 0;
      if (dy || dx) {
        el.scrollTop += dy;
        el.scrollLeft += dx;
        const px = Math.min(Math.max(cx, r.left + 1), r.right - 1);
        const py = Math.min(Math.max(cy, r.top + 1), r.bottom - 1);
        const cell = (document.elementFromPoint(px, py) as HTMLElement | null)?.closest('.gs-cell') as HTMLElement | null;
        if (cell) {
          const y = Number(cell.dataset.y);
          const x = Number(cell.dataset.x);
          const key = y + ':' + x;
          const now = performance.now();
          // Dispatch only when the target cell CHANGES (holding still — e.g. at the
          // bottom over the toolbar — dispatches nothing → no freeze) AND at most every
          // 80ms (so a fast scroll doesn't re-render every frame and starve mousemove,
          // which would freeze `cy` and make the scroll unstoppable).
          if (!Number.isNaN(y) && !Number.isNaN(x) && key !== lastCell && now - lastExtend > 80) {
            lastCell = key;
            lastExtend = now;
            d(s.autofillDraggingTo ? setAutofillDraggingTo({ x, y }) : drag({ y, x }));
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      if (e.buttons === 0) {
        // Button up. End the drag once (covers a release we never got a mouseup for).
        const { store: s } = dragRef.current;
        if (!dead && (running || s.autofillDraggingTo != null || s.dragging)) {
          finish();
        }
        return;
      }
      cx = e.clientX;
      cy = e.clientY;
      const { store: s } = dragRef.current;
      if (!dead && !running && (s.dragging || s.autofillDraggingTo)) {
        running = true;
        lastCell = '';
        raf = requestAnimationFrame(tick);
      }
    };

    const onDown = () => {
      dead = false;
    };

    // onUp is the SOLE authority for ending a mouse drag. It is a capture-phase
    // WINDOW listener, so it fires on every mouseup before anything can stopPropagation
    // it — strictly more reliable than a cell's own onMouseUp, which in the VS Code
    // webview did NOT clear autofillDraggingTo when the release landed on a cell (it
    // stayed set and blocked every later click + froze scrolling). We submit/clear here
    // from the live store; the cell's handleDragEnd no longer submits, so there is no
    // double-fill despite this firing first (capture) then the cell's handler (bubble).
    const onUp = () => {
      dead = true;
      stop();
      const { store: s, dispatch: d } = dragRef.current;
      if (s.autofillDraggingTo) {
        d(submitAutofill(s.autofillDraggingTo));
      }
      if (s.dragging) {
        d(setDragging(false));
      }
    };

    // A drag can end WITHOUT a mouseup we ever see: the user drags the autofill
    // handle past the grid, out of the webview/window entirely, and releases there.
    // No mouseup → the old code left dragging/autofillDraggingTo stuck and the
    // rAF loop scrolling+extending forever. Ending the drag when the pointer leaves
    // the document (mouseleave) or the window loses focus (blur) closes that hole.
    // Scrolling OVER the in-grid toolbar still works: that stays inside the document,
    // so neither fires until the cursor exits the webview.
    const onLeaveWindow = () => finish();

    window.addEventListener('mousedown', onDown, true);
    window.addEventListener('mousemove', onMove, true);
    window.addEventListener('mouseup', onUp, true);
    window.addEventListener('blur', onLeaveWindow);
    document.addEventListener('mouseleave', onLeaveWindow);
    return () => {
      window.removeEventListener('mousedown', onDown, true);
      window.removeEventListener('mousemove', onMove, true);
      window.removeEventListener('mouseup', onUp, true);
      window.removeEventListener('blur', onLeaveWindow);
      document.removeEventListener('mouseleave', onLeaveWindow);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!sheet) {
      return;
    }
    if (sheetName && sheetName !== sheet.name) {
      sheet.name = sheetName;
      sheet.registry.sheetIdsByName[sheetName] = sheet.id;
      delete sheet.registry.sheetIdsByName[sheet.prevName];
      sheet.prevName = sheetName;
      //book.transmit();
    }
  }, [sheetName]);

  useEffect(() => {
    if (!sheet) {
      return;
    }
    const { registry } = sheet;
    requestAnimationFrame(() => registry.boot());
    registry.contextsBySheetId[sheet.id] = { store, dispatch };
    registry.transmit();

    if (sheetRef) {
      sheetRef.current = {
        sheet,
        apply: (sheet) => {
          dispatch(updateSheet(sheet as Sheet));
        },
      };
    }
    if (storeRef) {
      storeRef.current = {
        store,
        apply: (store) => {
          dispatch(setStore(store));
        },
        dispatch,
      };
    }
  }, [store, sheet, sheetRef, storeRef]);

  useEffect(() => {
    if (sheetHeight) {
      dispatch(setStore({ sheetHeight }));
    }
  }, [sheetHeight, dispatch]);
  useEffect(() => {
    if (sheetWidth) {
      dispatch(setStore({ sheetWidth }));
    }
  }, [sheetWidth]);
  useEffect(() => {
    dispatch(setStore({ fixedWidth: !!fixedWidth, fixedHeight: !!fixedHeight }));
  }, [fixedWidth, fixedHeight]);
  useEffect(() => {
    if (typeof editingOnEnter !== 'undefined') {
      dispatch(setStore({ editingOnEnter }));
    }
  }, [editingOnEnter]);
  useEffect(() => {
    if (mode) {
      dispatch(setStore({ mode }));
    }
  }, [mode]);

  const [pluginProvided, pluginContext] = usePluginContext();
  useEffect(() => {
    if (!pluginProvided) {
      return;
    }
    pluginContext.setStore(store);
    pluginContext.setApply(() => dispatch);
  }, [store, pluginProvided, pluginContext]);

  return <></>;
};
