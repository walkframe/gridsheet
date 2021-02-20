import {
  combineReducers,
  configureStore,
  getDefaultMiddleware,
} from "@reduxjs/toolkit";

import { InsideState, OutsideState } from "../types";

import { default as inside } from "./inside";
import { default as outside } from "./outside";

export type RootState = {
  inside: InsideState;
  outside: OutsideState;
};

const middleware = getDefaultMiddleware({
  serializableCheck: false,
});

const rootReducer = combineReducers({
  inside,
  outside,
});

export const createStore = () =>
  configureStore({
    reducer: rootReducer,
    devTools: process.env.NODE_ENV !== "production",
    middleware,
    //enhancers: composeEnhancers,
  });

const store = createStore();

export type DispatchType = typeof store.dispatch;
