import React from "react";
import { useDispatch } from "react-redux";

import { MatrixType, OptionsType } from "../types";

import {
  setMatrix,
  setCellsOption,
  initHistory,
  setSheetHeight,
  setSheetWidth,
} from "../store/inside";

import {
  setHeaderHeight,
  setHeaderWidth,
  setEditingOnEnter,
  setCellLabel,
  setStickyHeaders,
  setRenderers,
  setParsers,
  setOnSave,
} from "../store/outside";

import { SHEET_HEIGHT, SHEET_WIDTH } from "../constants";

type Props = {
  data: MatrixType;
  options: OptionsType;
};

export const StoreInitializer: React.FC<Props> = ({ data, options }) => {
  const {
    historySize = 10,
    cells,
    headerHeight,
    headerWidth,
    sheetHeight = SHEET_HEIGHT,
    sheetWidth = SHEET_WIDTH,
    editingOnEnter,
    cellLabel,
    stickyHeaders,
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
    if (typeof headerHeight !== "undefined") {
      dispatch(setHeaderHeight(headerHeight));
    }
  }, [headerHeight]);
  React.useEffect(() => {
    if (typeof headerWidth !== "undefined") {
      dispatch(setHeaderWidth(headerWidth));
    }
  }, [headerWidth]);
  React.useEffect(() => {
    if (typeof sheetHeight !== "undefined") {
      dispatch(setSheetHeight(sheetHeight));
    }
  }, [sheetHeight]);
  React.useEffect(() => {
    if (typeof sheetWidth !== "undefined") {
      dispatch(setSheetWidth(sheetWidth));
    }
  }, [sheetWidth]);
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
    if (typeof stickyHeaders !== "undefined") {
      dispatch(setStickyHeaders(stickyHeaders));
    }
  }, [stickyHeaders]);
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
