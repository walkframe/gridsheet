import { type FC, useContext, useRef } from 'react';

import { setContextMenuPosition } from '../store/actions';
import { zoneShape } from '../lib/structs';

import { Context } from '../store';
import * as prevention from '../lib/operation';
import { Fixed } from './Fixed';
import {
  colsInserterLeft,
  colsInserterRight,
  colsRemover,
  copier,
  cutter,
  paster,
  redoer,
  rowsInserterAbove,
  rowsInserterBelow,
  rowsRemover,
  undoer,
} from '../store/dispatchers';
import type { ContextMenuProps } from '../types';

export const ContextMenu = () => {
  const { store, dispatch } = useContext(Context);
  const { contextMenuPosition, contextMenuItems } = store;
  const { y: top, x: left } = contextMenuPosition;
  if (top === -1) {
    return null;
  }
  return (
    <Fixed
      className="gs-contextmenu-modal"
      onClick={(e: MouseEvent) => {
        e.preventDefault();
        dispatch(setContextMenuPosition({ y: -1, x: -1 }));
        return false;
      }}
    >
      <div className={'gs-contextmenu'} style={{ top: top, left: left }}>
        <ul>
          {contextMenuItems.map((Item, index) => {
            return <Item key={index} store={store} dispatch={dispatch} />;
          })}
        </ul>
      </div>
    </Fixed>
  );
};

export const DividerItem = (props: ContextMenuProps) => {
  return <li className="gs-menu-divider" />;
};

export const CutItem = (props: ContextMenuProps) => {
  return (
    <li className="gs-enabled" data-testid="cut-item" onClick={async () => await cutter(props)}>
      <div className="gs-menu-name">Cut</div>
      <div className="gs-menu-shortcut">
        <span className="gs-menu-underline">X</span>
      </div>
    </li>
  );
};

export const CopyItem = (props: ContextMenuProps) => {
  return (
    <li className="gs-enabled" data-testid="copy-item" onClick={async () => await copier(props)}>
      <div className="gs-menu-name">Copy</div>
      <div className="gs-menu-shortcut">
        <span className="gs-menu-underline">C</span>
      </div>
    </li>
  );
};

export const PasteItem = (props: ContextMenuProps) => {
  return (
    <li className="gs-enabled" data-testid="paste-item" onClick={async () => await paster(props, false)}>
      <div className="gs-menu-name">Paste</div>
      <div className="gs-menu-shortcut">
        <span className="gs-menu-underline">V</span>
      </div>
    </li>
  );
};

export const PasteOnlyValueItem = (props: ContextMenuProps) => {
  return (
    <li className="gs-enabled" data-testid="paste-only-value-item" onClick={async () => await paster(props, true)}>
      <div className="gs-menu-name">Paste only value</div>
      <div className="gs-menu-shortcut">
        Shift + <span className="gs-menu-underline">V</span>
      </div>
    </li>
  );
};

export const RowsColsOperationDividerItem = (props: ContextMenuProps) => {
  const { leftHeaderSelecting, topHeaderSelecting } = props.store;
  if (leftHeaderSelecting || topHeaderSelecting) {
    return <li className="gs-menu-divider" />;
  }
  return null;
};

export const InsertRowsAboveItem = (props: ContextMenuProps) => {
  const { tableReactive: tableRef, choosing, selectingZone, leftHeaderSelecting } = props.store;
  const table = tableRef.current;

  if (!leftHeaderSelecting || !table) {
    return null;
  }
  const { y } = choosing;
  const { height } = zoneShape({ ...selectingZone, base: 1 });
  const selectingTopCell = table.getCellByPoint({ y, x: 0 }, 'SYSTEM');
  const disabled =
    (table.maxNumRows !== -1 && table.getNumRows() + height > table.maxNumRows) ||
    prevention.hasOperation(selectingTopCell?.prevention, prevention.InsertRowsAbove);
  return (
    <li
      className={disabled ? 'gs-disabled' : 'gs-enabled'}
      data-testid="insert-rows-above-item"
      onClick={async (e) => {
        if (!disabled) {
          await rowsInserterAbove(props);
        }
      }}
    >
      <div className="gs-menu-name">
        Insert {height} row{height > 1 && 's'} above
      </div>
    </li>
  );
};

export const InsertRowsBelowItem = (props: ContextMenuProps) => {
  const { tableReactive: tableRef, choosing, selectingZone, leftHeaderSelecting } = props.store;
  const table = tableRef.current;

  if (!leftHeaderSelecting || !table) {
    return null;
  }
  const { y } = choosing;
  const { height } = zoneShape({ ...selectingZone, base: 1 });
  const selectingBottomCell = table.getCellByPoint({ y, x: 0 }, 'SYSTEM');
  const disabled =
    (table.maxNumRows !== -1 && table.getNumRows() + height > table.maxNumRows) ||
    prevention.hasOperation(selectingBottomCell?.prevention, prevention.InsertRowsBelow);
  return (
    <li
      className={disabled ? 'gs-disabled' : 'gs-enabled'}
      data-testid="insert-rows-below-item"
      onClick={async (e) => {
        if (!disabled) {
          await rowsInserterBelow(props);
        }
      }}
    >
      <div className="gs-menu-name">
        Insert {height} row{height > 1 && 's'} below
      </div>
    </li>
  );
};

export const InsertColsLeftItem = (props: ContextMenuProps) => {
  const { tableReactive: tableRef, choosing, selectingZone, topHeaderSelecting } = props.store;
  const table = tableRef.current;

  if (!topHeaderSelecting || !table) {
    return null;
  }
  const { x } = choosing;
  const { width } = zoneShape({ ...selectingZone, base: 1 });
  const selectingLeftCell = table.getCellByPoint({ y: 0, x }, 'SYSTEM');
  const disabled =
    (table.maxNumCols !== -1 && table.getNumCols() + width > table.maxNumCols) ||
    prevention.hasOperation(selectingLeftCell?.prevention, prevention.InsertColsLeft);
  return (
    <li
      className={disabled ? 'gs-disabled' : 'gs-enabled'}
      data-testid="insert-cols-left-item"
      onClick={async (e) => {
        if (!disabled) {
          await colsInserterLeft(props);
        }
      }}
    >
      <div className="gs-menu-name">
        Insert {width} column{width > 1 && 's'} left
      </div>
    </li>
  );
};

export const InsertColsRightItem = (props: ContextMenuProps) => {
  const { tableReactive: tableRef, choosing, selectingZone, topHeaderSelecting } = props.store;
  const table = tableRef.current;

  if (!topHeaderSelecting || !table) {
    return null;
  }
  const { x } = choosing;
  const { width } = zoneShape({ ...selectingZone, base: 1 });
  const selectingRightCell = table.getCellByPoint({ y: 0, x }, 'SYSTEM');
  const disabled =
    (table.maxNumCols !== -1 && table.getNumCols() + width > table.maxNumCols) ||
    prevention.hasOperation(selectingRightCell?.prevention, prevention.InsertColsRight);
  return (
    <li
      className={disabled ? 'gs-disabled' : 'gs-enabled'}
      data-testid="insert-cols-right-item"
      onClick={async (e) => {
        if (!disabled) {
          await colsInserterRight(props);
        }
      }}
    >
      <div className="gs-menu-name">
        Insert {width} column{width > 1 && 's'} right
      </div>
    </li>
  );
};

export const RemoveRowsItem = (props: ContextMenuProps) => {
  const { tableReactive: tableRef, choosing, selectingZone, leftHeaderSelecting } = props.store;
  const table = tableRef.current;

  if (!leftHeaderSelecting || !table) {
    return null;
  }
  const { y } = choosing;
  const { height } = zoneShape({ ...selectingZone, base: 1 });
  const selectingTopCell = table.getCellByPoint({ y, x: 0 }, 'SYSTEM');
  const disabled =
    (table.minNumRows !== -1 && table.getNumRows() - height < table.minNumRows) ||
    prevention.hasOperation(selectingTopCell?.prevention, prevention.RemoveRows);
  return (
    <li
      className={disabled ? 'gs-disabled' : 'gs-enabled'}
      data-testid="remove-rows-item"
      onClick={async (e) => {
        if (!disabled) {
          await rowsRemover(props);
        }
      }}
    >
      <div className="gs-menu-name">
        Remove {height} row{height > 1 && 's'}
      </div>
    </li>
  );
};

export const RemoveColsItem = (props: ContextMenuProps) => {
  const { tableReactive: tableRef, choosing, selectingZone, topHeaderSelecting } = props.store;
  const table = tableRef.current;

  if (!topHeaderSelecting || !table) {
    return null;
  }
  const { x } = choosing;
  const { width } = zoneShape({ ...selectingZone, base: 1 });
  const selectingRightCell = table.getCellByPoint({ y: 0, x }, 'SYSTEM');
  const disabled =
    (table.minNumCols !== -1 && table.getNumCols() - width < table.minNumCols) ||
    prevention.hasOperation(selectingRightCell?.prevention, prevention.RemoveCols);
  return (
    <li
      className={disabled ? 'gs-disabled' : 'gs-enabled'}
      data-testid="remove-cols-item"
      onClick={async (e) => {
        if (!disabled) {
          await colsRemover(props);
        }
      }}
    >
      <div className="gs-menu-name">
        Remove {width} column{width > 1 && 's'}
      </div>
    </li>
  );
};

export const HistoryDeviderItem = (props: ContextMenuProps) => {
  const { tableReactive: tableRef } = props.store;
  const table = tableRef.current;

  if (!table) {
    return null;
  }

  const historyIndex = table.getHistoryIndex();
  if (historyIndex > -1 || historyIndex < table.getHistorySize() - 1) {
    return <li className="gs-menu-divider" />;
  }
  return null;
};

export const UndoItem = (props: ContextMenuProps) => {
  const { tableReactive: tableRef } = props.store;
  const table = tableRef.current;

  if (!table) {
    return null;
  }

  const historyIndex = table.getHistoryIndex();
  if (historyIndex <= -1) {
    return null;
  }
  return (
    <li className="gs-enabled" data-testid="undo-item" onClick={async () => undoer(props)}>
      <div className="gs-menu-name">Undo</div>
      <div className="gs-menu-shortcut">
        <span className="gs-menu-underline">Z</span>
      </div>
    </li>
  );
};

export const RedoItem = (props: ContextMenuProps) => {
  const { tableReactive: tableRef } = props.store;
  const table = tableRef.current;

  if (!table) {
    return null;
  }

  const historyIndex = table.getHistoryIndex();
  if (historyIndex >= table.getHistorySize() - 1) {
    return null;
  }
  return (
    <li className="gs-enabled" data-testid="redo-item" onClick={async () => redoer(props)}>
      <div className="gs-menu-name">Redo</div>
      <div className="gs-menu-shortcut">
        <span className="gs-menu-underline">R</span>
      </div>
    </li>
  );
};

export const defaultContextMenuItems: FC<ContextMenuProps>[] = [
  CutItem,
  CopyItem,
  PasteItem,
  PasteOnlyValueItem,

  RowsColsOperationDividerItem,

  InsertRowsAboveItem,
  InsertRowsBelowItem,
  InsertColsLeftItem,
  InsertColsRightItem,
  RemoveRowsItem,
  RemoveColsItem,

  HistoryDeviderItem,

  UndoItem,
  RedoItem,
];
