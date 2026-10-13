import { useContext, useRef, useEffect } from 'react';

import { setContextMenuPosition } from '../store/actions';

import { Context } from '../store';
import { Fixed } from './Fixed';
import type { ContextMenuItemDescriptor } from '../lib/menu';
import { buildMenuContext } from '../lib/menu';
import { MenuNodes, type MenuNode } from './MenuNodes';
import { clampPopup } from '@gridsheet/web';

const GAP = 6;
const MARGIN = 8;

// Put the menu right below the anchor, or right above it when it doesn't fit there. When it
// fits on neither side it goes on the roomier one and scrolls, rather than covering the anchor
// (on touch, the finger that opened it). Idempotent: it runs after every render.
const placeAroundAnchor = (el: HTMLElement, anchorTop: number, anchorBottom: number) => {
  el.style.maxHeight = '';
  el.style.overflowY = '';
  const height = el.getBoundingClientRect().height;
  const below = window.innerHeight - MARGIN - (anchorBottom + GAP);
  const above = anchorTop - GAP - MARGIN;
  let top = anchorBottom + GAP;
  let maxHeight = 0;
  if (height > below) {
    if (height <= above) {
      top = anchorTop - GAP - height;
    } else if (above > below) {
      top = MARGIN;
      maxHeight = above;
    } else {
      maxHeight = below;
    }
  }
  el.style.top = `${top}px`;
  if (maxHeight) {
    el.style.maxHeight = `${maxHeight}px`;
    el.style.overflowY = 'auto';
  }
};

export const ContextMenu = () => {
  const { store, dispatch } = useContext(Context);
  const { contextMenuPosition, contextMenu } = store;
  const { y: top, x: left, anchorTop, anchorBottom } = contextMenuPosition;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = menuRef.current;
    if (!el) {
      return;
    }
    if (anchorTop != null && anchorBottom != null) {
      placeAroundAnchor(el, anchorTop, anchorBottom);
    }
    clampPopup(el);
  });

  if (top === -1) {
    return null;
  }

  const close = () => dispatch(setContextMenuPosition({ y: -1, x: -1 }));
  const ctx = buildMenuContext(store, dispatch, close);

  return (
    <Fixed
      className="gs-menu-modal gs-context-menu-modal"
      onClick={(e: MouseEvent) => {
        e.preventDefault();
        close();
        return false;
      }}
    >
      <div ref={menuRef} className={'gs-context-menu'} style={{ top: top, left: left }}>
        <ul className="gs-menu-items">
          <MenuNodes items={contextMenu as MenuNode[]} ctx={ctx} args={[]} onSelect={close} />
        </ul>
      </div>
    </Fixed>
  );
};
