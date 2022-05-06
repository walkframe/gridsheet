import React from "react";

import { CellsType, Props } from "../types";

import { Context } from "../store";
import {
  initHistory,
  setSheetHeight,
  setSheetWidth,
  setHeaderHeight,
  setHeaderWidth,
  setEditingOnEnter,
  setCellLabel,
  setOnSave,
  initializeTable,
  updateTable,
} from "../store/actions";

import { HISTORY_SIZE, HEADER_HEIGHT, HEADER_WIDTH } from "../constants";
import { cellToIndexes } from "../api/converters";
import { Table } from "../api/tables";
import { functions } from "../formula/mapping";

export const StoreInitializer: React.FC<Props> = ({
  initial = {},
  changes,
  options = {},
  additionalFunctions = {},
}) => {
  const {
    historySize = HISTORY_SIZE,
    headerHeight = HEADER_HEIGHT,
    headerWidth = HEADER_WIDTH,
    numRows = 0,
    numCols = 0,
    sheetHeight,
    sheetWidth,
    editingOnEnter,
    cellLabel,
    renderers,
    parsers,
    onSave,
  } = options;

  const { store, dispatch } = React.useContext(Context);

  React.useEffect(() => {
    const auto = getMaxSizeFromCells(numRows, numCols, initial);
    const table = new Table({
      numRows: auto.numRows,
      numCols: auto.numCols,
      cells: initial,
      parsers,
      renderers,
    });
    // @ts-ignore
    table.setFunctions({ ...functions, ...additionalFunctions });
    dispatch(initializeTable(table));
    dispatch(initHistory(historySize));
  }, []);
  React.useEffect(() => {
    if (changes == null) {
      return;
    }
    const { table, tableInitialized } = store;
    if (!tableInitialized) {
      return;
    }
    const diff = table.diffWithCells(changes);
    dispatch(updateTable(diff));
  }, [changes]);
  React.useEffect(() => {
    if (sheetHeight) {
      dispatch(setSheetHeight(sheetHeight));
    }
  }, [sheetHeight]);
  React.useEffect(() => {
    if (sheetWidth) {
      dispatch(setSheetWidth(sheetWidth));
    }
  }, [sheetWidth]);
  React.useEffect(() => {
    if (headerHeight) {
      dispatch(setHeaderHeight(headerHeight));
    }
  }, [headerHeight]);
  React.useEffect(() => {
    if (headerWidth) {
      dispatch(setHeaderWidth(headerWidth));
    }
  }, [headerWidth]);
  React.useEffect(() => {
    if (typeof editingOnEnter !== "undefined") {
      dispatch(setEditingOnEnter(editingOnEnter));
    }
  }, [editingOnEnter]);
  React.useEffect(() => {
    if (typeof cellLabel !== "undefined") {
      dispatch(setCellLabel(cellLabel));
    }
  }, [cellLabel]);
  React.useEffect(() => {
    if (typeof onSave !== "undefined") {
      dispatch(setOnSave(onSave));
    }
  }, [onSave]);
  return <></>;
};

const getMaxSizeFromCells = (sizeY = 0, sizeX = 0, cells: CellsType = {}) => {
  let lastY = sizeY,
    lastX = sizeX;
  Object.keys(cells).map((cellId) => {
    const [y, x] = cellToIndexes(cellId);
    if (lastY < y) {
      lastY = y;
    }
    if (lastX < x) {
      lastX = x;
    }
  });
  return { numRows: lastY, numCols: lastX };
};
