import React from "react";

import { MatrixType, OptionsType } from "../types";

import { Context } from "../store";
import {
  setMatrix,
  initCellsOption,
  initHistory,
  setSheetHeight,
  setSheetWidth,
  setHeaderHeight,
  setHeaderWidth,
  setRenderers,
  setParsers,
  setWriters,
  setEditingOnEnter,
  setCellLabel,
  setOnSave,
  setOnChange,
  setOnSelect,
} from "../store/actions";

import { HISTORY_SIZE, HEADER_HEIGHT, HEADER_WIDTH } from "../constants";

type Props = {
  data: MatrixType;
  options: OptionsType;
};

export const StoreInitializer: React.FC<Props> = ({ data, options }) => {
  const {
    historySize = HISTORY_SIZE,
    headerHeight = HEADER_HEIGHT,
    headerWidth = HEADER_WIDTH,
    cells,
    sheetHeight,
    sheetWidth,
    editingOnEnter,
    cellLabel,
    renderers,
    parsers,
    writers,
    onSave,
    onChange,
    onSelect,
  } = options;

  const { store, dispatch } = React.useContext(Context);
  React.useEffect(() => {
    dispatch(setMatrix(data));
  }, [data]);
  React.useEffect(() => {
    if (typeof cells !== "undefined") {
      dispatch(initCellsOption(cells));
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
    if (typeof writers !== "undefined") {
      dispatch(setWriters(writers));
    }
  }, [writers]);
  React.useEffect(() => {
    if (typeof onSave !== "undefined") {
      dispatch(setOnSave(onSave));
    }
  }, [onSave]);
  React.useEffect(() => {
    if (typeof onChange !== "undefined") {
      dispatch(setOnChange(onChange));
    }
  }, [onChange]);
  React.useEffect(() => {
    if (typeof onSelect !== "undefined") {
      dispatch(setOnSelect(onSelect));
    }
  }, [onSelect]);
  React.useEffect(() => {
    dispatch(initHistory(historySize));
  }, []);

  return <></>;
};
