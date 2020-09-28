export type RowType = {
  [index:number]: any;
  [key:string]: any;
};

export type RowArrayType = string[];
export type MatrixType = RowArrayType[];

export type WidthType = string;
export type HeightType = string;
export type WidthsType = WidthType[];
export type HeightsType = HeightType[];

export interface OptionsType {
  widths?: WidthsType;
  heights?: HeightsType;
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
  heights: string[];
  widths: string[];
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
