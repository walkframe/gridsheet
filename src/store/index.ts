import { combineReducers, configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";

import {
  default as inside,
  InsideState,
} from "./inside";
import {
  default as outside,
  OutsideState,
} from "./outside";

export type RootState = {
  inside: InsideState;
  outside: OutsideState;
};

const middleware = getDefaultMiddleware({
  serializableCheck: false,
})

const rootReducer = combineReducers({
  inside,
  outside,
});

export const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== 'production',
  middleware,
  //enhancers: composeEnhancers,
});

export type DispatchType = typeof store.dispatch;
