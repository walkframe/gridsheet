import React from "react";
import { createSlice, PayloadAction, Draft } from "@reduxjs/toolkit";
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

export type DataState = {
  [s: string]: string;
}

export const initialState: DataState = {
};

const slice = createSlice({
  name: "operations",
  initialState,
  reducers: {
    setData: (state: Draft<DataState>, action: PayloadAction<DataState>) => {
      return {...state, ...action.payload};
    },
  },
});

export default slice.reducer;
export const {
  setData,
} = slice.actions;
