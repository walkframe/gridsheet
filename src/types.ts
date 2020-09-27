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
