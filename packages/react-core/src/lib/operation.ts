import { OperationType as operations } from '../types';

export const RemoveRows: operations = 0b00000000000000000000000000000000000000000000000000001; // 1
export const RemoveCols: operations = 0b00000000000000000000000000000000000000000000000000010; // 2
export const InsertRowsAbove: operations = 0b00000000000000000000000000000000000000000000000000100; // 4
export const InsertRowsBelow: operations = 0b00000000000000000000000000000000000000000000000001000; // 8
export const InsertColsLeft: operations = 0b00000000000000000000000000000000000000000000000010000; // 16
export const InsertColsRight: operations = 0b00000000000000000000000000000000000000000000000100000; // 32
export const MoveFrom: operations = 0b00000000000000000000000000000000000000000000001000000; // 64
export const MoveTo: operations = 0b00000000000000000000000000000000000000000000010000000; // 128
export const Write: operations = 0b00000000000000000000000000000000000000000000100000000; // 256
export const Style: operations = 0b00000000000000000000000000000000000000000001000000000; // 512
export const Copy: operations = 0b00000000000000000000000000000000000000010000000000000; // 8192
export const Resize: operations = 0b00000000000000000000000000000000000000000010000000000; // 1024
export const SetRenderer: operations = 0b00000000000000000000000000000000000000000100000000000; // 2048
export const SetParser: operations = 0b00000000000000000000000000000000000000001000000000000; // 4096
export const SetPolicy: operations = 0b00000000000000000000000000000000000000100000000000000; // 16384

export const NoOperation: operations = 0;

export const Move: operations = MoveFrom | MoveTo; // 192

export const Update: operations = Write | Style | Copy | Resize | SetRenderer | SetParser | SetPolicy; // 7936

export const InsertRows: operations = InsertRowsAbove | InsertRowsBelow; // 12

export const InsertCols: operations = InsertColsLeft | InsertColsRight; // 48

export const Add: operations = InsertRows | InsertCols; // 60

export const Delete: operations = RemoveRows | RemoveCols; // 3

export const ReadOnly: operations = Update | Delete | Add | Move; //

export const hasOperation = (operation: operations | undefined, flag: operations) => {
  if (operation === undefined) {
    return false;
  }
  return (operation & flag) === flag;
};

// Don't use this function in production
export const debugOperations = (prevention: operations | undefined) => {
  const operations: string[] = [];
  if (hasOperation(prevention, RemoveRows)) {
    operations.push('RemoveRow');
  }
  if (hasOperation(prevention, RemoveCols)) {
    operations.push('RemoveCol');
  }
  if (hasOperation(prevention, InsertRowsAbove)) {
    operations.push('InsertRowAbove');
  }
  if (hasOperation(prevention, InsertRowsBelow)) {
    operations.push('InsertRowBelow');
  }
  if (hasOperation(prevention, InsertColsLeft)) {
    operations.push('InsertColLeft');
  }
  if (hasOperation(prevention, InsertColsRight)) {
    operations.push('InsertColRight');
  }
  if (hasOperation(prevention, MoveFrom)) {
    operations.push('MoveFrom');
  }
  if (hasOperation(prevention, MoveTo)) {
    operations.push('MoveTo');
  }
  if (hasOperation(prevention, Write)) {
    operations.push('Write');
  }
  if (hasOperation(prevention, Style)) {
    operations.push('Style');
  }
  if (hasOperation(prevention, Resize)) {
    operations.push('Resize');
  }
  if (hasOperation(prevention, SetRenderer)) {
    operations.push('SetRenderer');
  }
  if (hasOperation(prevention, SetParser)) {
    operations.push('SetParser');
  }
  return operations;
};
