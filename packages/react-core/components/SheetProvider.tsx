import React from 'react';

import { RefPaletteType, SheetMapType, TableMapType } from '../types';

export type SheetContextType = {
  mounted: boolean;
  sheets: React.MutableRefObject<SheetMapType>;
  tables: React.MutableRefObject<TableMapType>;
  head: React.MutableRefObject<number>;
  choosingCell: string;
  setChoosingCell: (cell: string) => void;
  editingCell: string;
  setEditingCell: (cell: string) => void;
  externalRefs?: { [sheetName: string]: RefPaletteType };
  setExternalRefs?: (refs: { [sheetName: string]: RefPaletteType }) => void;
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

type Props = {
  children: React.ReactNode;
};

export function SheetProvider({ children }: Props) {
  const [mounted, setMounted] = React.useState(false);
  const [version, setVersion] = React.useState(0);
  const head = React.useRef(1);
  const sheets = React.useRef<SheetMapType>({});
  const tables = React.useRef<TableMapType>({});
  const [choosingCell, setChoosingCell] = React.useState('');
  const [editingCell, setEditingCell] = React.useState('');
  const [externalRefs, setExternalRefs] = React.useState<{ [sheetName: string]: RefPaletteType }>({});
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
        choosingCell,
        setChoosingCell,
        editingCell,
        setEditingCell,
        externalRefs,
        setExternalRefs,
        lastFocusedRef,
        setLastFocusedRef,
        forceRender: () => {
          if (version >= Number.MAX_SAFE_INTEGER) {
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
