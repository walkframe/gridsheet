import { createSlice, PayloadAction, Draft } from "@reduxjs/toolkit";
import {
  RowInfoType,
  ColInfoType,
} from "../types";

import {
  arrayToInfo,
} from "../api/arrays";

export type OutsideState = {
  rowInfo: RowInfoType;
  colInfo: ColInfoType;
  numRows: number;
  numCols: number;
}

export const initialState: OutsideState = {
  rowInfo: arrayToInfo([]),
  colInfo: arrayToInfo([]),
  numRows: 1,
  numCols: 1,
};

const slice = createSlice({
  name: "outside",
  initialState,
  reducers: {
    setRowInfo: (state: Draft<OutsideState>, action: PayloadAction<RowInfoType>) => {
      return {...state, rowInfo: action.payload};
    },
    setColInfo: (state: Draft<OutsideState>, action: PayloadAction<ColInfoType>) => {
      return {...state, colInfo: action.payload};
    },
    setNumRows: (state: Draft<OutsideState>, action: PayloadAction<number>) => {
      return {...state, numRows: action.payload};
    },
    setNumCols: (state: Draft<OutsideState>, action: PayloadAction<number>) => {
      return {...state, numCols: action.payload};
    },
  },
});

export default slice.reducer;
export const {
  setRowInfo,
  setColInfo,
  setNumRows,
  setNumCols,
} = slice.actions;
