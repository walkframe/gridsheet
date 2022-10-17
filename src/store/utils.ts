import { Table } from "../api/table";
import { PositionType, StoreType, ZoneType } from "../types";

export const restrictPositions = (store: StoreType, table: Table) => {
  const { choosing, selectingZone, copyingZone } = store;
  let [y, x] = choosing;
  let [y1, x1, y2, x2] = selectingZone;
  let [y3, x3, y4, x4] = copyingZone;
  const [numRows, numCols] = [table.getNumRows(), table.getNumCols()];
  if (y > numRows) {
    y = numRows;
  }
  if (x > numCols) {
    x = numCols;
  }
  if (y1 > numRows) {
    y1 = numRows;
  }
  if (y2 > numRows) {
    y2 = numRows;
  }
  if (x1 > numCols) {
    x1 = numCols;
  }
  if (x2 > numCols) {
    x2 = numCols;
  }
  if (y3 > numRows) {
    y3 = numRows;
  }
  if (y4 > numRows) {
    y4 = numRows;
  }
  if (x3 > numCols) {
    x3 = numCols;
  }
  if (x4 > numCols) {
    x4 = numCols;
  }
  return {
    choosing: [y, x] as PositionType,
    selectingZone: [y1, x1, y2, x2] as ZoneType,
    copyingZone: [y3, x3, y4, x4] as ZoneType,
  };
};

export const shouldTracking = (operation: string) => {
  switch (operation) {
    case "ADD_ROW":
      return true;
    case "ADD_COL":
      return true;
    case "REMOVE_ROW":
      return true;
    case "REMOVE_COL":
      return true;
    case "MOVE":
      return true;
  }
  return false;
};
