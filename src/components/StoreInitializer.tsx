import React from "react";

import { CellsType, Props } from "../types";

import { Context } from "../store";
import {
  setSheetHeight,
  setSheetWidth,
  setHeaderHeight,
  setHeaderWidth,
  setEditingOnEnter,
  setCellLabel,
  setOnSave,
  initializeTable,
} from "../store/actions";

import { HEADER_HEIGHT, HEADER_WIDTH, HISTORY_SIZE } from "../constants";
import { addressToPoint } from "../api/converters";
import { Table } from "../api/table";
import { functions } from "../formula/mapping";

export const StoreInitializer: React.FC<Props> = ({
  initial = {},
  options = {},
  additionalFunctions = {},
}) => {
  const {
    headerHeight = HEADER_HEIGHT,
    headerWidth = HEADER_WIDTH,
    numRows = 0,
    numCols = 0,
    historySize = HISTORY_SIZE,
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
      historySize,
      parsers,
      renderers,
    });
    // @ts-ignore
    table.setFunctions({ ...functions, ...additionalFunctions });
    dispatch(initializeTable(table));
  }, []);
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
  let [lastY, lastX] = [sizeY, sizeX];
  Object.keys(cells).map((address) => {
    const [y, x] = addressToPoint(address);
    if (lastY < y) {
      lastY = y;
    }
    if (lastX < x) {
      lastX = x;
    }
  });
  return { numRows: lastY, numCols: lastX };
};
