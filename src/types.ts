export type RowType = {
  [index:number]: any;
  [key:string]: any;
}

export type DataType = RowType[];

export interface Props {
  data: DataType;
};
