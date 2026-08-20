// --- Re-export everything from @gridsheet/web ---
export {
  // Spatial
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
  // Time
  Time,
  // Coords
  x2c,
  c2x,
  y2r,
  r2y,
  p2a,
  a2p,
  rh,
  ch,
  // Book / Registry
  Registry,
  createBook,
  createRegistry,
  // Sheet
  Sheet,
  toValueMatrix,
  toValueMatrixAsync,
  toValueObject,
  toValueRows,
  toValueCols,
  toCellMatrix,
  toCellObject,
  toCellRows,
  toCellCols,
  // Formula
  BaseFunction,
  BaseFunctionAsync,
  Lexer,
  FormulaParser,
  RefEntity,
  ValueEntity,
  RangeEntity,
  FormulaError,
  ensureString,
  ensureNumber,
  ensureBoolean,
  ensureDate,
  check,
  eachMatrix,
  createBooleanMask,
  conditionArg,
  stripMatrix,
  // Policy
  Policy,
  ThousandSeparatorPolicyMixin,
  PercentagePolicyMixin,
  // Operations
  operations,
  // Constants & Sentinels
  DEFAULT_HISTORY_LIMIT,
  Pending,
  Spilling,
} from '@gridsheet/web';

export type {
  // Types from core
  CSSPropertiesLike,
  RefLike,
  MatrixType,
  CellType,
  System,
  Address,
  AsyncCache,
  FilterCondition,
  FilterConditionMethod,
  FilterConfig,
  FeedbackType,
  WriterType,
  CellsByAddressType,
  CellsByIdType,
  SystemsByIdType,
  ModeType,
  HeadersType,
  HistoryType,
  HistorySortRowsType,
  PointType,
  AreaType,
  ZoneType,
  EditorEvent,
  CursorStateType,
  // Book types
  BookType,
  BookProps,
  RegistryProps,
  TransmitProps,
  // Sheet types
  UserSheet,
  SheetLimits,
  ToValueMatrixProps,
  ToValueObjectProps,
  ToValueRowsProps,
  ToValueColsProps,
  ToCellMatrixProps,
  ToCellObjectProps,
  ToCellRowsProps,
  ToCellColsProps,
  // Formula types
  FunctionProps,
  FunctionArgumentDefinition,
  FunctionCategory,
  FunctionMapping,
  EnsureNumberOptions,
  EnsureBooleanOptions,
  // Policy types
  PolicyType,
  AutocompleteOption,
  PolicyMixinType,
  RenderProps,
  SerializeProps,
  SelectProps,
  SelectFallbackProps,
  SerializeForClipboardProps,
} from '@gridsheet/web';

// --- React-specific exports ---
export { GridSheet, createSheetRef, useSheetRef, createStoreRef, useStoreRef } from './components/GridSheet';
export { updateSheet } from './store/actions';
export { PluginBase, useInitialPluginContext, usePluginContext } from './components/PluginBase';
export { MenuItem, MenuDivider } from './components/MenuItem';
export { ProgressOverlay, type ProgressOverlayProps } from './components/ProgressOverlay';
// Injects the grid stylesheet (idempotent). GridSheet calls it on mount; export it so an app
// can inject early — e.g. to style a ProgressOverlay shown before any GridSheet is rendered.
export { embedStyle } from '@gridsheet/web';
export { useBook } from './lib/hooks';
export type { Dispatcher } from './store';
export { CheckboxPolicyMixin } from './policy/checkbox';

export type { Props, StoreType, SheetHandle, StoreHandle, OptionsType, LoadingState } from './types';

export { userActions } from './store/actions';
export { clip, sheet2csv } from './lib/clipboard';

export { applyers } from './store/applyers';
export { makeBorder } from './lib/style';

export type {
  MenuContext,
  MenuItemBase,
  MenuComponentItem,
  ContextMenuItemDescriptor,
  RowMenuItemDescriptor,
  ColMenuItemDescriptor,
  MenuDividerItem,
  ContextMenuSectionProps,
  RowMenuSectionProps,
  ColMenuSectionProps,
} from './lib/menu';
export {
  defaultContextMenuDescriptors,
  defaultRowMenuDescriptors,
  defaultColMenuDescriptors,
  registerMenuComponent,
} from './lib/menu';
