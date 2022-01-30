import {
  OperationType,
  HistoryType,
  StoreType,
} from "../types";

import { Table } from "./tables";

export const pushHistory = (
  history: HistoryType,
  operation: OperationType,
): HistoryType => {
  history = { ...history };
  const operations = [...history.operations];
  operations.splice(history.index + 1, operations.length);
  operations.push({ ...operation });
  history.index++;
  if (operations.length > history.size) {
    operations.splice(0, 1);
    history.index--;
  }
  return { ...history, operations, direction: "FORWARD" };
};

export const undoSetTable = (
  store: StoreType,
  {
    before,
    choosing,
    selectingZone,
    copyingZone,
    cutting,
  }: OperationType
): StoreType => {
  const { table } = store;
  return {
    ...store,
    table: table.merge(before as Table[]),
    choosing: choosing || store.choosing,
    selectingZone: selectingZone || store.selectingZone,
    copyingZone: copyingZone || store.copyingZone,
    cutting: cutting || store.cutting,
  };
};

export const redoSetTable = (
  store: StoreType,
  {
    after,
    choosing,
    selectingZone,
    copyingZone,
    cutting,
  }: OperationType
): StoreType => {
  const { table } = store;
  return {
    ...store,
    table: table.merge(after as Table[]),
    choosing: choosing || store.choosing,
    selectingZone: selectingZone || store.selectingZone,
    copyingZone: copyingZone || store.copyingZone,
    cutting: cutting || store.cutting,
  };
};

export const undoAddRows = (
  store: StoreType,
  { after }: OperationType,
): StoreType => {
  const { table } = store;
  const { y, numRows} = after as { y: number, numRows: number};
  table.removeRows(y, numRows);
  return {
    ...store,
    table: table.copy(),
  };
};

export const redoAddRows = (
  store: StoreType,
  { after }: OperationType,
): StoreType => {
  const { table } = store;
  const { y, numRows, base } = after as { y: number, numRows: number, base: number};
  const baseRow = table.copy([base, 0, base, table.numCols()]);
  table.addRows(y, numRows, baseRow);
  return {
    ...store,
    table: table.copy(),
  };
};

export const undoAddCols = (
  store: StoreType,
  { after }: OperationType,
): StoreType => {
  const { table } = store;
  const { x, numCols } = after as { x: number, numCols: number};
  table.removeCols(x, numCols);
  return {
    ...store,
    table: table.copy(),
  };
};

export const redoAddCols = (
  store: StoreType,
  { after }: OperationType
): StoreType => {
  const { table } = store;
  const { x, numCols, base } = after as { x: number, numCols: number, base: number};
  const baseCol = table.copy([0, base, table.numRows(), base]);
  table.addCols(x, numCols, baseCol);
  return {
    ...store,
    table: table.copy(),
  };
};

export const undoRemoveRows = (
  store: StoreType,
  { before, after }: OperationType
): StoreType => {
  const { table } = store;
  const { y, numRows } = after as { y: number, numRows: number};
  table.addRows(y, numRows);
  table.merge(before as Table[]);
  return {
    ...store,
    table: table.copy(),
  };
};

export const redoRemoveRows = (
  store: StoreType,
  { after }: OperationType
): StoreType => {
  const { table } = store;
  const { y, numRows } = after as { y: number, numRows: number};
  table.removeRows(y, numRows);
  return {
    ...store,
    table: table.copy(),
  };
};

export const undoRemoveCols = (
  store: StoreType,
  { before, after }: OperationType
): StoreType => {
  const { table } = store;
  const { x, numCols } = after as { x: number, numCols: number};
  table.addCols(x, numCols);
  table.merge(before as Table[]);
  return {
    ...store,
    table: table.copy(),
  };
};

export const redoRemoveCols = (
  store: StoreType,
  { after }: OperationType,
): StoreType => {
  const { table } = store;
  const { x, numCols } = after as { x: number, numCols: number};
  table.removeCols(x, numCols);
  return {
    ...store,
    table: table.copy(),
  };
};


