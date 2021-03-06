import * as React from "react";
import { StoreType } from "../types";

export const Context = React.createContext(
  {} as {
    store: StoreType;
    dispatch: React.Dispatch<{
      type: string;
      value: any;
    }>;
  }
);
