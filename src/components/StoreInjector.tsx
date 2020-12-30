import React from "react";
import { useDispatch, useSelector } from 'react-redux';

import {
  MatrixType,
  OptionsType,
} from "../types";

import {
  GridTable,
} from "./GridTable";

import {
  zoneToArea,
  between,
  among,
  shape,
  makeSequence,
  matrixShape,
  arrayToInfo,
} from "../api/arrays";

import {
  setMatrix,
  initHistory,
} from "../store/inside";

import {
  setCellsOption,
  setHeaderHeight,
  setHeaderWidth,
  setDefaultHeight,
  setDefaultWidth,
  setEditingOnEnter,
  setCellLabel,
  setNumRows,
  setNumCols,
  setOnSave,
  setOnChange,
  OutsideState,
} from "../store/outside";

interface Props {
  data: MatrixType;
  options: OptionsType;
};

export const StoreInjector: React.FC<Props> = ({data, options}) => {
  const {
    historySize = 10,
    cells,
    headerHeight,
    headerWidth,
    defaultHeight,
    defaultWidth,
    editingOnEnter,
    cellLabel,
    onSave,
    onChange,
  } = options;

  const dispatch = useDispatch();

  React.useEffect(() => {
    dispatch(setMatrix(data));
    const [y, x] = matrixShape(data);
    dispatch(setNumRows(y));
    dispatch(setNumCols(x));
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
    if (typeof defaultHeight !== "undefined") {
      dispatch(setDefaultHeight(defaultHeight));
    }
  }, [defaultHeight]);
  React.useEffect(() => {
    if (typeof defaultWidth !== "undefined") {
      dispatch(setDefaultWidth(defaultWidth));
    }
  }, [defaultWidth]);
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
  React.useEffect(() => {
    if (typeof onChange !== "undefined") {
      dispatch(setOnChange(onChange));
    }
  }, [onChange]);
  React.useEffect(() => {
    dispatch(initHistory(historySize));
  }, []);

  return (<div>
    <GridTable
      data={data}
      options={options}
    />
  </div>);
};



