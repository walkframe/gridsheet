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
  draggingToArea,
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
  setRowInfo,
  setColInfo,
  setNumRows,
  setNumCols,
  OutsideState,
} from "../store/outside";

interface Props {
  data: MatrixType;
  options: OptionsType;
};

export const StoreInjector: React.FC<Props> = ({data, options}) => {
  const {
    historySize = 10,
    headerHeight = "auto",
    headerWidth = "auto",
    defaultHeight = "20px",
    defaultWidth = "80px",
    verticalAlign = "middle",
    cellLabel = true,
    cols = [],
    rows = [],
  } = options;

  const dispatch = useDispatch();
  React.useEffect(() => {
    dispatch(setMatrix(data));
    dispatch(initHistory(historySize));
    dispatch(setRowInfo({}));
    dispatch(setColInfo({}));
    const [y, x] = matrixShape(data);
    dispatch(setNumRows(y));
    dispatch(setNumCols(x));
  }, []);

  return (<div>
    <GridTable
      data={data}
      options={options}
    />
  </div>);
};



