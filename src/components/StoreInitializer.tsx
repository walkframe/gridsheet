import React from "react";

import { Props } from "../types";

import { Context } from "../store";
import {
  setSheetHeight,
  setSheetWidth,
  setHeaderHeight,
  setHeaderWidth,
  setEditingOnEnter,
  setShowAddress,
  setOnSave,
  initializeTable,
} from "../store/actions";

import { HEADER_HEIGHT, HEADER_WIDTH, HISTORY_LIMIT } from "../constants";
import { Table } from "../lib/table";
import { functions } from "../formula/mapping";
import { getMaxSizesFromCells } from "../lib/structs";

export const StoreInitializer: React.FC<Props> = ({
  initial = {},
  options = {},
  additionalFunctions = {},
}) => {
  const {
    headerHeight = HEADER_HEIGHT,
    headerWidth = HEADER_WIDTH,
    historyLimit = HISTORY_LIMIT,
    sheetHeight,
    sheetWidth,
    editingOnEnter,
    showAddress,
    renderers,
    parsers,
    labelers,
    minNumRows,
    maxNumRows,
    minNumCols,
    maxNumCols,
    onSave,
  } = options;

  const { store, dispatch } = React.useContext(Context);

  React.useEffect(() => {
    const auto = getMaxSizesFromCells(initial);
    const table = new Table({
      numRows: auto.numRows,
      numCols: auto.numCols,
      cells: initial,
      historyLimit,
      parsers,
      renderers,
      labelers,
      minNumRows,
      maxNumRows,
      minNumCols,
      maxNumCols,
      headerHeight,
      headerWidth,
      functions: { ...functions, ...additionalFunctions },
    });
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
    if (typeof showAddress !== "undefined") {
      dispatch(setShowAddress(showAddress));
    }
  }, [showAddress]);
  React.useEffect(() => {
    if (typeof onSave !== "undefined") {
      dispatch(setOnSave(onSave));
    }
  }, [onSave]);
  return <></>;
};
