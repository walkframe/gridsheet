import { createSlice, PayloadAction, Draft } from "@reduxjs/toolkit";
import { Feedback, Headers, OutsideState } from "../types";

export const initialState: OutsideState = {
  editingOnEnter: true,
  cellLabel: true,
  contextMenuPosition: [-1, -1],
};

const slice = createSlice({
  name: "outside",
  initialState,
  reducers: {
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
  setEditingOnEnter,
  setCellLabel,
  setContextMenuPosition,
  setOnSave,
} = slice.actions;
