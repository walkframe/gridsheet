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

export type OperationState = {
  choosing: PositionType;
  choosingLast: PositionType;
  cutting: boolean;
  selecting: DraggingType;
  rowsSelecting: RangeType;
  colsSelecting: RangeType;
  copying: DraggingType;
  clipboardRef: React.RefObject<HTMLTextAreaElement>;
  history: History;
  editingCell: string;
}

export const initialState: OperationState = {
  choosing: [-1, -1],
  choosingLast: [-1, -1],
  cutting: false,
  copying: [-1, -1, -1, -1],
  selecting: [-1, -1, -1, -1],
  rowsSelecting: [-1, -1],
  colsSelecting: [-1, -1],
  clipboardRef: React.createRef<HTMLTextAreaElement>(),
  history: new History(0),
  editingCell: "",
};

const slice = createSlice({
  name: "operations",
  initialState,
  reducers: {
    choose: (state: Draft<OperationState>, action: PayloadAction<PositionType>) => {
      return {...state, choosing: action.payload};
    },
    setChoosingLast: (state: Draft<OperationState>, action: PayloadAction<PositionType>) => {
      return {...state, choosingLast: action.payload};
    },
    setCutting: (state: Draft<OperationState>, action: PayloadAction<boolean>) => {
      return {...state, cutting: action.payload};
    },
    setEditingCell: (state: Draft<OperationState>, action: PayloadAction<string>) => {
      return {...state, editing: action.payload};
    },
    copy: (state: Draft<OperationState>, action: PayloadAction<DraggingType>) => {
      return {...state, copying: action.payload};
    },
    select: (state: Draft<OperationState>, action: PayloadAction<DraggingType>) => {
      return {...state, selecting: action.payload};
    },
    selectRows: (state: Draft<OperationState>, action: PayloadAction<RangeType>) => {
      return {...state, rowsSelecting: action.payload};
    },
    selectCols: (state: Draft<OperationState>, action: PayloadAction<RangeType>) => {
      return {...state, colsSelecting: action.payload};
    },
    selectHistory: (state: Draft<OperationState>, action: PayloadAction<History>) => {
      return {...state, history: action.payload};
    },
  },
});

export default slice.reducer;
export const {
  choose,
  setChoosingLast,
  setCutting,
  setEditingCell,
  copy,
  select,
  selectRows,
  selectCols,
} = slice.actions;
