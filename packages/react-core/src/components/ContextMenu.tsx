import { useContext, useRef, useLayoutEffect } from 'react';

import { setContextMenuPosition } from '../store/actions';

import { Context } from '../store';
import { Fixed } from './Fixed';
import type { ContextMenuItemDescriptor } from '../lib/menu';
import { buildMenuContext } from '../lib/menu';
import { MenuItem, MenuDivider } from './MenuItem';
import { clampPopup } from '../lib/popup';

export const ContextMenu = () => {
  const { store, dispatch } = useContext(Context);
  const { contextMenuPosition, contextMenu } = store;
  const { y: top, x: left } = contextMenuPosition;
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
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
          {contextMenu.map((d, i) => {
            if (d.type === 'divider') {
              if (d.visible && !d.visible(ctx)) {
                return null;
              }
              return <MenuDivider key={i} />;
            }
            if (d.type === 'component') {
              return null;
            }
            const visible = !d.visible || d.visible(ctx);
            if (!visible) {
              return null;
            }
            const disabled = d.disabled?.(ctx) ?? false;
            const label = typeof d.label === 'function' ? d.label(ctx) : d.label;
            const shortcuts = typeof d.shortcuts === 'function' ? d.shortcuts(ctx) : d.shortcuts;
            const checked = d.checked?.(ctx);
            return (
              <MenuItem
                key={i}
                label={label}
                shortcuts={shortcuts}
                disabled={disabled}
                checked={checked}
                testId={d.id ? `${d.id}-item` : undefined}
                onClick={() => d.onClick(ctx)}
              />
            );
          })}
        </ul>
      </div>
    </Fixed>
  );
};
