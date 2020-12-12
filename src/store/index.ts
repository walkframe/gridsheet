import { combineReducers, configureStore } from "@reduxjs/toolkit";

import {
  default as operations,
  OperationState,
} from "./operations";
import {
  default as config,
  ConfigState,
} from "./config";
import {
  default as data,
  DataState,
} from "./data";


export type RootState = {
  operations: OperationState;
  config: ConfigState;
  data: DataState;
}

const rootReducer = combineReducers({
  operations,
  config,
  data,
});

export const store = configureStore({
  reducer: rootReducer,
})