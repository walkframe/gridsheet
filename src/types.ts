
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

export type RangeType = [number, number];
export type PositionType = [number, number];
export type DraggingType = [number, number, number, number];
export type AreaType = [number, number, number, number];

export type HistoryType = {
  index: number;
  operations: OperationType[];
  next: () => OperationType | undefined;
  prev: () => OperationType | undefined;
  append: (operation: OperationType) => void;
};

export type OperationCommandType = "write" | "addRows" | "delRows" | "addCols" | "delCols";

export type OperationType = {
  command: OperationCommandType;
  cutting?: AreaType;
  position: PositionType;
  before: MatrixType;
  after: MatrixType;
};

export type handlePropsType = {
  y: number;
  x: number;
  matrix: MatrixType;
  history: HistoryType;
  clipboardRef: React.RefObject<HTMLTextAreaElement>;
  choosing: PositionType;
  selecting: DraggingType;
  selectingArea: AreaType;
  copying: DraggingType;
  copyingArea: AreaType;
  numRows: number;
  numCols: number;
  cutting: boolean,
  copy: (range: AreaType) => void;
  select: (range: AreaType) => void;
  choose: (position: PositionType) => void;
  setChoosingLast: (position: PositionType) => void;
  setCutting: (cutting: boolean) => void;
  setMatrix: (matrix: MatrixType) => void;
  colsSelect: (cols: [number, number]) => void;
  rowsSelect: (rows: [number, number]) => void;
  colsSelecting: [number, number];
  rowsSelecting: [number, number];
};
