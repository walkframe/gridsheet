import { createSlice, PayloadAction, Draft } from "@reduxjs/toolkit";
import {
  CellOptionType,
  CellsOptionType,
} from "../types";

import {
  arrayToInfo,
} from "../api/arrays";

export type OutsideState = {
  cellsOption: {[s: string]: CellOptionType};
  numRows: number;
  numCols: number;
  headerHeight: string;
  headerWidth: string;
  defaultHeight: string;
  defaultWidth: string;
  cellLabel: boolean;
}

export const initialState: OutsideState = {
  cellsOption: {},
  numRows: 1,
  numCols: 1,
  headerHeight: "auto",
  headerWidth: "auto",
  defaultHeight: "20px",
  defaultWidth: "80px",
  cellLabel: true,
};

const slice = createSlice({
  name: "outside",
  initialState,
  reducers: {
    setCellsOption: (state: Draft<OutsideState>, action: PayloadAction<CellsOptionType>) => {
      return {...state, cellsOption: action.payload};
    },
    setHeaderHeight: (state: Draft<OutsideState>, action: PayloadAction<string>) => {
      return {...state, headerHeight: action.payload};
    },
    setHeaderWidth: (state: Draft<OutsideState>, action: PayloadAction<string>) => {
      return {...state, headerWidth: action.payload};
    },
    setDefaultHeight: (state: Draft<OutsideState>, action: PayloadAction<string>) => {
      return {...state, defaultHeight: action.payload};
    },
    setDefaultWidth: (state: Draft<OutsideState>, action: PayloadAction<string>) => {
      return {...state, defaultWidth: action.payload};
    },
    setCellLabel: (state: Draft<OutsideState>, action: PayloadAction<boolean>) => {
      return {...state, cellLabel: action.payload};
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
  setCellsOption,
  setHeaderHeight,
  setHeaderWidth,
  setDefaultHeight,
  setDefaultWidth,
  setCellLabel,
  setNumRows,
  setNumCols,
} = slice.actions;
