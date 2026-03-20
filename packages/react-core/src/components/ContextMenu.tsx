import { type FC, useContext, useRef } from 'react';

import { setContextMenuPosition } from '../store/actions';
import { zoneShape } from '../lib/spatial';

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
  searcher,
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
      className="gs-menu-modal gs-context-menu-modal"
      onClick={(e: MouseEvent) => {
        e.preventDefault();
        dispatch(setContextMenuPosition({ y: -1, x: -1 }));
        return false;
      }}
    >
      <div className={'gs-context-menu'} style={{ top: top, left: left }}>
        <ul className="gs-menu-items">
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
    <li className="gs-menu-item gs-enabled" data-testid="cut-item" onClick={async () => await cutter(props)}>
      <div className="gs-menu-name">Cut</div>
      <div className="gs-menu-shortcut">
        <span className="gs-menu-underline">X</span>
      </div>
    </li>
  );
};

export const SearchItem = (props: ContextMenuProps) => {
  return (
    <li className="gs-menu-item gs-enabled" data-testid="search-item" onClick={async () => await searcher(props)}>
      <div className="gs-menu-name">Search</div>
      <div className="gs-menu-shortcut">
        <span className="gs-menu-underline">F</span>
      </div>
    </li>
  );
};

export const CopyItem = (props: ContextMenuProps) => {
  return (
    <li className="gs-menu-item gs-enabled" data-testid="copy-item" onClick={async () => await copier(props)}>
      <div className="gs-menu-name">Copy</div>
      <div className="gs-menu-shortcut">
        <span className="gs-menu-underline">C</span>
      </div>
    </li>
  );
};

export const PasteItem = (props: ContextMenuProps) => {
  return (
    <li className="gs-menu-item gs-enabled" data-testid="paste-item" onClick={async () => await paster(props, false)}>
      <div className="gs-menu-name">Paste</div>
      <div className="gs-menu-shortcut">
        <span className="gs-menu-underline">V</span>
      </div>
    </li>
  );
};

export const PasteOnlyValueItem = (props: ContextMenuProps) => {
  return (
    <li
      className="gs-menu-item gs-enabled"
      data-testid="paste-only-value-item"
      onClick={async () => await paster(props, true)}
    >
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
  const { sheetReactive: sheetRef, choosing, selectingZone, leftHeaderSelecting } = props.store;
  const sheet = sheetRef.current;

  if (!leftHeaderSelecting || !sheet) {
    return null;
  }
  const { y } = choosing;
  const { rows } = zoneShape({ ...selectingZone, base: 1 });
  const selectingTopCell = sheet.getCellByPoint({ y, x: 0 }, 'SYSTEM');
  const disabled =
    (sheet.maxNumRows !== -1 && sheet.getNumRows() + rows > sheet.maxNumRows) ||
    prevention.hasOperation(selectingTopCell?.prevention, prevention.InsertRowsAbove);
  return (
    <li
      className={`gs-menu-item ${disabled ? 'gs-disabled' : 'gs-enabled'}`}
      data-testid="insert-rows-above-item"
      onClick={async (e) => {
        if (!disabled) {
          await rowsInserterAbove(props);
        }
      }}
    >
      <div className="gs-menu-name">
        Insert {rows} row{rows > 1 && 's'} above
      </div>
    </li>
  );
};

export const InsertRowsBelowItem = (props: ContextMenuProps) => {
  const { sheetReactive: sheetRef, choosing, selectingZone, leftHeaderSelecting } = props.store;
  const sheet = sheetRef.current;

  if (!leftHeaderSelecting || !sheet) {
    return null;
  }
  const { y } = choosing;
  const { rows } = zoneShape({ ...selectingZone, base: 1 });
  const selectingBottomCell = sheet.getCellByPoint({ y, x: 0 }, 'SYSTEM');
  const disabled =
    (sheet.maxNumRows !== -1 && sheet.getNumRows() + rows > sheet.maxNumRows) ||
    prevention.hasOperation(selectingBottomCell?.prevention, prevention.InsertRowsBelow);
  return (
    <li
      className={`gs-menu-item ${disabled ? 'gs-disabled' : 'gs-enabled'}`}
      data-testid="insert-rows-below-item"
      onClick={async (e) => {
        if (!disabled) {
          await rowsInserterBelow(props);
        }
      }}
    >
      <div className="gs-menu-name">
        Insert {rows} row{rows > 1 && 's'} below
      </div>
    </li>
  );
};

export const InsertColsLeftItem = (props: ContextMenuProps) => {
  const { sheetReactive: sheetRef, choosing, selectingZone, topHeaderSelecting } = props.store;
  const sheet = sheetRef.current;

  if (!topHeaderSelecting || !sheet) {
    return null;
  }
  const { x } = choosing;
  const { cols } = zoneShape({ ...selectingZone, base: 1 });
  const selectingLeftCell = sheet.getCellByPoint({ y: 0, x }, 'SYSTEM');
  const disabled =
    (sheet.maxNumCols !== -1 && sheet.getNumCols() + cols > sheet.maxNumCols) ||
    prevention.hasOperation(selectingLeftCell?.prevention, prevention.InsertColsLeft);
  return (
    <li
      className={`gs-menu-item ${disabled ? 'gs-disabled' : 'gs-enabled'}`}
      data-testid="insert-cols-left-item"
      onClick={async (e) => {
        if (!disabled) {
          await colsInserterLeft(props);
        }
      }}
    >
      <div className="gs-menu-name">
        Insert {cols} column{cols > 1 && 's'} left
      </div>
    </li>
  );
};

export const InsertColsRightItem = (props: ContextMenuProps) => {
  const { sheetReactive: sheetRef, choosing, selectingZone, topHeaderSelecting } = props.store;
  const sheet = sheetRef.current;

  if (!topHeaderSelecting || !sheet) {
    return null;
  }
  const { x } = choosing;
  const { cols } = zoneShape({ ...selectingZone, base: 1 });
  const selectingRightCell = sheet.getCellByPoint({ y: 0, x }, 'SYSTEM');
  const disabled =
    (sheet.maxNumCols !== -1 && sheet.getNumCols() + cols > sheet.maxNumCols) ||
    prevention.hasOperation(selectingRightCell?.prevention, prevention.InsertColsRight);
  return (
    <li
      className={`gs-menu-item ${disabled ? 'gs-disabled' : 'gs-enabled'}`}
      data-testid="insert-cols-right-item"
      onClick={async (e) => {
        if (!disabled) {
          await colsInserterRight(props);
        }
      }}
    >
      <div className="gs-menu-name">
        Insert {cols} column{cols > 1 && 's'} right
      </div>
    </li>
  );
};

export const RemoveRowsItem = (props: ContextMenuProps) => {
  const { sheetReactive: sheetRef, choosing, selectingZone, leftHeaderSelecting } = props.store;
  const sheet = sheetRef.current;

  if (!leftHeaderSelecting || !sheet) {
    return null;
  }
  const { y } = choosing;
  const { rows } = zoneShape({ ...selectingZone, base: 1 });
  const selectingTopCell = sheet.getCellByPoint({ y, x: 0 }, 'SYSTEM');
  const disabled =
    (sheet.minNumRows !== -1 && sheet.getNumRows() - rows < sheet.minNumRows) ||
    prevention.hasOperation(selectingTopCell?.prevention, prevention.RemoveRows);
  return (
    <li
      className={`gs-menu-item ${disabled ? 'gs-disabled' : 'gs-enabled'}`}
      data-testid="remove-rows-item"
      onClick={async (e) => {
        if (!disabled) {
          await rowsRemover(props);
        }
      }}
    >
      <div className="gs-menu-name">
        Remove {rows} row{rows > 1 && 's'}
      </div>
    </li>
  );
};

export const RemoveColsItem = (props: ContextMenuProps) => {
  const { sheetReactive: sheetRef, choosing, selectingZone, topHeaderSelecting } = props.store;
  const sheet = sheetRef.current;

  if (!topHeaderSelecting || !sheet) {
    return null;
  }
  const { x } = choosing;
  const { cols } = zoneShape({ ...selectingZone, base: 1 });
  const selectingRightCell = sheet.getCellByPoint({ y: 0, x }, 'SYSTEM');
  const disabled =
    (sheet.minNumCols !== -1 && sheet.getNumCols() - cols < sheet.minNumCols) ||
    prevention.hasOperation(selectingRightCell?.prevention, prevention.RemoveCols);
  return (
    <li
      className={`gs-menu-item ${disabled ? 'gs-disabled' : 'gs-enabled'}`}
      data-testid="remove-cols-item"
      onClick={async (e) => {
        if (!disabled) {
          await colsRemover(props);
        }
      }}
    >
      <div className="gs-menu-name">
        Remove {cols} column{cols > 1 && 's'}
      </div>
    </li>
  );
};

export const HistoryDeviderItem = (props: ContextMenuProps) => {
  const { sheetReactive: sheetRef } = props.store;
  const sheet = sheetRef.current;

  if (!sheet) {
    return null;
  }

  const historyIndex = sheet.getHistoryIndex();
  if (historyIndex > -1 || historyIndex < sheet.getHistorySize() - 1) {
    return <li className="gs-menu-divider" />;
  }
  return null;
};

export const UndoItem = (props: ContextMenuProps) => {
  const { sheetReactive: sheetRef } = props.store;
  const sheet = sheetRef.current;

  if (!sheet) {
    return null;
  }

  const historyIndex = sheet.getHistoryIndex();
  if (historyIndex <= -1) {
    return null;
  }
  return (
    <li className="gs-menu-item gs-enabled" data-testid="undo-item" onClick={async () => undoer(props)}>
      <div className="gs-menu-name">Undo</div>
      <div className="gs-menu-shortcut">
        <span className="gs-menu-underline">Z</span>
      </div>
    </li>
  );
};

export const RedoItem = (props: ContextMenuProps) => {
  const { sheetReactive: sheetRef } = props.store;
  const sheet = sheetRef.current;

  if (!sheet) {
    return null;
  }

  const historyIndex = sheet.getHistoryIndex();
  if (historyIndex >= sheet.getHistorySize() - 1) {
    return null;
  }
  return (
    <li className="gs-menu-item gs-enabled" data-testid="redo-item" onClick={async () => redoer(props)}>
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

  DividerItem,
  SearchItem,
];
