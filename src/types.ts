
export type Y = number;
export type X = number;

export type CellType = string;
export type MatrixType = CellType[][];

export type RowOptionType = {
  label?: string;
  width?: string;
  height?: string;
  style?: React.CSSProperties;
  verticalAlign?: string;
  key?: string | number;
};

export type ColOptionType = {
  label?: string;
  width?: string;
  height?: string;
  style?: React.CSSProperties;
  verticalAlign?: string;
  key?: string | number;
};

export type RowOptionsType = RowOptionType[];
export type ColOptionsType = ColOptionType[];

export type RowInfoType = {[s: string]: RowOptionType, [i: number]: RowOptionType};
export type ColInfoType = {[s: string]: ColOptionType, [i: number]: ColOptionType};

export interface OptionsType {
  historySize?: number;
  defaultHeight?: string;
  defaultWidth?: string;
  headerHeight?: string;
  headerWidth?: string;
  verticalAlign?: string;
  rows?: RowOptionsType;
  cols?: ColOptionsType;
  cellLabel?: boolean;
};

export interface Props {
  data: MatrixType;
  options?: OptionsType;
};

export type RangeType = [number, number]; // [start, end]
export type PositionType = [number, number]; // [y, x]
export type DraggingType = [number, number, number, number]; // [startY, startX, endY, endX]
export type AreaType = DraggingType; // [top, left, bottom, right] (subtype of DraggingType)

export type HistoryType = {
  index: number;
  size: number;
  operations: OperationType[];
};

export type OperationCommandType = "write" | "copy" | "cut" | "addRows" | "delRows" | "addCols" | "delCols";

export type OperationType = {
  command: OperationCommandType;
  src: AreaType;
  dst: AreaType;
  before: MatrixType;
  after: MatrixType;
};

export type ReactionsType = {[s: string]: boolean};