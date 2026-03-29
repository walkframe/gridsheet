/**
 * Menu system — types, default descriptors, and MenuContext builder.
 */

// ---- types ----------------------------------------------------------------

import type { PointType, ZoneType, FilterConfig } from '../types';
import type { UserSheet } from '@gridsheet/core';
import type { StoreType } from '../types';
import type { Dispatcher } from '../store';
import { operations as prevention } from '@gridsheet/core';
import { zoneShape } from '@gridsheet/core';
import { p2a } from '@gridsheet/core';
import {
  copier,
  cutter,
  paster,
  undoer,
  redoer,
  rowsSorterAsc,
  rowsSorterDesc,
  rowsFilterer,
  rowsFilterClearer,
  rowSortFixedToggler,
  rowFilterFixedToggler,
  searcher,
} from '../store/applyers';
import {
  insertRowsAbove as _insertRowsAbove,
  insertRowsBelow as _insertRowsBelow,
  removeRows as _removeRows,
  insertColsLeft as _insertColsLeft,
  insertColsRight as _insertColsRight,
  removeCols as _removeCols,
  setStore as _setStore,
} from '../store/actions';

export type MenuContext = {
  /** Current sheet instance */
  sheet: UserSheet;
  /** Currently focused cell */
  choosing: PointType;
  /** Currently selected zone */
  selectingZone: ZoneType;
  /** True when the left (row) header is being selected */
  leftHeaderSelecting: boolean;
  /** True when the top (column) header is being selected */
  topHeaderSelecting: boolean;

  // ---- actions ----
  cut(): Promise<void>;
  copy(): Promise<void>;
  paste(onlyValue?: boolean): Promise<void>;
  undo(): void;
  redo(): void;
  insertRowsAbove(y: number, numRows: number): void;
  insertRowsBelow(y: number, numRows: number): void;
  removeRows(y: number, numRows: number): void;
  insertColsLeft(x: number, numCols: number): void;
  insertColsRight(x: number, numCols: number): void;
  removeCols(x: number, numCols: number): void;
  sortRows(x: number, direction: 'asc' | 'desc'): Promise<void>;
  filterRows(x: number, filter?: FilterConfig): Promise<void>;
  clearFilter(x?: number): void;
  toggleSortFixed(y: number): void;
  toggleFilterFixed(y: number): void;
  search(): void;
  updateColLabel(x: number, label: string | undefined): void;
  /** Close the currently open menu */
  close(): void;
};

export type MenuDividerItem = { type: 'divider'; visible?: (ctx: MenuContext) => boolean };

/**
 * Base structure shared by all menu item descriptors.
 * `Args` is the tuple of coordinate arguments passed after `ctx`:
 *   - `[]`        → ContextMenu (no coordinate)
 *   - `[y: number]` → RowMenu
 *   - `[x: number]` → ColMenu
 */
export type MenuItemBase<Args extends unknown[] = []> = {
  type?: 'item';
  id?: string;
  label: string | ((ctx: MenuContext, ...args: Args) => string);
  shortcuts?: string[] | ((ctx: MenuContext, ...args: Args) => string[]);
  visible?: (ctx: MenuContext, ...args: Args) => boolean;
  disabled?: (ctx: MenuContext, ...args: Args) => boolean;
  /** Render a checkmark prefix when defined. */
  checked?: (ctx: MenuContext, ...args: Args) => boolean;
  onClick: (ctx: MenuContext, ...args: Args) => void | Promise<void>;
};

/**
 * A menu entry that renders a registered React component.
 * Use `registerMenuComponent(id, Component)` to associate an id with a component,
 * then reference it here as `{ type: 'component', componentId: id }`.
 */
export type MenuComponentItem<Args extends unknown[] = []> = {
  type: 'component';
  componentId: string;
  visible?: (ctx: MenuContext, ...args: Args) => boolean;
};

export type ContextMenuItemDescriptor = MenuDividerItem | MenuItemBase | MenuComponentItem;
export type RowMenuItemDescriptor = MenuDividerItem | MenuItemBase<[y: number]> | MenuComponentItem<[y: number]>;
export type ColMenuItemDescriptor = MenuDividerItem | MenuItemBase<[x: number]> | MenuComponentItem<[x: number]>;

// ---- helpers ---------------------------------------------------------------

const rowInsertCount = (ctx: MenuContext, y: number): number => {
  const { selectingZone } = ctx;
  const selStart = Math.min(selectingZone.startY, selectingZone.endY);
  const selEnd = Math.max(selectingZone.startY, selectingZone.endY);
  const isFullRow = selectingZone.startX === 1 && selectingZone.endX === ctx.sheet.numCols;
  return isFullRow && y >= selStart && y <= selEnd ? selEnd - selStart + 1 : 1;
};

const colInsertCount = (ctx: MenuContext, x: number): number => {
  const { selectingZone } = ctx;
  const selStart = Math.min(selectingZone.startX, selectingZone.endX);
  const selEnd = Math.max(selectingZone.startX, selectingZone.endX);
  const isFullCol = selectingZone.startY === 1 && selectingZone.endY === ctx.sheet.numRows;
  return isFullCol && x >= selStart && x <= selEnd ? selEnd - selStart + 1 : 1;
};

// ---- default descriptors ---------------------------------------------------

export const defaultContextMenuDescriptors: ContextMenuItemDescriptor[] = [
  {
    id: 'cut',
    label: 'Cut',
    shortcuts: ['X'],
    onClick: (ctx) => ctx.cut(),
  },
  {
    id: 'copy',
    label: 'Copy',
    shortcuts: ['C'],
    onClick: (ctx) => ctx.copy(),
  },
  {
    id: 'paste',
    label: 'Paste',
    shortcuts: ['V'],
    onClick: (ctx) => ctx.paste(false),
  },
  {
    id: 'paste-only-value',
    label: 'Paste only value',
    shortcuts: ['Shift+V'],
    onClick: (ctx) => ctx.paste(true),
  },
  { type: 'divider', visible: (ctx) => ctx.leftHeaderSelecting || ctx.topHeaderSelecting },
  {
    id: 'insert-rows-above',
    label: (ctx) => {
      const n = zoneShape(ctx.selectingZone).rows;
      return `Insert ${n} row${n > 1 ? 's' : ''} above`;
    },
    visible: (ctx) => ctx.leftHeaderSelecting,
    disabled: (ctx) => {
      const n = zoneShape(ctx.selectingZone).rows;
      const sheet = ctx.sheet;
      const rowCell = sheet.getCell({ y: ctx.choosing.y, x: 0 }, { resolution: 'SYSTEM' });
      return (
        (sheet.maxNumRows !== -1 && sheet.numRows + n > sheet.maxNumRows) ||
        prevention.hasOperation(rowCell?.prevention, prevention.InsertRowsAbove)
      );
    },
    onClick: (ctx) => ctx.insertRowsAbove(ctx.choosing.y, zoneShape(ctx.selectingZone).rows),
  },
  {
    id: 'insert-rows-below',
    label: (ctx) => {
      const n = zoneShape(ctx.selectingZone).rows;
      return `Insert ${n} row${n > 1 ? 's' : ''} below`;
    },
    visible: (ctx) => ctx.leftHeaderSelecting,
    disabled: (ctx) => {
      const n = zoneShape(ctx.selectingZone).rows;
      const sheet = ctx.sheet;
      const rowCell = sheet.getCell({ y: ctx.choosing.y, x: 0 }, { resolution: 'SYSTEM' });
      return (
        (sheet.maxNumRows !== -1 && sheet.numRows + n > sheet.maxNumRows) ||
        prevention.hasOperation(rowCell?.prevention, prevention.InsertRowsBelow)
      );
    },
    onClick: (ctx) => ctx.insertRowsBelow(ctx.choosing.y, zoneShape(ctx.selectingZone).rows),
  },
  {
    id: 'insert-cols-left',
    label: (ctx) => {
      const n = zoneShape(ctx.selectingZone).cols;
      return `Insert ${n} column${n > 1 ? 's' : ''} left`;
    },
    visible: (ctx) => ctx.topHeaderSelecting,
    disabled: (ctx) => {
      const n = zoneShape(ctx.selectingZone).cols;
      const sheet = ctx.sheet;
      const colCell = sheet.getCell({ y: 0, x: ctx.choosing.x }, { resolution: 'SYSTEM' });
      return (
        (sheet.maxNumCols !== -1 && sheet.numCols + n > sheet.maxNumCols) ||
        prevention.hasOperation(colCell?.prevention, prevention.InsertColsLeft)
      );
    },
    onClick: (ctx) => ctx.insertColsLeft(ctx.choosing.x, zoneShape(ctx.selectingZone).cols),
  },
  {
    id: 'insert-cols-right',
    label: (ctx) => {
      const n = zoneShape(ctx.selectingZone).cols;
      return `Insert ${n} column${n > 1 ? 's' : ''} right`;
    },
    visible: (ctx) => ctx.topHeaderSelecting,
    disabled: (ctx) => {
      const n = zoneShape(ctx.selectingZone).cols;
      const sheet = ctx.sheet;
      const colCell = sheet.getCell({ y: 0, x: ctx.choosing.x }, { resolution: 'SYSTEM' });
      return (
        (sheet.maxNumCols !== -1 && sheet.numCols + n > sheet.maxNumCols) ||
        prevention.hasOperation(colCell?.prevention, prevention.InsertColsRight)
      );
    },
    onClick: (ctx) => ctx.insertColsRight(ctx.choosing.x, zoneShape(ctx.selectingZone).cols),
  },
  {
    id: 'remove-rows',
    label: (ctx) => {
      const n = zoneShape(ctx.selectingZone).rows;
      return `Remove ${n} row${n > 1 ? 's' : ''}`;
    },
    visible: (ctx) => ctx.leftHeaderSelecting,
    disabled: (ctx) => {
      const n = zoneShape(ctx.selectingZone).rows;
      const sheet = ctx.sheet;
      const rowCell = sheet.getCell({ y: ctx.choosing.y, x: 0 }, { resolution: 'SYSTEM' });
      return (
        (sheet.minNumRows !== -1 && sheet.numRows - n < sheet.minNumRows) ||
        prevention.hasOperation(rowCell?.prevention, prevention.RemoveRows)
      );
    },
    onClick: (ctx) => ctx.removeRows(ctx.choosing.y, zoneShape(ctx.selectingZone).rows),
  },
  {
    id: 'remove-cols',
    label: (ctx) => {
      const n = zoneShape(ctx.selectingZone).cols;
      return `Remove ${n} column${n > 1 ? 's' : ''}`;
    },
    visible: (ctx) => ctx.topHeaderSelecting,
    disabled: (ctx) => {
      const n = zoneShape(ctx.selectingZone).cols;
      const sheet = ctx.sheet;
      const colCell = sheet.getCell({ y: 0, x: ctx.choosing.x }, { resolution: 'SYSTEM' });
      return (
        (sheet.minNumCols !== -1 && sheet.numCols - n < sheet.minNumCols) ||
        prevention.hasOperation(colCell?.prevention, prevention.RemoveCols)
      );
    },
    onClick: (ctx) => ctx.removeCols(ctx.choosing.x, zoneShape(ctx.selectingZone).cols),
  },
  { type: 'divider' },
  {
    id: 'undo',
    label: 'Undo',
    shortcuts: ['Z'],
    disabled: (ctx) => ctx.sheet.historyIndex() <= -1,
    onClick: (ctx) => ctx.undo(),
  },
  {
    id: 'redo',
    label: 'Redo',
    shortcuts: ['R', 'Y', 'Shift+Z'],
    disabled: (ctx) => ctx.sheet.historyIndex() >= ctx.sheet.historySize() - 1,
    onClick: (ctx) => ctx.redo(),
  },
  { type: 'divider' },
  {
    id: 'search',
    label: 'Search',
    shortcuts: ['F'],
    onClick: (ctx) => ctx.search(),
  },
];

export const defaultRowMenuDescriptors: RowMenuItemDescriptor[] = [
  {
    id: 'cut',
    label: 'Cut',
    shortcuts: ['X'],
    onClick: (ctx) => ctx.cut(),
  },
  {
    id: 'copy',
    label: 'Copy',
    shortcuts: ['C'],
    onClick: (ctx) => ctx.copy(),
  },
  {
    id: 'paste',
    label: 'Paste',
    shortcuts: ['V'],
    onClick: (ctx) => ctx.paste(false),
  },
  {
    id: 'paste-only-value',
    label: 'Paste only value',
    shortcuts: ['Shift+V'],
    onClick: (ctx) => ctx.paste(true),
  },
  { type: 'divider' },
  {
    id: 'insert-rows-above',
    label: (ctx, y) => {
      const n = rowInsertCount(ctx, y);
      return `Insert ${n} row${n > 1 ? 's' : ''} above`;
    },
    disabled: (ctx, y) => {
      const n = rowInsertCount(ctx, y);
      const sheet = ctx.sheet;
      const rowCell = sheet.getCell({ y, x: 0 }, { resolution: 'SYSTEM' });
      return (
        (sheet.maxNumRows !== -1 && sheet.numRows + n > sheet.maxNumRows) ||
        prevention.hasOperation(rowCell?.prevention, prevention.InsertRowsAbove)
      );
    },
    onClick: (ctx, y) => ctx.insertRowsAbove(y, rowInsertCount(ctx, y)),
  },
  {
    id: 'insert-rows-below',
    label: (ctx, y) => {
      const n = rowInsertCount(ctx, y);
      return `Insert ${n} row${n > 1 ? 's' : ''} below`;
    },
    disabled: (ctx, y) => {
      const n = rowInsertCount(ctx, y);
      const sheet = ctx.sheet;
      const rowCell = sheet.getCell({ y, x: 0 }, { resolution: 'SYSTEM' });
      return (
        (sheet.maxNumRows !== -1 && sheet.numRows + n > sheet.maxNumRows) ||
        prevention.hasOperation(rowCell?.prevention, prevention.InsertRowsBelow)
      );
    },
    onClick: (ctx, y) => ctx.insertRowsBelow(y, rowInsertCount(ctx, y)),
  },
  {
    id: 'remove-rows',
    label: (ctx, y) => {
      const n = rowInsertCount(ctx, y);
      return `Remove ${n} row${n > 1 ? 's' : ''}`;
    },
    disabled: (ctx, y) => {
      const n = rowInsertCount(ctx, y);
      const sheet = ctx.sheet;
      const rowCell = sheet.getCell({ y, x: 0 }, { resolution: 'SYSTEM' });
      return (
        (sheet.minNumRows !== -1 && sheet.numRows - n < sheet.minNumRows) ||
        prevention.hasOperation(rowCell?.prevention, prevention.RemoveRows)
      );
    },
    onClick: (ctx, y) => ctx.removeRows(y, rowInsertCount(ctx, y)),
  },
  { type: 'divider' },
  {
    id: 'toggle-sort-fixed',
    label: 'Fix row for sorting',
    checked: (ctx, y) => !!ctx.sheet.getCell({ y, x: 0 }, { resolution: 'SYSTEM' })?.sortFixed,
    onClick: (ctx, y) => ctx.toggleSortFixed(y),
  },
  {
    id: 'toggle-filter-fixed',
    label: 'Fix row for filtering',
    checked: (ctx, y) => !!ctx.sheet.getCell({ y, x: 0 }, { resolution: 'SYSTEM' })?.filterFixed,
    onClick: (ctx, y) => ctx.toggleFilterFixed(y),
  },
  { type: 'divider' },
  {
    id: 'search',
    label: 'Search',
    shortcuts: ['F'],
    onClick: (ctx) => ctx.search(),
  },
];

// The col menu composes registered section components (filter, sort, label) and
// simple menu items. Use `registerMenuComponent` to override built-in sections.
export const defaultColMenuDescriptors: ColMenuItemDescriptor[] = [
  { type: 'component', componentId: 'col-filter' },
  { type: 'divider' },
  { type: 'component', componentId: 'col-sort' },
  { type: 'divider' },
  {
    id: 'cut',
    label: 'Cut',
    shortcuts: ['X'],
    onClick: (ctx) => ctx.cut(),
  },
  {
    id: 'copy',
    label: 'Copy',
    shortcuts: ['C'],
    onClick: (ctx) => ctx.copy(),
  },
  {
    id: 'paste',
    label: 'Paste',
    shortcuts: ['V'],
    onClick: (ctx) => ctx.paste(false),
  },
  {
    id: 'paste-only-value',
    label: 'Paste only value',
    shortcuts: ['Shift+V'],
    onClick: (ctx) => ctx.paste(true),
  },
  { type: 'divider' },
  {
    id: 'insert-cols-left',
    label: (ctx, x) => {
      const n = colInsertCount(ctx, x);
      return `Insert ${n} column${n > 1 ? 's' : ''} left`;
    },
    disabled: (ctx, x) => {
      const n = colInsertCount(ctx, x);
      const sheet = ctx.sheet;
      const colCell = sheet.getCell({ y: 0, x }, { resolution: 'SYSTEM' });
      return (
        (sheet.maxNumCols !== -1 && sheet.numCols + n > sheet.maxNumCols) ||
        prevention.hasOperation(colCell?.prevention, prevention.InsertColsLeft)
      );
    },
    onClick: (ctx, x) => ctx.insertColsLeft(x, colInsertCount(ctx, x)),
  },
  {
    id: 'insert-cols-right',
    label: (ctx, x) => {
      const n = colInsertCount(ctx, x);
      return `Insert ${n} column${n > 1 ? 's' : ''} right`;
    },
    disabled: (ctx, x) => {
      const n = colInsertCount(ctx, x);
      const sheet = ctx.sheet;
      const colCell = sheet.getCell({ y: 0, x }, { resolution: 'SYSTEM' });
      return (
        (sheet.maxNumCols !== -1 && sheet.numCols + n > sheet.maxNumCols) ||
        prevention.hasOperation(colCell?.prevention, prevention.InsertColsRight)
      );
    },
    onClick: (ctx, x) => ctx.insertColsRight(x, colInsertCount(ctx, x)),
  },
  {
    id: 'remove-cols',
    label: (ctx, x) => {
      const n = colInsertCount(ctx, x);
      return `Remove ${n} column${n > 1 ? 's' : ''}`;
    },
    disabled: (ctx, x) => {
      const n = colInsertCount(ctx, x);
      const sheet = ctx.sheet;
      const colCell = sheet.getCell({ y: 0, x }, { resolution: 'SYSTEM' });
      return (
        (sheet.minNumCols !== -1 && sheet.numCols - n < sheet.minNumCols) ||
        prevention.hasOperation(colCell?.prevention, prevention.RemoveCols)
      );
    },
    onClick: (ctx, x) => ctx.removeCols(x, colInsertCount(ctx, x)),
  },
  { type: 'divider' },
  {
    id: 'search',
    label: 'Search',
    shortcuts: ['F'],
    onClick: (ctx) => ctx.search(),
  },
  { type: 'divider' },
  { type: 'component', componentId: 'col-label' },
];

// ---- buildMenuContext -------------------------------------------------------

export function buildMenuContext(store: StoreType, dispatch: Dispatcher, close: () => void): MenuContext {
  const props = { store, dispatch };
  const sheet = store.sheetReactive.current!;

  return {
    sheet,
    choosing: store.choosing,
    selectingZone: store.selectingZone,
    leftHeaderSelecting: store.leftHeaderSelecting,
    topHeaderSelecting: store.topHeaderSelecting,

    cut: () => cutter(props),
    copy: () => copier(props),
    paste: (onlyValue = false) => paster(props, onlyValue),
    undo: () => undoer(props),
    redo: () => redoer(props),

    insertRowsAbove: (y, numRows) => {
      dispatch(_insertRowsAbove({ numRows, y, operator: 'USER' }));
    },
    insertRowsBelow: (y, numRows) => {
      dispatch(_insertRowsBelow({ numRows, y, operator: 'USER' }));
    },
    removeRows: (y, numRows) => {
      dispatch(_removeRows({ numRows, y, operator: 'USER' }));
    },
    insertColsLeft: (x, numCols) => {
      dispatch(_insertColsLeft({ numCols, x, operator: 'USER' }));
    },
    insertColsRight: (x, numCols) => {
      dispatch(_insertColsRight({ numCols, x, operator: 'USER' }));
    },
    removeCols: (x, numCols) => {
      dispatch(_removeCols({ numCols, x, operator: 'USER' }));
    },

    sortRows: async (x, direction) => {
      if (direction === 'asc') {
        await rowsSorterAsc(props, x);
      } else {
        await rowsSorterDesc(props, x);
      }
    },
    filterRows: async (x, filter) => {
      if (filter) {
        await rowsFilterer(props, x, filter);
      } else {
        rowsFilterClearer(props, x);
      }
    },
    clearFilter: (x) => rowsFilterClearer(props, x),

    toggleSortFixed: (y) => rowSortFixedToggler(props, y),
    toggleFilterFixed: (y) => rowFilterFixedToggler(props, y),

    search: () => searcher(props),

    updateColLabel: (x, label) => {
      if (!sheet) {
        return;
      }
      const addr = p2a({ y: 0, x });
      sheet.update({
        diff: { [addr]: { label: label || undefined } },
        partial: true,
        undoReflection: {
          sheetId: sheet.id,
          selectingZone: store.selectingZone,
          choosing: store.choosing,
        },
        redoReflection: {
          sheetId: sheet.id,
          selectingZone: store.selectingZone,
          choosing: store.choosing,
        },
      });
      dispatch(_setStore({ sheetReactive: { current: sheet } }));
    },

    close,
  };
}

// ---- menu component registry -----------------------------------------------

import type { FC } from 'react';

export type ContextMenuSectionProps = {
  close: () => void;
};

export type RowMenuSectionProps = {
  y: number;
  close: () => void;
};

export type ColMenuSectionProps = {
  x: number;
  close: () => void;
  /** Signal waiting state to parent menu. Pass null to clear. */
  onWaiting?: (message: string | null, cancel?: () => void) => void;
};

const _menuComponentRegistry = new Map<string, FC<any>>();

/**
 * Register a React component under a string id so it can be referenced in menu
 * descriptors via `{ type: 'component', componentId: '...' }`.
 *
 * Built-in ids: `'col-filter'`, `'col-sort'`, `'col-label'`.
 * You can override any built-in by registering your own component with the same id.
 */

export function registerMenuComponent(id: string, component: FC<any>): void {
  _menuComponentRegistry.set(id, component);
}

/** Look up a previously registered component by id. */

export function getMenuComponent(id: string): FC<any> | undefined {
  return _menuComponentRegistry.get(id);
}
