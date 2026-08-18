import { type FC, useContext } from 'react';
import { Context } from '../store';
import { setRowMenu } from '../store/actions';
import { Fixed } from './Fixed';
import { focus } from '@gridsheet/web';
import { buildMenuContext } from '../lib/menu';
import { MenuNodes, type MenuNode } from './MenuNodes';

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
          <MenuNodes items={rowMenu as MenuNode[]} ctx={ctx} args={[y]} onSelect={handleClose} />
        </ul>
      </div>
    </Fixed>
  );
};
