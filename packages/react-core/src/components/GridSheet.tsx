import { useEffect, useState, useRef, useReducer, useMemo } from 'react';

import type { CellsByAddressType, OptionsType, Props, StoreType } from '../types';
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  HEADER_HEIGHT,
  HEADER_WIDTH,
  SHEET_HEIGHT,
  SHEET_WIDTH,
  HISTORY_LIMIT,
} from '../constants';
import { functions } from '../formula/mapping';
import { Context } from '../store';
import { reducer as defaultReducer, updateTable } from '../store/actions';
import { Editor } from './Editor';
import { StoreInitializer } from './StoreInitializer';
import { Resizer } from './Resizer';
import { Emitter } from './Emitter';
import { ContextMenu } from './ContextMenu';
import { Table } from '../lib/table';
import { Tabular } from './Tabular';
import { getMaxSizesFromCells } from '../lib/structs';
import { x2c, y2r } from '../lib/converters';
import { embedStyle } from '../styles/embedder';
import { FormulaBar } from './FormulaBar';
import { SearchBar } from './SearchBar';
import { createConnector, SheetConnector, useConnector } from '../lib/connector';

export function GridSheet({
  initialCells,
  sheetName = '',
  tableRef,
  options = {},
  className,
  style,
  connector: initialConnector,
}: Props) {
  const { 
    sheetResize, 
    showFormulaBar = true, 
    onInit, 
    mode = 'light',
    additionalFunctions = {},
  } = options;
  const [prevSheetName, setPrevSheetName] = useState(sheetName);
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const largeEditorRef = useRef<HTMLTextAreaElement>(null);
  const tabularRef = useRef<HTMLDivElement>(null);

  const connector = useMemo<SheetConnector>(() => {
    return initialConnector ?? createConnector();
  }, [initialConnector]);

  /*
  const [connector, setConnector] = useConnector();
  useEffect(() => {
    if (initialConnector) {
      setConnector(initialConnector);
      return;
    }
    if (!sheetName) {
      console.warn('If a unique sheet name is not specified, cross-sheet formula interpretation will not work.');
    }
  }, [])
  */
  const [initialState] = useState<StoreType>(() => {
    const {
      headerHeight = HEADER_HEIGHT,
      headerWidth = HEADER_WIDTH,
      historyLimit = HISTORY_LIMIT,
      renderers,
      parsers,
      labelers,
      minNumRows,
      maxNumRows,
      minNumCols,
      maxNumCols,
    } = options;
    const table = new Table({
      historyLimit,
      parsers,
      renderers,
      labelers,
      minNumRows,
      maxNumRows,
      minNumCols,
      maxNumCols,
      headerHeight,
      headerWidth,
      sheetName,
      connector,
      functions: { ...functions, ...additionalFunctions },
    });
    const sheetId = table.sheetId = ++connector.head;
    connector.sheetIdsByName[sheetName] = sheetId;
    connector.tablesBySheetId[sheetId] = table;
    table.initialize(initialCells);
    onInit?.(table);
    return {
      sheetId,
      table, // temporary (see StoreInitializer for detail)
      rootRef,
      mainRef,
      searchInputRef,
      editorRef,
      largeEditorRef,
      tabularRef,
      choosing: { y: 1, x: 1 },
      cutting: false,
      inputting: '',
      selectingZone: { startY: -1, startX: -1, endY: -1, endX: -1 },
      copyingZone: { startY: -1, startX: -1, endY: -1, endX: -1 },
      autofillDraggingTo: null,
      leftHeaderSelecting: false,
      topHeaderSelecting: false,
      editingAddress: '',
      editorRect: { y: 0, x: 0, height: 0, width: 0 },
      resizingRect: { y: -1, x: -1, height: -1, width: -1 },
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
      resizingPositionY: [-1, -1, -1],
      resizingPositionX: [-1, -1, -1],
      minNumRows: 1,
      maxNumRows: -1,
      minNumCols: 1,
      maxNumCols: -1,
      mode: 'light',
      lastEdited: '',
    };
  });

  type ReducerWithoutAction<S> = (prevState: S) => S;

  const [store, dispatch] = useReducer(
    defaultReducer as unknown as ReducerWithoutAction<StoreType>,
    initialState,
    () => initialState,
  );
  const { table } = store;

  useEffect(() => {
    store.table.sheetName = sheetName;
    //table.conn.solvedCaches.value = {};
    const sheetId = table.conn.sheetIdsByName[prevSheetName];
    delete table.conn.sheetIdsByName[prevSheetName];
    table.conn.sheetIdsByName[sheetName] = sheetId;
    setPrevSheetName(sheetName);
  }, [sheetName]);

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
          <StoreInitializer
            initialCells={initialCells}
            options={{ ...options, sheetHeight, sheetWidth }}
          />
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
