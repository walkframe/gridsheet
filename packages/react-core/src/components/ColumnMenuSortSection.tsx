import { type FC, useContext, useState, useCallback, useEffect } from 'react';
import { Context } from '../store';
import { sortRows } from '../store/actions';
import * as prevention from '../lib/operation';
import { registerMenuComponent, type ColMenuSectionProps } from '../lib/menu';

type PendingSort = {
  x: number;
  direction: 'asc' | 'desc';
};

const SortSection: FC<ColMenuSectionProps> = ({ x, close, onWaiting }) => {
  const { store, dispatch } = useContext(Context);
  const { sheetReactive: sheetRef } = store;
  const sheet = sheetRef.current;

  const [pending, setPending] = useState<PendingSort | null>(null);

  const handleCancel = useCallback(() => {
    setPending(null);
    onWaiting?.(null);
    close();
  }, [close, onWaiting]);

  // Notify parent about waiting state
  useEffect(() => {
    if (pending) {
      onWaiting?.('Sorting\u2026', handleCancel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  // Execute pending sort after async formulas resolve
  useEffect(() => {
    if (!pending) {
      return;
    }
    let cancelled = false;
    const execute = () => {
      if (cancelled) {
        return;
      }
      const currentSheet = sheetRef.current;
      if (!currentSheet) {
        return;
      }
      dispatch(sortRows({ x: pending.x, direction: pending.direction }));
      onWaiting?.(null);
      setPending(null);
      close();
    };
    const currentSheet = sheetRef.current;
    if (currentSheet && (currentSheet.hasPendingCells() || currentSheet.registry.asyncPending.size > 0)) {
      currentSheet.waitForPending().then(execute);
    } else {
      execute();
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  if (!sheet) {
    return null;
  }

  const colCell = sheet.getCell({ y: 0, x }, { resolution: 'SYSTEM' });
  const sortDisabled = prevention.hasOperation(colCell?.prevention, prevention.Sort);

  return (
    <li className={`gs-menu-item gs-column-menu-sort${sortDisabled ? ' gs-disabled' : ''}`}>
      <div className="gs-menu-name">Sort:</div>
      <div className="gs-sort-buttons">
        <button
          className="gs-sort-btn gs-sort-btn-asc"
          onClick={(e) => {
            e.stopPropagation();
            if (!sortDisabled) {
              setPending({ x, direction: 'asc' });
            }
          }}
          disabled={sortDisabled}
        >
          ↓ A to Z
        </button>
        <button
          className="gs-sort-btn gs-sort-btn-desc"
          onClick={(e) => {
            e.stopPropagation();
            if (!sortDisabled) {
              setPending({ x, direction: 'desc' });
            }
          }}
          disabled={sortDisabled}
        >
          ↑ Z to A
        </button>
      </div>
    </li>
  );
};

registerMenuComponent('col-sort', SortSection);
export { SortSection };
