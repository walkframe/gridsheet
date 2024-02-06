import React from "react";

import { SheetMapType, TableMapType, StoreType } from "../types";



export type SheetContextType = {
  head: number;
  sheets: React.MutableRefObject<SheetMapType>;
  tables: React.MutableRefObject<TableMapType>;
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
  const sheets = React.useRef<SheetMapType>({});
  const tables = React.useRef<TableMapType>({});

  return (
    <SheetContext.Provider value={{head, tables, sheets}}>
      {children}
    </SheetContext.Provider>
  );
}