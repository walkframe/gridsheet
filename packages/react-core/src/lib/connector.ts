
import { Address, RefPaletteType, SheetIdsByName, TablesBySheetId } from '../types';
import { useMemo, useState } from "react";

export type SheetConnector = {
  head: number;
  sheetIdsByName: SheetIdsByName;
  tablesBySheetId: TablesBySheetId;
  choosingSheetId: number;
  choosingAddress: string;
  editingSheetId: number;
  editingAddress: string;
  paletteBySheetName: { [sheetName: string]: RefPaletteType };
  lastFocused: HTMLTextAreaElement | null;
  solvedCaches: { [address: Address]: any };
  renderedCaches: { [address: Address]: any };
  reflect: (v: SheetConnector) => void;
}

export const createConnector = () => {
  return {
    head: 0,
    sheetIdsByName: {},
    tablesBySheetId: {},
    choosingSheetId: 0,
    choosingAddress: '',
    editingSheetId: 0,
    editingAddress: '',
    paletteBySheetName: {},
    lastFocused: null,
    solvedCaches: {},
    renderedCaches: {},
    reflect: (v: SheetConnector) => {},
  };
}


export const useConnector = () => {
  const [connector, setConnector] = useState<SheetConnector>(() => createConnector());
  connector.reflect = setConnector;
  return connector;
}
