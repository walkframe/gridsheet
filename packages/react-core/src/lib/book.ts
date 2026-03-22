import { DEFAULT_HISTORY_LIMIT, RESET_ZONE } from '../constants';
import { Pending } from '../sentinels';

import type {
  HistoryType,
  RefPaletteType,
  SheetIdsByName,
  ContextsBySheetId,
  ZoneType,
  CellsByIdType,
  SystemsByIdType,
  System,
  Id,
  StoreDispatchType,
  FeedbackType,
  EditorEvent,
  CursorStateType,
} from '../types';
import type { UserSheet } from './sheet';
import { useEffect, useState } from 'react';
import { updateSheet } from '../store/actions';
import type { FunctionMapping } from '../formula/functions/__base';
import { functions as functionsDefault } from '../formula/mapping';
import { PolicyType } from '../policy/core';

export type RegistryProps = {
  historyLimit?: number;
  additionalFunctions?: FunctionMapping;
  policies?: { [policyName: string]: PolicyType | null };
  onSave?: FeedbackType;
  onChange?: FeedbackType;
  onRemoveRows?: (args: { sheet: UserSheet; ys: number[] }) => void;
  onRemoveCols?: (args: { sheet: UserSheet; xs: number[] }) => void;
  onInsertRows?: (args: { sheet: UserSheet; y: number; numRows: number }) => void;
  onInsertCols?: (args: { sheet: UserSheet; x: number; numCols: number }) => void;
  onSelect?: FeedbackType;
  onKeyUp?: (args: { e: EditorEvent; points: CursorStateType }) => void;
  onInit?: (args: { sheet: UserSheet }) => void;
};

export type BookProps = RegistryProps;

export class Registry {
  sheetHead: number = 0;
  cellHead: number = 0;
  data: CellsByIdType = {};
  systems: SystemsByIdType = {};
  sheetIdsByName: SheetIdsByName = {};
  contextsBySheetId: ContextsBySheetId = {};
  choosingSheetId: number = 0;
  choosingAddress: string = '';
  editingSheetId: number = 0;
  editingAddress: string = '';
  paletteBySheetName: { [sheetName: string]: RefPaletteType } = {};
  lastFocused: HTMLTextAreaElement | null = null;
  solvedCaches: Map<Id, any> = new Map();
  /** IDs of non-origin cells that received spilled values (populated in spill(), cleared in clearSolvedCaches()). */
  lastSpilledTargetIds: Set<Id> = new Set();
  /** Currently in-flight async formula Pending sentinels (keyed by cell ID). */
  asyncPending: Map<string, Pending> = new Map();
  /** In-flight async formulas shared by cache key (for useInflight). */
  asyncInflight?: Map<string, { pending: Pending; expireTime?: number }>;
  copyingSheetId: number = 0;
  copyingZone: ZoneType = RESET_ZONE;
  cutting: boolean = false;
  histories: HistoryType[] = [];
  historyIndex: number = -1;
  historyLimit: number = DEFAULT_HISTORY_LIMIT;
  lastHistory?: HistoryType;
  currentHistory?: HistoryType;
  ready = false;
  functions: FunctionMapping = {};
  policies: { [policyName: string]: PolicyType | null } = {};
  onSave?: FeedbackType;
  onChange?: FeedbackType;
  onRemoveRows?: (args: { sheet: UserSheet; ys: number[] }) => void;
  onRemoveCols?: (args: { sheet: UserSheet; xs: number[] }) => void;
  onInsertRows?: (args: { sheet: UserSheet; y: number; numRows: number }) => void;
  onInsertCols?: (args: { sheet: UserSheet; x: number; numCols: number }) => void;
  onSelect?: FeedbackType;
  onKeyUp?: (args: { e: EditorEvent; points: CursorStateType }) => void;
  onInit?: (args: { sheet: UserSheet }) => void;

  transmit: (newHub?: TransmitProps) => void = (newHub?: TransmitProps) => {
    // This method will be overridden by useBook
  };

  public boot() {
    if (this.ready || Object.keys(this.contextsBySheetId).length === 0) {
      return;
    }
    const keys = Object.keys(this.contextsBySheetId);
    const tobe: StoreDispatchType[] = [];
    for (let i = 0; i < keys.length; i++) {
      const sheetId = keys[i];
      const storeDispatch = this.contextsBySheetId[sheetId];
      const sheet = storeDispatch.store.sheetReactive.current;
      if (!sheet || sheet.status === 0) {
        return;
      }
      tobe.push(storeDispatch);
    }
    for (let i = 0; i < tobe.length; i++) {
      const { store, dispatch } = tobe[i];
      const sheet = store.sheetReactive.current;
      if (!sheet) {
        continue;
      }
      sheet.resolveFormulas();
      dispatch(updateSheet(sheet));
    }
    this.ready = true;
  }

  constructor({
    historyLimit,
    additionalFunctions,
    policies = {},
    onSave,
    onChange,
    onRemoveRows,
    onRemoveCols,
    onInsertRows,
    onInsertCols,
    onSelect,
    onKeyUp,
    onInit,
  }: RegistryProps = {}) {
    if (historyLimit != null) {
      this.historyLimit = historyLimit;
    }
    this.functions = {
      ...functionsDefault,
      ...additionalFunctions,
    };
    for (const fnName in this.functions) {
      const fn = this.functions[fnName];
      fn.__name = fnName;
    }
    this.policies = policies;
    this.onSave = onSave;
    this.onChange = onChange;
    this.onRemoveRows = onRemoveRows;
    this.onRemoveCols = onRemoveCols;
    this.onInsertRows = onInsertRows;
    this.onInsertCols = onInsertCols;
    this.onSelect = onSelect;
    this.onKeyUp = onKeyUp;
    this.onInit = onInit;
  }
}

export type TransmitProps = Partial<Registry>;

export const createRegistry = (props: RegistryProps = {}) => {
  return new Registry(props);
};

/** @deprecated use createRegistry */
export const createBinding = createRegistry;

export type BookType = {
  registry: Registry;
};

export const createBook = (props: RegistryProps = {}): BookType => {
  return { registry: createRegistry(props) };
};

export const useBook = (props: RegistryProps = {}) => {
  const [book, setHub] = useState<BookType>(() => createBook(props));
  const { registry } = book;
  registry.transmit = (patch?: TransmitProps) => {
    Object.assign(registry, patch);
    if (!registry.ready) {
      return;
    }
    requestAnimationFrame(() => setHub({ registry }));
  };
  useEffect(() => {
    Object.assign(registry, props);
  }, [props]);
  return book;
};
