import React from 'react';

import { SheetMapType, TableMapType } from '../types';

export type SheetContextType = {
  mounted: boolean;
  sheets: React.MutableRefObject<SheetMapType>;
  tables: React.MutableRefObject<TableMapType>;
  head: React.MutableRefObject<number>;
  lastFocusedRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  setLastFocusedRef: (ref: React.MutableRefObject<HTMLTextAreaElement | null>) => void;
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
  const lastFocusedRefInitial = React.useRef<HTMLTextAreaElement | null>(null);
  const [lastFocusedRef, setLastFocusedRef] = React.useState(lastFocusedRefInitial);

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
        lastFocusedRef,
        setLastFocusedRef,
        forceRender: () => {
          if (version === Number.MAX_SAFE_INTEGER) {
            setVersion(0);
            return;
          }
          setVersion(version + 1);
        },
      }}
    >
      {children}
    </SheetContext.Provider>
  );
}
