import { identifyFormula } from '../formula/evaluator';
import { DEFAULT_HISTORY_LIMIT, RESET_ZONE } from '../constants';
import type {
  HistoryType,
  RefPaletteType,
  SheetIdsByName,
  ContextsBySheetId,
  ZoneType,
  HubPatchType,
  CellsByIdType,
  Id,
  StoreDispatchType,
} from '../types';
import { useState } from 'react';
import { updateTable } from '../store/actions';

export type HubProps = {
  historyLimit?: number;
};

export class Hub {
  sheetHead: number = 0;
  cellHead: number = 0;
  data: CellsByIdType = {};
  sheetIdsByName: SheetIdsByName = {};
  contextsBySheetId: ContextsBySheetId = {};
  choosingSheetId: number = 0;
  choosingAddress: string = '';
  editingSheetId: number = 0;
  editingAddress: string = '';
  paletteBySheetName: { [sheetName: string]: RefPaletteType } = {};
  lastFocused: HTMLTextAreaElement | null = null;
  solvedCaches: Map<Id, any> = new Map();
  copyingSheetId: number = 0;
  copyingZone: ZoneType = RESET_ZONE;
  cutting: boolean = false;
  histories: HistoryType[] = [];
  historyIndex: number = -1;
  historyLimit: number = DEFAULT_HISTORY_LIMIT;
  lastHistory?: HistoryType;
  currentHistory?: HistoryType;
  ready = false;

  reflect: (newHub?: HubPatchType) => void = (newHub?: HubPatchType) => {
    // This method will be overridden by useHub
  };

  public identifyFormula() {
    if (this.ready || Object.keys(this.contextsBySheetId).length === 0) {
      return;
    }
    const keys = Object.keys(this.contextsBySheetId);
    const tobe: StoreDispatchType[] = [];
    for (let i = 0; i < keys.length; i++) {
      const sheetId = keys[i];
      const storeDispatch = this.contextsBySheetId[sheetId];
      const { table } = storeDispatch.store;
      if (table.status === 0) {
        return;
      }
      tobe.push(storeDispatch);
    }
    for (let i = 0; i < tobe.length; i++) {
      const { store, dispatch } = tobe[i];
      let { table } = store;
      table.identifyFormula();
      table = table.clone();
      dispatch(updateTable(table));
    }
    this.ready = true;
  }

  constructor({ historyLimit }: HubProps = {}) {
    if (historyLimit != null) {
      this.historyLimit = historyLimit;
    }
  }
}

export const createHub = (historyLimit = DEFAULT_HISTORY_LIMIT) => {
  return new Hub({ historyLimit });
};

export type HubReactiveType = {
  hub: Hub;
};

export const createHubReactive = (historyLimit = DEFAULT_HISTORY_LIMIT): HubReactiveType => {
  return { hub: createHub(historyLimit) };
};

export const useHubReactive = (historyLimit = DEFAULT_HISTORY_LIMIT) => {
  const [hubReactive, setHubReactive] = useState<HubReactiveType>(() => createHubReactive(historyLimit));
  const { hub } = hubReactive;
  hub.reflect = (newHub?: HubPatchType) => {
    Object.assign(hub, newHub);
    if (!hub.ready) {
      return;
    }
    requestAnimationFrame(() => setHubReactive({ hub }));
  };
  return hubReactive;
};
