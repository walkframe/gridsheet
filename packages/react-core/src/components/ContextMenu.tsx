import { useContext, useRef, useEffect } from 'react';

import { setContextMenuPosition } from '../store/actions';

import { Context } from '../store';
import { Fixed } from './Fixed';
import type { ContextMenuItemDescriptor } from '../lib/menu';
import { buildMenuContext } from '../lib/menu';
import { MenuNodes, type MenuNode } from './MenuNodes';
import { clampPopup } from '@gridsheet/web';

export const ContextMenu = () => {
  const { store, dispatch } = useContext(Context);
  const { contextMenuPosition, contextMenu } = store;
  const { y: top, x: left } = contextMenuPosition;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (menuRef.current) {
      clampPopup(menuRef.current);
    }
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
