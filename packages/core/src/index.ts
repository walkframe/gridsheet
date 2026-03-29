// --- Spatial ---
export {
  oa2aa,
  aa2oa,
  buildInitialCells,
  buildInitialCellsFromOrigin,
  zoneToArea,
  areaToZone,
  areaToRange,
  matrixShape,
  addressesToAreas,
  addressesToCols,
  addressesToRows,
  // additional internals used by react-core
  between,
  among,
  zoneShape,
  makeSequence,
  getMaxSizesFromCells,
  isZoneNotSelected,
  complementSelectingArea,
  concatAreas,
  createMatrix,
  areaShape,
  areaDiff,
  restrictZone,
  superposeArea,
} from './lib/spatial';

// --- Time ---
export { Time } from './lib/time';

// --- Coords ---
export { x2c, c2x, y2r, r2y, p2a, a2p, rh, ch, stripAddressAbsolute, grantAddressAbsolute } from './lib/coords';

// --- Types ---
export type {
  CSSPropertiesLike,
  RefLike,
  Resolution,
  Y,
  X,
  Height,
  Width,
  ShapeType,
  RectType,
  MatrixType,
  CursorStateType,
  FeedbackType,
  ModeType,
  HeadersType,
  AsyncCache,
  System,
  FilterConditionMethod,
  FilterCondition,
  FilterConfig,
  CellType,
  RawCellType,
  CellPatchType,
  CellFilter,
  CellsByAddressType,
  CellsByIdType,
  SystemsByIdType,
  RangeType,
  PointType,
  ExtraPointType,
  PositionType,
  ZoneType,
  AreaType,
  WriterType,
  Id,
  Ids,
  IdMatrix,
  Address,
  MatricesByAddress,
  StorePatchType,
  HistoryUpdateType,
  MoveRelation,
  MoveRelations,
  HistoryMoveType,
  HistoryInsertRowsType,
  HistoryRemoveRowsType,
  HistoryInsertColsType,
  HistoryRemoveColsType,
  HistorySortRowsType,
  HistoryType,
  Virtualization,
  OperatorType,
  OperationType,
  Dispatcher,
  StoreDispatchType,
  ContextsBySheetId,
  SheetIdsByName,
  RefPaletteType,
  EditorEvent,
} from './types';

// --- Book / Registry ---
export type { BookType, BookProps, RegistryProps, TransmitProps } from './lib/book';
export { Registry, createBook, createRegistry, createBinding } from './lib/book';

// --- Sheet ---
export { Sheet, type UserSheet, type SheetLimits } from './lib/sheet';
export {
  toValueMatrix,
  toValueObject,
  toValueRows,
  toValueCols,
  toCellMatrix,
  toCellObject,
  toCellRows,
  toCellCols,
  type ToValueMatrixProps,
  type ToValueObjectProps,
  type ToValueRowsProps,
  type ToValueColsProps,
  type ToCellMatrixProps,
  type ToCellObjectProps,
  type ToCellRowsProps,
  type ToCellColsProps,
} from './lib/sheet_utils';

// --- Formula ---
export { BaseFunction, BaseFunctionAsync } from './formula/functions/__base';
export type {
  FunctionProps,
  FunctionArgumentDefinition,
  FunctionCategory,
  FunctionMapping,
} from './formula/functions/__base';
export { Lexer, FormulaParser, RefEntity, ValueEntity, RangeEntity, stripSheetName } from './formula/evaluator';
export { FormulaError } from './formula/formula-error';
export {
  ensureString,
  ensureNumber,
  ensureBoolean,
  ensureDate,
  check,
  eachMatrix,
  createBooleanMask,
} from './formula/functions/__utils';
export type { EnsureNumberOptions, EnsureBooleanOptions } from './formula/functions/__utils';
export { conditionArg, stripMatrix } from './formula/functions/__base';
export { getFunctionHelps, type FunctionHelp } from './formula/mapping';

// --- Policy ---
export { Policy } from './policy/core';
export type {
  PolicyType,
  AutocompleteOption,
  PolicyMixinType,
  RenderProps,
  SerializeProps,
  SelectProps,
  SelectFallbackProps,
  SerializeForClipboardProps,
} from './policy/core';
export { ThousandSeparatorPolicyMixin } from './policy/thousand_separator';

// --- Operations ---
export * as operations from './lib/operation';

// --- Constants & Sentinels ---
export {
  DEFAULT_HISTORY_LIMIT,
  DEFAULT_HEIGHT,
  DEFAULT_WIDTH,
  MIN_WIDTH,
  MIN_HEIGHT,
  HEADER_HEIGHT,
  HEADER_WIDTH,
  SHEET_HEIGHT,
  SHEET_WIDTH,
  DEFAULT_COL_KEY,
  DEFAULT_ROW_KEY,
} from './constants';
export { Pending, Spilling } from './sentinels';

// --- DOM ---
export { focus, preventSafariBounce } from './lib/dom';

// --- Input ---
export { handleFormulaQuoteAutoClose, insertTextAtCursor, isFocus, insertRef, isRefInsertable, expandInput, resetInput } from './lib/input';

// --- Virtualization ---
export { smartScroll, virtualize, getAreaInTabular, getCellRectPositions } from './lib/virtualization';

// --- Popup ---
export { calcBelowPosition, clampLeft, calcSideStyle, clampPopup, hAlignTransform } from './lib/popup';
export type { HAlign, VAlign, PopupPosition, SideStyle } from './lib/popup';

// --- Label ---
export { getLabel } from './lib/label';

// --- Palette ---
export { COLOR_PALETTE } from './lib/palette';

// --- Autofill ---
export { Autofill } from './lib/autofill';

// --- Styles ---
export { embedStyle } from './styles/embedder';
