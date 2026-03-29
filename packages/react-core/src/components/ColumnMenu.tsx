import { type FC, useContext, useCallback, useState } from 'react';
import { Context } from '../store';
import { setColumnMenu } from '../store/actions';
import { Fixed } from './Fixed';
import { focus } from '@gridsheet/core';
import { buildMenuContext } from '../lib/menu';
import { getMenuComponent } from '../lib/menu';
import { MenuItem, MenuDivider } from './MenuItem';

// Import section modules so their registerMenuComponent() calls run at load time.
// Users may override any of these ids via registerMenuComponent() after import.
import './ColumnMenuFilterSection';
import './ColumnMenuSortSection';
import './ColumnMenuLabelSection';

export const ColumnMenu: FC = () => {
  const { store, dispatch } = useContext(Context);
  const { columnMenuState, editorRef, colMenu } = store;
  const sheet = store.sheetReactive.current;

  const x = columnMenuState?.x;
  const position = columnMenuState?.position;

  const [waitingState, setWaitingState] = useState<{ message: string; cancel: () => void } | null>(null);

  const handleClose = useCallback(() => {
    dispatch(setColumnMenu(null));
    focus(editorRef.current);
  }, [dispatch, editorRef]);

  const handleWaiting = useCallback(
    (message: string | null, cancel?: () => void) => {
      if (message) {
        setWaitingState({ message, cancel: cancel ?? handleClose });
      } else {
        setWaitingState(null);
      }
    },
    [handleClose],
  );

  if (!columnMenuState || !sheet || x == null || !position) {
    return null;
  }

  const ctx = buildMenuContext(store, dispatch, handleClose);

  return (
    <Fixed
      className="gs-menu-modal gs-column-menu-modal"
      onClick={(e: MouseEvent) => {
        e.preventDefault();
        if (!waitingState) {
          handleClose();
        }
        return false;
      }}
    >
      <div
        className="gs-column-menu"
        style={{ top: position.y, left: position.x, display: waitingState ? 'none' : undefined }}
        onClick={(e) => e.stopPropagation()}
      >
        <ul className="gs-menu-items">
          {colMenu.map((descriptor, index) => {
            if (descriptor.type === 'component') {
              const visible = !descriptor.visible || descriptor.visible(ctx, x);
              if (!visible) {
                return null;
              }
              const Section = getMenuComponent(descriptor.componentId);
              if (!Section) {
                return null;
              }
              return <Section key={index} x={x} close={handleClose} onWaiting={handleWaiting} />;
            }
            if (descriptor.type === 'divider') {
              if (descriptor.visible && !descriptor.visible(ctx)) {
                return null;
              }
              return <MenuDivider key={index} />;
            }
            const visible = !descriptor.visible || descriptor.visible(ctx, x);
            if (!visible) {
              return null;
            }
            const disabled = descriptor.disabled?.(ctx, x) ?? false;
            const label = typeof descriptor.label === 'function' ? descriptor.label(ctx, x) : descriptor.label;
            const shortcuts =
              typeof descriptor.shortcuts === 'function' ? descriptor.shortcuts(ctx, x) : descriptor.shortcuts;
            return (
              <MenuItem
                key={index}
                label={label}
                shortcuts={shortcuts}
                disabled={disabled}
                testId={descriptor.id ? `${descriptor.id}-item` : undefined}
                onClick={() => {
                  descriptor.onClick(ctx, x);
                  dispatch(setColumnMenu(null));
                }}
              />
            );
          })}
        </ul>
      </div>
      {waitingState && (
        <div
          className="gs-column-menu gs-column-menu-waiting"
          style={{ top: position.y, left: position.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="gs-waiting-message">{waitingState.message}</div>
          <div className="gs-waiting-spinner" />
          <button className="gs-waiting-cancel-btn" onClick={waitingState.cancel}>
            CANCEL
          </button>
        </div>
      )}
    </Fixed>
  );
};
