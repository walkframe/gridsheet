import { DEFAULT_HISTORY_LIMIT, RESET_ZONE } from '../constants';

import type {
  HistoryType,
  RefPaletteType,
  SheetIdsByName,
  ContextsBySheetId,
  ZoneType,
  CellsByIdType,
  Id,
  StoreDispatchType,
  CellType,
  System,
} from '../types';
import { useEffect, useState } from 'react';
import { updateTable } from '../store/actions';
import type { FunctionMapping } from '../formula/functions/__base';
import { functions as functionsDefault } from '../formula/mapping';
import { PolicyType } from '../policy/core';
import { RendererType } from '../renderers/core';
import { ParserType } from '../parsers/core';
import { Table } from './table';

export type WireProps = {
  historyLimit?: number;
  additionalFunctions?: FunctionMapping;
  renderers?: { [rendererName: string]: RendererType };
  parsers?: { [parserName: string]: ParserType };
  labelers?: { [labelerName: string]: (n: number) => string };
  policies?: { [policyName: string]: PolicyType };
};

export class Wire {
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
  functions: FunctionMapping = {};
  renderers: { [rendererName: string]: RendererType } = {};
  parsers: { [parserName: string]: ParserType } = {};
  labelers: { [labelerName: string]: (n: number) => string } = {};
  policies: { [policyName: string]: PolicyType } = {};

  transmit: (newHub?: TransmitProps) => void = (newHub?: TransmitProps) => {
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

  public getSystem(id: Id, table: Table): System {
    const cell = this.data[id];
    if (cell?.system) {
      return cell.system;
    }
    return {
      id,
      sheetId: table.sheetId,
      changedAt: new Date(),
      dependents: new Set(),
    };
  }

  constructor({
    historyLimit,
    additionalFunctions,
    renderers = {},
    parsers = {},
    labelers = {},
    policies = {},
  }: WireProps = {}) {
    if (historyLimit != null) {
      this.historyLimit = historyLimit;
    }
    this.functions = {
      ...functionsDefault,
      ...additionalFunctions,
    };
    this.renderers = renderers;
    this.parsers = parsers;
    this.labelers = labelers;
    this.policies = policies;
  }
}

export type TransmitProps = Partial<Wire>;

export const createWire = (props: WireProps = {}) => {
  return new Wire(props);
};

export type HubType = {
  wire: Wire;
};

export const createHub = (props: WireProps = {}): HubType => {
  return { wire: createWire(props) };
};

export const useHub = (props: WireProps = {}) => {
  const [hub, setHub] = useState<HubType>(() => createHub(props));
  const { wire } = hub;
  wire.transmit = (patch?: TransmitProps) => {
    Object.assign(wire, patch);
    if (!wire.ready) {
      return;
    }
    requestAnimationFrame(() => setHub({ wire }));
  };
  useEffect(() => {
    Object.assign(wire, props);
  }, [props]);
  return hub;
};
