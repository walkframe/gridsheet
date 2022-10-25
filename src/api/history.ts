import {
  AreaType,
  CellsByIdType,
  Id,
  IdMatrix,
  PointType,
  LostRowByAddress,
  ZoneType,
} from "../types";

export type StoreReflectionType = {
  choosing?: PointType;
  cutting?: boolean;
  copyingZone?: ZoneType;
  selectingZone?: ZoneType | undefined;
};

export type HistoryUpdateType = {
  operation: "UPDATE";
  reflection?: StoreReflectionType;
  diffBefore: CellsByIdType;
  diffAfter: CellsByIdType;
  partial: boolean;
};

export type HistoryCopyType = {
  operation: "COPY";
  reflection?: StoreReflectionType;
  diffBefore: CellsByIdType;
  diffAfter: CellsByIdType;
  area: AreaType;
};

export type HistoryMoveType = {
  operation: "MOVE";
  reflection?: StoreReflectionType;
  matrixFrom: IdMatrix;
  matrixTo: IdMatrix;
  matrixNew: IdMatrix;
  positionFrom: PointType;
  positionTo: PointType;
  lostRows: LostRowByAddress<Id>;
};

export type HistoryAddRowsType = {
  operation: "ADD_ROWS";
  reflection?: StoreReflectionType;
  y: number;
  numRows: number;
  idMatrix: IdMatrix;
  // TODO: add
  // diffBefore: CellsByIdType;
  // diffAfter: CellsByIdType;
};

export type HistoryRemoveRowsType = {
  operation: "REMOVE_ROWS";
  reflection?: StoreReflectionType;
  y: number;
  numRows: number;
  idMatrix: IdMatrix;
};

export type HistoryAddColsType = {
  operation: "ADD_COLS";
  reflection?: StoreReflectionType;
  x: number;
  numCols: number;
  idMatrix: IdMatrix;
  // TODO: add
  // diffBefore: CellsByIdType;
  // diffAfter: CellsByIdType;
};

export type HistoryRemoveColsType = {
  operation: "REMOVE_COLS";
  reflection?: StoreReflectionType;
  x: number;
  numCols: number;
  idMatrix: IdMatrix;
};

export type HistoryType =
  | HistoryUpdateType
  | HistoryMoveType
  | HistoryCopyType
  | HistoryAddRowsType
  | HistoryRemoveRowsType
  | HistoryAddColsType
  | HistoryRemoveColsType;
