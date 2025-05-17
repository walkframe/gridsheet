import { OperationType } from '../types';

export const DeleteRow: OperationType = 0b00000000000000000000000000000000000000000000000000001, // 1
  DeleteCol: OperationType = 0b00000000000000000000000000000000000000000000000000010, // 2
  AddRowAbove: OperationType = 0b00000000000000000000000000000000000000000000000000100, // 4
  AddRowBelow: OperationType = 0b00000000000000000000000000000000000000000000000001000, // 8
  AddColLeft: OperationType = 0b00000000000000000000000000000000000000000000000010000, // 16
  AddColRight: OperationType = 0b00000000000000000000000000000000000000000000000100000, // 32
  MoveFrom: OperationType = 0b00000000000000000000000000000000000000000000001000000, // 64
  MoveTo: OperationType = 0b00000000000000000000000000000000000000000000010000000, // 128
  Write: OperationType = 0b00000000000000000000000000000000000000000000100000000, // 256
  Style: OperationType = 0b00000000000000000000000000000000000000000001000000000, // 512
  Copy: OperationType = 0b00000000000000000000000000000000000000010000000000000, // 8192
  Resize: OperationType = 0b00000000000000000000000000000000000000000010000000000, // 1024
  SetRenderer: OperationType = 0b00000000000000000000000000000000000000000100000000000, // 2048
  SetParser: OperationType = 0b00000000000000000000000000000000000000001000000000000, // 4096
  SetPolicy: OperationType = 0b00000000000000000000000000000000000000100000000000000 // 16384
;

export const NoOperation: OperationType = 0;

export const Move: OperationType = MoveFrom | MoveTo; // 192

export const Update: OperationType = Write | Style | Copy | Resize | SetRenderer | SetParser | SetPolicy; // 7936

export const AddRow: OperationType = AddRowAbove | AddRowBelow; // 12

export const AddCol: OperationType = AddColLeft | AddColRight; // 48

export const Add: OperationType = AddRow | AddCol; // 60

export const Delete: OperationType = DeleteRow | DeleteCol; // 3

export const ReadOnly: OperationType = Update | Delete | Add | Move; //

export const hasOperation = (operation: OperationType | undefined, flag: OperationType) => {
  if (operation === undefined) {
    return false;
  }
  return (operation & flag) > NoOperation;
};

// Don't use this function in production
export const debugOperations = (prevention: OperationType | undefined) => {
  const operations: string[] = [];
  if (hasOperation(prevention, DeleteRow)) {
    operations.push('DeleteRow');
  }
  if (hasOperation(prevention, DeleteCol)) {
    operations.push('DeleteCol');
  }
  if (hasOperation(prevention, AddRowAbove)) {
    operations.push('AddRowAbove');
  }
  if (hasOperation(prevention, AddRowBelow)) {
    operations.push('AddRowBelow');
  }
  if (hasOperation(prevention, AddColLeft)) {
    operations.push('AddColLeft');
  }
  if (hasOperation(prevention, AddColRight)) {
    operations.push('AddColRight');
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
