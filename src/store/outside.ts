import { createSlice, PayloadAction, Draft } from "@reduxjs/toolkit";
import {
  CellOptionType,
  CellsOptionType,
  Feedback,
  Headers,
  Renderers,
  Parsers,
} from "../types";

export type OutsideState = {
  cellsOption: {[s: string]: CellOptionType};
  numRows: number;
  numCols: number;
  headerHeight: string;
  headerWidth: string;
  defaultHeight: string;
  defaultWidth: string;
  editingOnEnter: boolean;
  cellLabel: boolean;
  stickyHeaders: Headers;
  renderers: Renderers;
  parsers: Parsers;
  onSave?: Feedback;
}

export const initialState: OutsideState = {
  cellsOption: {},
  numRows: 1,
  numCols: 1,
  headerHeight: "20px",
  headerWidth: "50px",
  defaultHeight: "20px",
  defaultWidth: "90px",
  editingOnEnter: true,
  cellLabel: true,
  stickyHeaders: "both",
  renderers: {},
  parsers: {},
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
    setEditingOnEnter: (state: Draft<OutsideState>, action: PayloadAction<boolean>) => {
      return {...state, editingOnEnter: action.payload};
    },
    setCellLabel: (state: Draft<OutsideState>, action: PayloadAction<boolean>) => {
      return {...state, cellLabel: action.payload};
    },
    setStickyHeaders: (state: Draft<OutsideState>, action: PayloadAction<Headers>) => {
      return {...state, stickyHeaders: action.payload};
    },
    setRenderers: (state: Draft<OutsideState>, action: PayloadAction<Renderers>) => {
      return {...state, renderers: action.payload};
    },
    setParsers: (state: Draft<OutsideState>, action: PayloadAction<Parsers>) => {
      return {...state, parsers: action.payload};
    },
    setNumRows: (state: Draft<OutsideState>, action: PayloadAction<number>) => {
      return {...state, numRows: action.payload};
    },
    setNumCols: (state: Draft<OutsideState>, action: PayloadAction<number>) => {
      return {...state, numCols: action.payload};
    },
    setOnSave: (state: Draft<OutsideState>, action: PayloadAction<Feedback>) => {
      return {...state, onSave: action.payload};
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
  setEditingOnEnter,
  setCellLabel,
  setStickyHeaders,
  setRenderers,
  setParsers,
  setNumRows,
  setNumCols,
  setOnSave,
} = slice.actions;
