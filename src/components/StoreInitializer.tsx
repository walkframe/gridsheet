import React from "react";
import { useDispatch } from "react-redux";

import { MatrixType, OptionsType } from "../types";

import {
  setMatrix,
  setCellsOption,
  initHistory,
  setSheetHeight,
  setSheetWidth,
  setHeaderHeight,
  setHeaderWidth,
  setRenderers,
  setParsers,
} from "../store/inside";

import { setEditingOnEnter, setCellLabel, setOnSave } from "../store/outside";

import {
  HISTORY_SIZE,
  SHEET_HEIGHT,
  SHEET_WIDTH,
  HEADER_HEIGHT,
  HEADER_WIDTH,
} from "../constants";

type Props = {
  data: MatrixType;
  options: OptionsType;
};

export const StoreInitializer: React.FC<Props> = ({ data, options }) => {
  const {
    historySize = HISTORY_SIZE,
    cells,
    headerHeight = HEADER_HEIGHT,
    headerWidth = HEADER_WIDTH,
    sheetHeight = SHEET_HEIGHT,
    sheetWidth = SHEET_WIDTH,
    editingOnEnter,
    cellLabel,
    renderers,
    parsers,
    onSave,
  } = options;

  const dispatch = useDispatch();

  React.useEffect(() => {
    dispatch(setMatrix(data));
  }, [data]);
  React.useEffect(() => {
    if (typeof cells !== "undefined") {
      dispatch(setCellsOption(cells));
    }
  }, [cells]);
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
    if (typeof renderers !== "undefined") {
      dispatch(setRenderers(renderers));
    }
  }, [renderers]);
  React.useEffect(() => {
    if (typeof parsers !== "undefined") {
      dispatch(setParsers(parsers));
    }
  }, [parsers]);
  React.useEffect(() => {
    if (typeof onSave !== "undefined") {
      dispatch(setOnSave(onSave));
    }
  }, [onSave]);
  React.useEffect(() => {
    dispatch(initHistory(historySize));
  }, []);

  return <></>;
};
