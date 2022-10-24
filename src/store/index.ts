import * as React from "react";
import { Dispatcher, StoreType } from "../types";

export const Context = React.createContext(
  {} as {
    store: StoreType;
    dispatch: Dispatcher;
  }
);
