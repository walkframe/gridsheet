import { useEffect, useState, useRef, useReducer, createRef } from 'react';
import type { CellsByAddressType, SheetHandle, StoreHandle, OptionsType, Props, StoreType } from '../types';
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  HEADER_HEIGHT,
  HEADER_WIDTH,
  SHEET_HEIGHT,
  SHEET_WIDTH,
  DEFAULT_COL_KEY,
  DEFAULT_ROW_KEY,
} from '@gridsheet/core/constants';
import { Context } from '../store';
import { reducer as defaultReducer } from '../store/actions';
import { Editor } from './Editor';
import { StoreObserver } from './StoreObserver';
import { Resizer } from './Resizer';
import { Emitter } from './Emitter';
import { ContextMenu } from './ContextMenu';
import { ColumnMenu } from './ColumnMenu';
import { RowMenu } from './RowMenu';
import { Sheet } from '@gridsheet/core/lib/sheet';
import { Tabular } from './Tabular';
import { getMaxSizesFromCells } from '@gridsheet/core/lib/spatial';
import { x2c, y2r } from '@gridsheet/core/lib/coords';
import { embedStyle } from '@gridsheet/core/styles/embedder';
import { FormulaBar } from './FormulaBar';
import { SearchBar } from './SearchBar';
import { useBook } from '../lib/hooks';
import { ScrollHandle } from './ScrollHandle';
import { defaultContextMenuDescriptors, defaultRowMenuDescriptors, defaultColMenuDescriptors } from '../lib/menu';

export const createSheetRef = () => createRef<SheetHandle | null>();
export const useSheetRef = () => useRef<SheetHandle | null>(null);
export const createStoreRef = () => createRef<StoreHandle | null>();
export const useStoreRef = () => useRef<StoreHandle | null>(null);

export function GridSheet({
  initialCells,
  sheetName = '',
  sheetRef: initialSheetRef,
  storeRef: initialStoreRef,
  options = {},
  className,
  style,
  book: initialBook,
}: Props) {
  const { sheetResize, showFormulaBar = true, mode = 'light' } = options;
  const rootRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const largeEditorRef = useRef<HTMLTextAreaElement>(null);
  const tabularRef = useRef<HTMLDivElement>(null);

  const internalSheetRef = useSheetRef();
  const sheetRef = initialSheetRef ?? internalSheetRef;
  const internalStoreRef = useStoreRef();
  const storeRef = initialStoreRef ?? internalStoreRef;

  const internalBook = useBook({});
  const book = initialBook ?? internalBook;
  const { registry } = book;

  const [sheetId] = useState<number>(() => {
    if (sheetName) {
      // Named sheets: use sheetName as stable dedup key to prevent double-increment in Strict Mode.
      if (!registry._componentSheetIds.has(sheetName)) {
        registry._componentSheetIds.set(sheetName, ++registry.sheetHead);
      }
      return registry._componentSheetIds.get(sheetName)!;
    }
    // Unnamed sheets: accept double-increment in Strict Mode (IDs may skip, but remain unique).
    return ++registry.sheetHead;
  });

  // Initialize sheetReactive
  const sheetReactive = useRef<Sheet | null>(null);

  const [initialState] = useState<StoreType>(() => {
    if (!sheetName) {
      sheetName = `Sheet${sheetId}`;
      console.debug('GridSheet: sheetName is not provided, using default name:', sheetName);
    }
    const { limits, contextMenu, rowMenu, colMenu } = options;
    const sheet = new Sheet({
      limits,
      name: sheetName,
      registry,
    });
    sheet.id = sheetId;
    registry.sheetIdsByName[sheetName] = sheetId;

    sheet.initialize(initialCells);
    registry.onInit?.({ sheet });

    sheet.setTotalSize();
    sheetReactive.current = sheet;

    const store: StoreType = {
      sheetId,
      sheetReactive,
      rootRef,
      flashRef,
      mainRef,
      searchInputRef,
      editorRef,
      largeEditorRef,
      tabularRef,
      choosing: { y: 1, x: 1 },
      inputting: '',
      selectingZone: { startY: 1, startX: 1, endY: -1, endX: -1 },
      autofillDraggingTo: null,
      leftHeaderSelecting: false,
      topHeaderSelecting: false,
      editingAddress: '',
      editorRect: { y: 0, x: 0, height: 0, width: 0 },
      dragging: false,
      sheetHeight: 0,
      sheetWidth: 0,
      entering: false,
      matchingCells: [],
      matchingCellIndex: 0,
      searchCaseSensitive: false,
      searchRegex: false,
      editingOnEnter: true,
      contextMenuPosition: { y: -1, x: -1 },
      contextMenu: contextMenu ?? defaultContextMenuDescriptors,
      rowMenu: rowMenu ?? defaultRowMenuDescriptors,
      colMenu: colMenu ?? defaultColMenuDescriptors,
      resizingPositionY: [-1, -1, -1],
      resizingPositionX: [-1, -1, -1],
      columnMenuState: null,
      rowMenuState: null,
      editorHovering: true,
      mode: 'light',
    };
    return store;
  });

  type ReducerWithoutAction<S> = (prevState: S) => S;

  const [store, dispatch] = useReducer(
    defaultReducer as unknown as ReducerWithoutAction<StoreType>,
    initialState,
    () => initialState,
  );

  useEffect(() => {
    embedStyle();
  }, []);

  const [sheetHeight, setSheetHeight] = useState(options?.sheetHeight || estimateSheetHeight(initialCells));
  const [sheetWidth, setSheetWidth] = useState(options?.sheetWidth || estimateSheetWidth(initialCells));
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSheetHeight(mainRef.current?.clientHeight || 0);
      setSheetWidth(mainRef.current?.clientWidth || 0);
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, []);
  useEffect(() => {
    if (options.sheetHeight) {
      setSheetHeight(options.sheetHeight);
    }
  }, [options.sheetHeight]);
  useEffect(() => {
    if (options.sheetWidth) {
      setSheetWidth(options.sheetWidth);
    }
  }, [options.sheetWidth]);

  return (
    <Context.Provider value={{ store, dispatch }}>
      <div
        className={`gs-root1 ${registry.ready ? 'gs-initialized' : ''}`}
        ref={rootRef}
        data-sheet-name={sheetName}
        data-mode={mode}
        data-rows={store.sheetReactive.current?.numRows ?? 0}
        data-cols={store.sheetReactive.current?.numCols ?? 0}
      >
        <div className="gs-flash-overlay" ref={flashRef} />
        <ScrollHandle style={{ position: 'fixed', top: 0, left: 0 }} />
        <ScrollHandle style={{ position: 'absolute', zIndex: 4, right: 0, top: 0, width: 5 }} horizontal={1} />
        <ScrollHandle style={{ position: 'absolute', zIndex: 4, left: 0, bottom: 0, height: 5 }} vertical={1} />

        {typeof store.searchQuery === 'undefined' ? (
          showFormulaBar && <FormulaBar ready={registry.ready} />
        ) : (
          <SearchBar />
        )}
        <div
          className={`gs-main ${className || ''}`}
          ref={mainRef}
          style={{
            //width: '100%',
            maxWidth: (store.sheetReactive.current?.totalWidth || 0) + 2,
            maxHeight: (store.sheetReactive.current?.fullHeight || 0) + 2,
            overflow: 'auto',
            resize: sheetResize,
            ...style,
          }}
        >
          <Editor mode={mode} />
          <Tabular />
          <StoreObserver {...{ ...options, sheetHeight, sheetWidth, sheetName, sheetRef, storeRef }} />
          <ContextMenu />
          <ColumnMenu />
          <RowMenu />
          <Resizer />
          <Emitter />
        </div>
      </div>
    </Context.Provider>
  );
}

const estimateSheetHeight = (initialCells: CellsByAddressType) => {
  const auto = getMaxSizesFromCells(initialCells);
  let estimatedHeight = initialCells[0]?.height ?? HEADER_HEIGHT;
  for (let y = 1; y <= auto.numRows; y++) {
    const row = y2r(y);
    const height =
      initialCells?.[row]?.height ||
      initialCells?.['0' + row]?.height ||
      initialCells?.[DEFAULT_ROW_KEY]?.height ||
      initialCells?.default?.height ||
      DEFAULT_HEIGHT;
    if (estimatedHeight + height > SHEET_HEIGHT) {
      return SHEET_HEIGHT;
    }
    estimatedHeight += height;
  }
  return estimatedHeight + 3;
};

const estimateSheetWidth = (initialCells: CellsByAddressType) => {
  const auto = getMaxSizesFromCells(initialCells);
  let estimatedWidth = initialCells[0]?.width ?? HEADER_WIDTH;
  for (let x = 1; x <= auto.numCols; x++) {
    const col = x2c(x);
    const width =
      initialCells?.[col]?.width ||
      initialCells?.[col + '0']?.width ||
      initialCells?.[DEFAULT_COL_KEY]?.width ||
      initialCells?.default?.width ||
      DEFAULT_WIDTH;
    if (estimatedWidth + width > SHEET_WIDTH) {
      return SHEET_WIDTH;
    }
    estimatedWidth += width;
  }
  return estimatedWidth + 3;
};
