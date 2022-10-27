import {
  CellsByIdType,
  Id,
  IdMatrix,
  PointType,
  ZoneType,
  MatrixesByAddress,
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

export type HistoryMoveType = {
  operation: "MOVE";
  reflection?: StoreReflectionType;
  matrixFrom: IdMatrix;
  matrixTo: IdMatrix;
  matrixNew: IdMatrix;
  pointFrom: PointType;
  pointTo: PointType;
  lostRows: MatrixesByAddress<Id>;
};

export type HistoryAddRowsType = {
  operation: "ADD_ROWS";
  reflection?: StoreReflectionType;
  y: number;
  idMatrix: IdMatrix;
  diffBefore?: CellsByIdType;
  diffAfter?: CellsByIdType;
  partial?: true;
};

export type HistoryRemoveRowsType = {
  operation: "REMOVE_ROWS";
  reflection?: StoreReflectionType;
  y: number;
  idMatrix: IdMatrix;
};

export type HistoryAddColsType = {
  operation: "ADD_COLS";
  reflection?: StoreReflectionType;
  x: number;
  idMatrix: IdMatrix;
  diffBefore?: CellsByIdType;
  diffAfter?: CellsByIdType;
  partial?: true;
};

export type HistoryRemoveColsType = {
  operation: "REMOVE_COLS";
  reflection?: StoreReflectionType;
  x: number;
  idMatrix: IdMatrix;
};

export type HistoryType =
  | HistoryUpdateType
  | HistoryMoveType
  | HistoryAddRowsType
  | HistoryRemoveRowsType
  | HistoryAddColsType
  | HistoryRemoveColsType;
