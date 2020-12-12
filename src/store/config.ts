import React from "react";
import { createSlice, PayloadAction, Draft, configureStore } from "@reduxjs/toolkit";
import {
  MatrixType,
  OptionsType,
  PositionType,
  RangeType,
  AreaType,
  DraggingType,
  RowInfoType,
  ColInfoType,
} from "../types";
import { History } from "../api/histories";

import {
  arrayToInfo,
} from "../api/arrays";

export type ConfigState = {
  rowInfo: RowInfoType;
  colInfo: ColInfoType;
  numRows: number;
  numCols: number;
}

export const initialState: ConfigState = {
  rowInfo: arrayToInfo([]),
  colInfo: arrayToInfo([]),
  numRows: 1,
  numCols: 1,
};

const slice = createSlice({
  name: "operations",
  initialState,
  reducers: {
    setRowInfo: (state: Draft<ConfigState>, action: PayloadAction<RowInfoType>) => {
      return {...state, rowInfo: action.payload};
    },
    setColInfo: (state: Draft<ConfigState>, action: PayloadAction<ColInfoType>) => {
      return {...state, colInfo: action.payload};
    },
    setNumRows: (state: Draft<ConfigState>, action: PayloadAction<number>) => {
      return {...state, numRows: action.payload};
    },
    setNumCols: (state: Draft<ConfigState>, action: PayloadAction<number>) => {
      return {...state, numCols: action.payload};
    },
  },
});

export default slice.reducer;
export const {
  setRowInfo,
  setColInfo,
} = slice.actions;
