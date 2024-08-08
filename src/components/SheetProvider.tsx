import React from 'react';

import { SheetMapType, TableMapType } from '../types';

export type SheetContextType = {
  mounted: boolean;
  sheets: React.MutableRefObject<SheetMapType>;
  tables: React.MutableRefObject<TableMapType>;
  head: React.MutableRefObject<number>;
  forceRender: () => void;
};

export const SheetContext = React.createContext({} as SheetContextType);

export function useSheetContext(): [boolean, SheetContextType] {
  const ctx = React.useContext(SheetContext);
  if (ctx.tables?.current == null) {
    return [false, ctx];
  }
  return [true, ctx];
}

export function useSheetDispatch() {
  const dispatch = React.useContext(SheetContext);
  if (!dispatch) {
    return undefined;
  }
  return dispatch;
}

export function SheetProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const [version, setVersion] = React.useState(0);
  const head = React.useRef(1);
  const sheets = React.useRef<SheetMapType>({});
  const tables = React.useRef<TableMapType>({});

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SheetContext.Provider
      value={{
        mounted,
        tables,
        sheets,
        head,
        forceRender: () => setVersion(version + 1),
      }}
    >
      {children}
    </SheetContext.Provider>
  );
}
