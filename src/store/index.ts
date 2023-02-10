import * as React from "react";
import { StoreType } from "../types";

export type Dispatcher = React.Dispatch<{
  type: number;
  value: any;
}>;

export const Context = React.createContext(
  {} as {
    store: StoreType;
    dispatch: Dispatcher;
  }
);
