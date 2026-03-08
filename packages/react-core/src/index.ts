export { GridSheet, createConnector, useConnector } from './components/GridSheet';
export {
  oa2aa,
  aa2oa,
  buildInitialCells,
  buildInitialCellsFromOrigin,
  zoneToArea,
  areaToZone,
  areaToRange,
  addressesToAreas,
  addressesToCols,
  addressesToRows,
} from './lib/spatial';

export { Time } from './lib/time';
export { x2c, c2x, y2r, r2y, p2a, a2p } from './lib/coords';
export { updateTable } from './store/actions';
export { PluginBase, useInitialPluginContext, usePluginContext } from './components/PluginBase';
export type {
  MatrixType,
  CellType,
  Address,
  AsyncCache,
  FilterCondition,
  FilterConditionMethod,
  FilterConfig,
  FeedbackType,
  OptionsType,
  WriterType,
  CellsByAddressType,
  CellsByIdType,
  ModeType,
  HeadersType,
  HistoryType,
  HistorySortRowsType,
  StoreType,
  PointType,
  AreaType,
  ZoneType,
  Props,
  Connector,
  EditorEvent,
  CursorStateType,
} from './types';

export type { HubType, HubProps, WireProps, TransmitProps } from './lib/hub';
export { Wire, useHub, createHub } from './lib/hub';
export type { Dispatcher } from './store';
export { ThousandSeparatorPolicyMixin } from './policy/thousand_separator';
export { CheckboxPolicyMixin } from './policy/checkbox';
export { BaseFunction, BaseFunctionSync, BaseFunctionAsync } from './formula/functions/__base';
export type {
  FunctionProps,
  FunctionArgumentDefinition as FunctionArgumentDefinition,
  FunctionCategory,
  FunctionMapping,
} from './formula/functions/__base';
export { Lexer, FormulaParser, RefEntity, ValueEntity, RangeEntity } from './formula/evaluator';
export { FormulaError } from './formula/formula-error';
export { Table, type UserTable } from './lib/table';
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

export * as operations from './lib/operation';
export { DEFAULT_HISTORY_LIMIT } from './constants';
export { Pending, Spilling } from './sentinels';

export { userActions } from './store/actions';
export { clip, table2csv } from './lib/clipboard';

export { makeBorder } from './styles/utils';
export { syncers } from './store/dispatchers';

export {
  ensureString,
  ensureNumber,
  ensureBoolean,
  check,
  eachMatrix,
  createBooleanMask,
} from './formula/functions/__utils';
export type { EnsureNumberOptions, EnsureBooleanOptions } from './formula/functions/__utils';
export { conditionArg } from './formula/functions/__base';
export { solveTable, stripTable } from './formula/solver';
