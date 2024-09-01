import * as React from 'react';
import { ReducerWithoutAction } from 'react';

import { CellsByAddressType, OptionsType, Props, StoreType } from '../types';
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
import { reducer as defaultReducer } from '../store/actions';

import { StoreInitializer } from './StoreInitializer';
import { Resizer } from './Resizer';
import { Emitter } from './Emitter';
import { ContextMenu } from './ContextMenu';
import { Table } from '../lib/table';
import { Tabular } from './Tabular';
import { getMaxSizesFromCells } from '../lib/structs';
import { x2c, y2r } from '../lib/converters';
import { embedStyle } from '../styles/embedder';
import { useSheetContext } from './SheetProvider';
import { FormulaBar } from './FormulaBar';

export function GridSheet({
  initialCells: initialData,
  sheetName = '',
  tableRef,
  options = {},
  className,
  style,
  additionalFunctions = {},
}: Props) {
  const { sheetResize, showFormulaBar = true } = options;
  const [prevSheetName, setPrevSheetName] = React.useState(sheetName);
  const sheetRef = React.useRef<HTMLDivElement | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const editorRef = React.useRef<HTMLTextAreaElement | null>(null);
  const largeEditorRef = React.useRef<HTMLTextAreaElement | null>(null);
  const gridOuterRef = React.useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [sheetProvided, sheetContext] = useSheetContext();

  const [initialState] = React.useState<StoreType>(() => {
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
      functions: { ...functions, ...additionalFunctions },
    });
    let sheetId = 0;
    if (sheetProvided) {
      sheetId = sheetContext.head.current++;
      table.tables = sheetContext.tables.current;
      table.sheets = sheetContext.sheets.current;
    }
    table.tables[sheetId] = table;
    table.sheetId = sheetId;
    table.initialize(initialData);

    return {
      sheetId,
      table, // temporary (see StoreInitializer for detail)
      tableInitialized: false,
      sheetRef,
      searchInputRef,
      editorRef,
      largeEditorRef,
      gridOuterRef,
      lastFocusedRef,
      choosing: { y: 1, x: 1 },
      cutting: false,
      selectingZone: { startY: -1, startX: -1, endY: -1, endX: -1 },
      copyingZone: { startY: -1, startX: -1, endY: -1, endX: -1 },
      autofillDraggingTo: null,
      verticalHeaderSelecting: false,
      horizontalheaderSelecting: false,
      editingCell: '',
      editorRect: { y: 0, x: 0, height: 0, width: 0 },
      resizingRect: { y: -1, x: -1, height: -1, width: -1 },
      sheetHeight: 0,
      sheetWidth: 0,
      headerHeight: 0,
      headerWidth: 0,
      entering: false,
      matchingCells: [],
      matchingCellIndex: 0,
      editingOnEnter: true,
      showAddress: true,
      contextMenuPosition: { y: -1, x: -1 },
      resizingPositionY: [-1, -1, -1],
      resizingPositionX: [-1, -1, -1],
      minNumRows: 1,
      maxNumRows: -1,
      minNumCols: 1,
      maxNumCols: -1,
      lastEdited: '',
    };
  });

  const [store, dispatch] = React.useReducer(
    defaultReducer as ReducerWithoutAction<StoreType>,
    initialState,
    () => initialState,
  );

  React.useEffect(() => {
    embedStyle();
  }, []);

  React.useEffect(() => {
    if (!sheetProvided) {
      return;
    }
    sheetContext.tables.current[store.sheetId] = store.table;
    sheetContext?.forceRender?.();
  }, [store.table]);

  React.useEffect(() => {
    if (!sheetProvided) {
      return;
    }
    if (prevSheetName !== sheetName) {
      delete sheetContext.sheets.current[prevSheetName];
      setPrevSheetName(sheetName);
    }
    if (sheetName) {
      sheetContext.sheets.current[sheetName] = store.sheetId;
    }
    store.table.sheetName = sheetName;
  }, [sheetName]);

  const [sheetHeight, setSheetHeight] = React.useState(
    options?.sheetHeight || estimateSheetHeight({ options, initialData }),
  );
  const [sheetWidth, setSheetWidth] = React.useState(
    options?.sheetWidth || estimateSheetWidth({ options, initialData }),
  );
  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (sheetRef.current?.clientHeight) {
        setSheetHeight(sheetRef.current.clientHeight);
      }
      if (sheetRef.current?.clientWidth) {
        setSheetWidth(sheetRef.current.clientWidth);
      }
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const { onChange, onSelect, mode } = options;
  return (
    <Context.Provider value={{ store, dispatch }}>
      <div className={`gridsheet-1 ${mode || 'light'}`} data-sheet-name={sheetName}>
        {showFormulaBar && <FormulaBar width={sheetWidth} />}
        <div
          className={`gs-main ${className || ''} ${
            sheetWidth > store.table.totalWidth ? 'gs-table-width-smaller' : 'gs-table-width-larger'
          } ${sheetHeight > store.table.totalHeight ? 'gs-table-height-smaller' : 'gs-table-height-larger'}`}
          ref={sheetRef}
          style={{
            maxWidth: store.table.totalWidth + 2,
            maxHeight: store.table.totalHeight + 2,
            ...style,
            resize: sheetResize,
          }}
        >
          <Tabular tableRef={tableRef} />
          <StoreInitializer
            initialCells={initialData}
            options={{ ...options, sheetHeight, sheetWidth }}
            additionalFunctions={additionalFunctions}
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
