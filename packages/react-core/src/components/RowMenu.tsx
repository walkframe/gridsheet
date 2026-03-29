import { type FC, useContext } from 'react';
import { Context } from '../store';
import { setRowMenu } from '../store/actions';
import { Fixed } from './Fixed';
import { focus } from '@gridsheet/core/lib/dom';
import type { RowMenuItemDescriptor } from '../lib/menu';
import { buildMenuContext } from '../lib/menu';
import { MenuItem, MenuDivider } from './MenuItem';

function renderRowDescriptor(
  descriptor: RowMenuItemDescriptor,
  ctx: ReturnType<typeof buildMenuContext>,
  y: number,
  index: number,
  close: () => void,
) {
  if (descriptor.type === 'divider') {
    return <MenuDivider key={index} />;
  }
  if (descriptor.type === 'component') {
    return null;
  }
  const visible = !descriptor.visible || descriptor.visible(ctx, y);
  if (!visible) {
    return null;
  }
  const disabled = descriptor.disabled?.(ctx, y) ?? false;
  const label = typeof descriptor.label === 'function' ? descriptor.label(ctx, y) : descriptor.label;
  const shortcuts = typeof descriptor.shortcuts === 'function' ? descriptor.shortcuts(ctx, y) : descriptor.shortcuts;
  const checked = descriptor.checked != null ? descriptor.checked(ctx, y) : undefined;
  return (
    <MenuItem
      key={index}
      label={label}
      shortcuts={shortcuts}
      disabled={disabled}
      checked={checked}
      testId={descriptor.id ? `${descriptor.id}-item` : undefined}
      onClick={() => {
        descriptor.onClick(ctx, y);
        close();
      }}
    />
  );
}

export const RowMenu: FC = () => {
  const { store, dispatch } = useContext(Context);
  const { rowMenuState, sheetReactive: sheetRef, editorRef, rowMenu } = store;
  const sheet = sheetRef.current;

  const y = rowMenuState?.y;
  const position = rowMenuState?.position;

  const handleClose = () => {
    dispatch(setRowMenu(null));
    focus(editorRef.current);
  };

  if (!rowMenuState || !sheet || y == null || !position) {
    return null;
  }

  const ctx = buildMenuContext(store, dispatch, handleClose);

  return (
    <Fixed
      className="gs-menu-modal gs-row-menu-modal"
      onClick={(e: MouseEvent) => {
        e.preventDefault();
        handleClose();
        return false;
      }}
    >
      <div className="gs-row-menu" style={{ top: position.y, left: position.x }} onClick={(e) => e.stopPropagation()}>
        <ul className="gs-menu-items">
          {rowMenu.map((descriptor, index) => renderRowDescriptor(descriptor, ctx, y, index, handleClose))}
        </ul>
      </div>
    </Fixed>
  );
};
