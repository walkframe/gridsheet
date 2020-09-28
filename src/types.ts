export type RowType = {
  [index:number]: any;
  [key:string]: any;
};

export type RowArrayType = string[];
export type DataType = RowArrayType[];

export type WidthType = string;
export type HeightType = string;
export type WidthsType = WidthType[];
export type HeightsType = HeightType[];

export interface OptionsType {
  widths?: WidthsType;
  heights?: HeightsType;
};

export interface Props {
  data: DataType;
  options?: OptionsType;
};

export type PositionType = [number, number];
export type AreaType = [number, number, number, number];

export type HistoryType = {
  index: number;
  operations: OperationType[];
  next: () => OperationType | undefined;
  prev: () => OperationType | undefined;
  append: (operation: OperationType) => void;
};

export type OperationCommandType = "replace" | "cut" | "addRows" | "delRows" | "addCols" | "delCols";

export type OperationType = {
  command: OperationCommandType;
  src: PositionType;
  dst: PositionType;
  before: DataType;
  after: DataType;
};

export type handlePropsType = {
  y: number;
  x: number;
  matrix: DataType;
  history: HistoryType;
  clipboardRef: React.RefObject<HTMLTextAreaElement>;
  choosing: PositionType;
  selecting: AreaType;
  selectingArea: AreaType;
  copying: AreaType;
  copyingArea: AreaType;
  heights: string[];
  widths: string[];
  cutting: boolean,
  copy: (range: AreaType) => void;
  select: (range: AreaType) => void;
  choose: (position: PositionType) => void;
  setChoosingLast: (position: PositionType) => void;
  setCutting: (cutting: boolean) => void;
  setMatrix: (matrix: DataType) => void;
  colsSelect: (cols: [number, number]) => void;
  rowsSelect: (rows: [number, number]) => void;
  colsSelecting: [number, number];
  rowsSelecting: [number, number];
};
