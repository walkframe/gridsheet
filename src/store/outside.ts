import { createSlice, PayloadAction, Draft } from "@reduxjs/toolkit";
import { Feedback, Headers, Renderers, Parsers, OutsideState } from "../types";

export const initialState: OutsideState = {
  headerHeight: 20,
  headerWidth: 50,
  editingOnEnter: true,
  cellLabel: true,
  contextMenuPosition: [-1, -1],
  renderers: {},
  parsers: {},
};

const slice = createSlice({
  name: "outside",
  initialState,
  reducers: {
    setHeaderHeight: (
      state: Draft<OutsideState>,
      action: PayloadAction<number>
    ) => {
      return { ...state, headerHeight: action.payload };
    },
    setHeaderWidth: (
      state: Draft<OutsideState>,
      action: PayloadAction<number>
    ) => {
      return { ...state, headerWidth: action.payload };
    },
    setEditingOnEnter: (
      state: Draft<OutsideState>,
      action: PayloadAction<boolean>
    ) => {
      return { ...state, editingOnEnter: action.payload };
    },
    setCellLabel: (
      state: Draft<OutsideState>,
      action: PayloadAction<boolean>
    ) => {
      return { ...state, cellLabel: action.payload };
    },
    setContextMenuPosition: (
      state: Draft<OutsideState>,
      action: PayloadAction<[number, number]>
    ) => {
      return { ...state, contextMenuPosition: action.payload };
    },
    setRenderers: (
      state: Draft<OutsideState>,
      action: PayloadAction<Renderers>
    ) => {
      return { ...state, renderers: action.payload };
    },
    setParsers: (
      state: Draft<OutsideState>,
      action: PayloadAction<Parsers>
    ) => {
      return { ...state, parsers: action.payload };
    },
    setOnSave: (
      state: Draft<OutsideState>,
      action: PayloadAction<Feedback>
    ) => {
      return { ...state, onSave: action.payload };
    },
  },
});

export default slice.reducer;
export const {
  setHeaderHeight,
  setHeaderWidth,
  setEditingOnEnter,
  setCellLabel,
  setContextMenuPosition,
  setRenderers,
  setParsers,
  setOnSave,
} = slice.actions;
