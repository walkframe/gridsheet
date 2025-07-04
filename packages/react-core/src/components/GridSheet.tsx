import { useEffect, useState, useRef, useReducer } from 'react';
import type { CellsByAddressType, OptionsType, Props, StoreType } from '../types';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH, HEADER_HEIGHT, HEADER_WIDTH, SHEET_HEIGHT, SHEET_WIDTH } from '../constants';
import { Context } from '../store';
import { reducer as defaultReducer } from '../store/actions';
import { Editor } from './Editor';
import { StoreObserver } from './StoreObserver';
import { Resizer } from './Resizer';
import { Emitter } from './Emitter';
import { ContextMenu, defaultContextMenuItems } from './ContextMenu';
import { Table } from '../lib/table';
import { Tabular } from './Tabular';
import { getMaxSizesFromCells } from '../lib/structs';
import { x2c, y2r } from '../lib/converters';
import { embedStyle } from '../styles/embedder';
import { FormulaBar } from './FormulaBar';
import { SearchBar } from './SearchBar';
import { useHub } from '../lib/hub';
import { ScrollHandle } from './ScrollHandle';

export function GridSheet({
  initialCells,
  sheetName = '',
  tableRef,
  storeRef,
  options = {},
  className,
  style,
  hub: initialHub,
}: Props) {
  const { sheetResize, showFormulaBar = true, onInit, mode = 'light' } = options;
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const largeEditorRef = useRef<HTMLTextAreaElement>(null);
  const tabularRef = useRef<HTMLDivElement>(null);

  const internalHub = useHub({});
  const hub = initialHub ?? internalHub;
  const { wire } = hub;

  const [initialState] = useState<StoreType>(() => {
    const sheetId = ++wire.sheetHead;
    if (!sheetName) {
      sheetName = `Sheet${sheetId}`;
      console.debug('GridSheet: sheetName is not provided, using default name:', sheetName);
    }
    const {
      headerHeight = HEADER_HEIGHT,
      headerWidth = HEADER_WIDTH,
      minNumRows,
      maxNumRows,
      minNumCols,
      maxNumCols,
      contextMenuItems,
    } = options;
    const table = new Table({
      minNumRows,
      maxNumRows,
      minNumCols,
      maxNumCols,
      headerHeight,
      headerWidth,
      sheetName,
      hub: wire,
    });
    table.sheetId = sheetId;
    wire.sheetIdsByName[sheetName] = sheetId;

    table.initialize(initialCells);
    onInit?.(table);
    const store: StoreType = {
      sheetId,
      table, // temporary (see StoreInitializer for detail)
      rootRef,
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
      headerHeight: 0,
      headerWidth: 0,
      entering: false,
      matchingCells: [],
      matchingCellIndex: 0,
      searchCaseSensitive: false,
      editingOnEnter: true,
      showAddress: true,
      contextMenuPosition: { y: -1, x: -1 },
      contextMenuItems: contextMenuItems ?? defaultContextMenuItems,
      resizingPositionY: [-1, -1, -1],
      resizingPositionX: [-1, -1, -1],
      minNumRows: 1,
      maxNumRows: -1,
      minNumCols: 1,
      maxNumCols: -1,
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

  const [sheetHeight, setSheetHeight] = useState(
    options?.sheetHeight || estimateSheetHeight({ options, initialData: initialCells }),
  );
  const [sheetWidth, setSheetWidth] = useState(
    options?.sheetWidth || estimateSheetWidth({ options, initialData: initialCells }),
  );
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

  const { onChange, onSelect, onKeyUp } = options;
  return (
    <Context.Provider value={{ store, dispatch }}>
      <div
        className={`gs-root1`}
        ref={rootRef}
        data-sheet-name={sheetName}
        data-mode={mode}
        style={{ maxWidth: `min(100%, ${store.table.totalWidth + 2}px)` }}
      >
        <ScrollHandle style={{ position: 'fixed', top: 0, left: 0 }} />
        <ScrollHandle style={{ position: 'absolute', zIndex: 4, right: 0, top: 0, width: 5 }} horizontal={1} />
        <ScrollHandle style={{ position: 'absolute', zIndex: 4, left: 0, bottom: 0, height: 5 }} vertical={1} />

        {typeof store.searchQuery === 'undefined' ? showFormulaBar && <FormulaBar /> : <SearchBar />}
        <div
          className={`gs-main ${className || ''}`}
          ref={mainRef}
          style={{
            maxWidth: `min(100%-1px, ${store.table.totalWidth + 2}px)`,
            maxHeight: store.table.totalHeight + 2,
            ...style,
            resize: sheetResize,
          }}
        >
          <Editor mode={mode} handleKeyUp={onKeyUp} />
          <Tabular tableRef={tableRef} />
          <StoreObserver {...{ ...options, sheetHeight, sheetWidth, sheetName, storeRef }} />
          <ContextMenu />
          <Resizer />
          <Emitter onChange={onChange} onSelect={onSelect} />
        </div>
      </div>
    </Context.Provider>
  );
}

type EstimateProps = {
  initialData: CellsByAddressType;
  options: OptionsType;
};

const estimateSheetHeight = ({ initialData, options }: EstimateProps) => {
  const auto = getMaxSizesFromCells(initialData);
  let estimatedHeight = options.headerHeight || HEADER_HEIGHT;
  for (let y = 0; y < auto.numRows; y++) {
    const row = y2r(y);
    const height = initialData?.[row]?.height || initialData?.default?.height || DEFAULT_HEIGHT;
    if (estimatedHeight + height > SHEET_HEIGHT) {
      return SHEET_HEIGHT;
    }
    estimatedHeight += height;
  }
  return estimatedHeight + 3;
};

const estimateSheetWidth = ({ initialData, options }: EstimateProps) => {
  const auto = getMaxSizesFromCells(initialData);
  let estimatedWidth = options.headerWidth || HEADER_WIDTH;
  for (let x = 0; x < auto.numCols; x++) {
    const col = x2c(x);
    const width = initialData?.[col]?.width || initialData?.default?.width || DEFAULT_WIDTH;
    if (estimatedWidth + width > SHEET_WIDTH) {
      return SHEET_WIDTH;
    }
    estimatedWidth += width;
  }
  return estimatedWidth + 3;
};
