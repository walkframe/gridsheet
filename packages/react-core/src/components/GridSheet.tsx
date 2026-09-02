import { useEffect, useState, useRef, useReducer, createRef, useCallback } from 'react';
import type { CSSProperties } from 'react';
import type { BorderSides, CellsByAddressType, SheetHandle, StoreHandle, OptionsType, Props, StoreType } from '../types';
import {
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  HEADER_HEIGHT,
  HEADER_WIDTH,
  SHEET_HEIGHT,
  SHEET_WIDTH,
  DEFAULT_COL_KEY,
  DEFAULT_ROW_KEY,
} from '@gridsheet/web';
import { Context } from '../store';
import { reducer as defaultReducer, isMutationAction, isAsyncMutationAction, commitAsyncOp } from '../store/actions';
import { AsyncProgressOverlay, type AsyncProgressHandle } from './AsyncProgressOverlay';
import { ProgressOverlay } from './ProgressOverlay';
import { Editor } from './Editor';
import { StoreObserver } from './StoreObserver';
import { Resizer } from './Resizer';
import { Emitter } from './Emitter';
import { ContextMenu } from './ContextMenu';
import { ColumnMenu } from './ColumnMenu';
import { RowMenu } from './RowMenu';
import { Sheet } from '@gridsheet/web';
import { Tabular } from './Tabular';
import { getMaxSizesFromCells } from '@gridsheet/web';
import { x2c, y2r } from '@gridsheet/web';
import { embedStyle } from '@gridsheet/web';
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
  loading: loadingProp,
}: Props) {
  const {
    sheetResize,
    showFormulaBar = true,
    mode = 'light',
    density = 'compact',
    gridLines = 'all',
    formulaBarBorders = { all: true },
    matrixBorders = { all: true },
  } = options;
  // Translate the border config objects into CSS custom properties consumed by the
  // stylesheet (--gs-fb-* for the formula bar, --gs-mx-* for the matrix). A specific side
  // overrides `all`.
  const bw = (b: BorderSides, side: 'left' | 'top' | 'right' | 'bottom') =>
    (b[side] ?? b.all ?? false) ? '1px' : '0';
  const borderVars = {
    '--gs-fb-bl': bw(formulaBarBorders, 'left'),
    '--gs-fb-bt': bw(formulaBarBorders, 'top'),
    '--gs-fb-br': bw(formulaBarBorders, 'right'),
    '--gs-fb-bb': bw(formulaBarBorders, 'bottom'),
    '--gs-mx-bl': bw(matrixBorders, 'left'),
    '--gs-mx-bt': bw(matrixBorders, 'top'),
    '--gs-mx-br': bw(matrixBorders, 'right'),
    '--gs-mx-bb': bw(matrixBorders, 'bottom'),
  } as CSSProperties;
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
    const { limits, contextMenu, rowMenu, colMenu, eager } = options;
    const sheet = new Sheet({
      limits,
      name: sheetName,
      registry,
      eager,
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
      fixedWidth: false,
      fixedHeight: false,
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
      pendingAsyncOp: null,
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

  // When sheetWidth/sheetHeight is a string, the sheet stretches to its parent (fill mode)
  // and the rendered pixel size is measured via ResizeObserver instead of being fixed.
  const fillWidth = typeof options.sheetWidth === 'string';
  const fillHeight = typeof options.sheetHeight === 'string';
  // matrixAlignment picks which axes may center. A fixed box (that a smaller grid centers
  // within) only exists when the size is *intentionally* larger than the content — an
  // explicit sheetWidth/sheetHeight, or a manual resize — never from the content estimate
  // or the formula-bar width, so nothing but those produces an empty gap. 'none' keeps the
  // old shrink-to-content behavior.
  const matrixAlignment = options.matrixAlignment ?? 'none';
  const centersWidth = matrixAlignment === 'horizontal' || matrixAlignment === 'both';
  const centersHeight = matrixAlignment === 'vertical' || matrixAlignment === 'both';
  const [resizedWidth, setResizedWidth] = useState(false);
  const [resizedHeight, setResizedHeight] = useState(false);
  const fixedWidth = centersWidth && (options.sheetWidth != null || resizedWidth);
  const fixedHeight = centersHeight && (options.sheetHeight != null || resizedHeight);
  const [sheetHeight, setSheetHeight] = useState(
    typeof options?.sheetHeight === 'number' ? options.sheetHeight : estimateSheetHeight(initialCells),
  );
  const [sheetWidth, setSheetWidth] = useState(
    typeof options?.sheetWidth === 'number' ? options.sheetWidth : estimateSheetWidth(initialCells),
  );
  useEffect(() => {
    const el = mainRef.current;
    if (!el) {
      return;
    }
    let first = true;
    const ro = new ResizeObserver(() => {
      // CSS `resize` writes an inline width/height when the user drags the handle; that is
      // the signal that the box was intentionally sized, so a smaller grid may now center.
      if (el.style.width) {
        setResizedWidth(true);
      }
      if (el.style.height) {
        setResizedHeight(true);
      }
      if (first) {
        first = false;
        // In fill mode we want the initial measurement; otherwise keep the provided/estimated size.
        if (!fillWidth && !fillHeight) {
          return;
        }
      }
      const root = rootRef.current;
      // Height is re-measured only when it is genuinely container-driven: fill mode,
      // or after the user dragged the resize handle. Otherwise `Math.min` would
      // ratchet a fixed-height grid smaller on every layout change (e.g. content
      // updates) and never recover, collapsing it over time. Width keeps auto-
      // fitting the container so wide grids stay responsive.
      if (fillHeight || el.style.height) {
        setSheetHeight(root ? Math.min(el.clientHeight, root.clientHeight) : el.clientHeight);
      }
      setSheetWidth(root ? Math.min(el.clientWidth, root.clientWidth) : el.clientWidth);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fillWidth, fillHeight]);
  useEffect(() => {
    if (typeof options.sheetHeight === 'number') {
      setSheetHeight(options.sheetHeight);
    }
  }, [options.sheetHeight]);
  useEffect(() => {
    if (typeof options.sheetWidth === 'number') {
      setSheetWidth(options.sheetWidth);
    }
  }, [options.sheetWidth]);

  const [loading, setLoading] = useState(false);

  // Latest store, so wrappedDispatch (memoized) can read pendingAsyncOp for the lock.
  const latestStoreRef = useRef(store);
  latestStoreRef.current = store;

  const wrappedDispatch = useCallback(
    ((action: { type: number; value: any }) => {
      const async = isAsyncMutationAction(action.type);
      const mutating = isMutationAction(action.type);
      // Lock: while a chunked async op is in flight the sheet is mid-mutation, so
      // reject any other mutation (edit/undo/paste/fill) until it commits. Read-only
      // actions (selection, scroll) still pass through.
      if (latestStoreRef.current.pendingAsyncOp != null && (async || mutating)) {
        return;
      }
      if (async) {
        // Its reduce just sets pendingAsyncOp (cheap); the runner effect drives it.
        (dispatch as any)(action);
        return;
      }
      if (!mutating) {
        (dispatch as any)(action);
        return;
      }
      setLoading(true);
      // TWO rAFs before running the (synchronous, possibly multi-second) mutation:
      // a single rAF fires BEFORE the overlay's first paint, so the overlay never
      // actually showed during the block. The second rAF runs after that paint, so
      // the spinner is on screen (and its compositor-driven animation keeps moving)
      // while the main thread is blocked. Clear right after dispatch — React batches
      // loading:false with the mutation's own re-render, so the overlay lifts exactly
      // when the result appears.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          (dispatch as any)(action);
          setLoading(false);
        }),
      );
    }) as typeof dispatch,
    [dispatch],
  );

  // Runner for chunked async mutations (large fill/paste): when an action sets
  // store.pendingAsyncOp, run it off the reducer — reporting progress into the store
  // and committing the mutated sheet when done. Two rAFs first so the progress
  // overlay paints before the (still-synchronous) diff-build inside run() starts.
  const overlayRef = useRef<AsyncProgressHandle>(null);
  const pendingAsyncOp = store.pendingAsyncOp;
  useEffect(() => {
    if (pendingAsyncOp == null) {
      return;
    }
    let cancelled = false;
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(async () => {
        if (cancelled) {
          return;
        }
        try {
          const nextSheet = await pendingAsyncOp.run((ratio) => {
            // Imperative — updates only the overlay, never the grid.
            overlayRef.current?.setProgress(ratio);
          });
          if (!cancelled) {
            (dispatch as any)(
              commitAsyncOp({
                sheet: nextSheet,
                selectingZone: pendingAsyncOp.selectingZone,
                finalize: pendingAsyncOp.finalize,
              }),
            );
            pendingAsyncOp.postCommit?.();
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[gridsheet] async op failed:', e);
          if (!cancelled) {
            (dispatch as any)(commitAsyncOp({ sheet: latestStoreRef.current.sheetReactive.current!, selectingZone: pendingAsyncOp.selectingZone }));
          }
        }
      }),
    );
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [pendingAsyncOp, dispatch]);

  return (
    <Context.Provider value={{ store, dispatch: wrappedDispatch }}>
      <div
        className={`gs-root1 ${registry.ready ? 'gs-initialized' : ''}`}
        ref={rootRef}
        data-sheet-name={sheetName}
        data-mode={mode}
        data-density={density}
        data-gridlines={gridLines}
        data-matrix-align={matrixAlignment}
        data-rows={store.sheetReactive.current?.numRows ?? 0}
        data-cols={store.sheetReactive.current?.numCols ?? 0}
        style={
          fillWidth || fillHeight
            ? {
                ...borderVars,
                // inline-flex (when width isn't filled) keeps the prior shrink-to-content width.
                display: fillWidth ? 'flex' : 'inline-flex',
                flexDirection: 'column',
                ...(fillWidth ? { width: options.sheetWidth as string } : null),
                ...(fillHeight ? { height: options.sheetHeight as string } : null),
              }
            : borderVars
        }
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
            ...(fillWidth ? { width: '100%' } : null),
            maxWidth: '100%',
            // In fill-height mode the parent's height is the limit (flex:1 fills the remaining
            // space below the formula bar). With an explicit fixed height, honor it exactly
            // (never shrink to the viewport — otherwise a grid placed low on a page or in a
            // short viewport collapses). Only the shrink-to-content case caps at the viewport
            // bottom so a very tall grid stays usable within the current view.
            ...(fillHeight
              ? { flex: 1, minHeight: 0, maxHeight: '100%' }
              : fixedHeight
                ? { maxHeight: sheetHeight }
                : {
                    maxHeight: mainRef.current
                      ? window.innerHeight - mainRef.current.getBoundingClientRect().top
                      : (store.sheetReactive.current?.fullHeight || 0) + 2,
                  }),
            resize: sheetResize,
            ...style,
          }}
        >
          <Editor mode={mode} />
          <Tabular />
          <StoreObserver
            {...{ ...options, sheetHeight, sheetWidth, fixedWidth, fixedHeight, sheetName, sheetRef, storeRef }}
          />
          <ContextMenu />
          <ColumnMenu />
          <RowMenu />
          <Resizer />
          <Emitter />
          {store.pendingAsyncOp != null ? (
            // Chunked async mutation (large fill/paste): imperative progress, grid not re-rendered.
            <AsyncProgressOverlay ref={overlayRef} label={store.pendingAsyncOp.label} />
          ) : loading ? (
            // Internal sync mutation in flight: brief indeterminate spinner.
            <div className="gs-loading-overlay">
              <div className="gs-loading-spinner" />
            </div>
          ) : loadingProp ? (
            // Consumer-driven initial loading (data not ready yet).
            <ProgressOverlay
              progress={typeof loadingProp === 'object' ? (loadingProp.progress ?? null) : null}
              label={typeof loadingProp === 'object' ? loadingProp.label : undefined}
            />
          ) : null}
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
