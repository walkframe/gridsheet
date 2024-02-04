import React from "react";

import { StoreType } from "../types";

type StoreMap = {[key: string]: StoreType}; // id: table
type NameMap = {[key: string]: number}; // name: id

export type SheetContextType = {
  head: number;
  names: React.MutableRefObject<NameMap>;
  stores: React.MutableRefObject<StoreMap>;
};

export const SheetContext = React.createContext({} as SheetContextType);

export function useSheetDispatch() {
  const dispatch = React.useContext(SheetContext);
  if (!dispatch) {
    return undefined;
  };
  return dispatch;
}

export function SheetProvider({ children }: {
  children: React.ReactNode;
}) {
  const head = 1;
  const names = React.useRef<NameMap>({});
  const tables = React.useRef<StoreMap>({});

  return (
    <SheetContext.Provider value={{head, stores: tables, names}}>
      {children}
    </SheetContext.Provider>
  );
}