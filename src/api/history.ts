import {
  AreaType,
  CellsByIdType,
  Id,
  IdMatrix,
  PointType,
  RowByAddress,
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
  lostRows: RowByAddress<Id>;
};

export type HistoryAddRowType = {
  operation: "ADD_ROW";
  reflection?: StoreReflectionType;
  y: number;
  numRows: number;
  idMatrix: IdMatrix;
};

export type HistoryRemoveRowType = {
  operation: "REMOVE_ROW";
  reflection?: StoreReflectionType;
  y: number;
  numRows: number;
  idMatrix: IdMatrix;
};

export type HistoryAddColType = {
  operation: "ADD_COL";
  reflection?: StoreReflectionType;
  x: number;
  numCols: number;
  idMatrix: IdMatrix;
};

export type HistoryRemoveColType = {
  operation: "REMOVE_COL";
  reflection?: StoreReflectionType;
  x: number;
  numCols: number;
  idMatrix: IdMatrix;
};

export type HistoryType =
  | HistoryUpdateType
  | HistoryMoveType
  | HistoryCopyType
  | HistoryAddRowType
  | HistoryRemoveRowType
  | HistoryAddColType
  | HistoryRemoveColType;
