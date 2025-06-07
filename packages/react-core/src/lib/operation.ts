import { OperationType as operations } from '../types';

export const DeleteRow: operations = 0b00000000000000000000000000000000000000000000000000001, // 1
  DeleteCol: operations = 0b00000000000000000000000000000000000000000000000000010, // 2
  AddRowAbove: operations = 0b00000000000000000000000000000000000000000000000000100, // 4
  AddRowBelow: operations = 0b00000000000000000000000000000000000000000000000001000, // 8
  AddColLeft: operations = 0b00000000000000000000000000000000000000000000000010000, // 16
  AddColRight: operations = 0b00000000000000000000000000000000000000000000000100000, // 32
  MoveFrom: operations = 0b00000000000000000000000000000000000000000000001000000, // 64
  MoveTo: operations = 0b00000000000000000000000000000000000000000000010000000, // 128
  Write: operations = 0b00000000000000000000000000000000000000000000100000000, // 256
  Style: operations = 0b00000000000000000000000000000000000000000001000000000, // 512
  Copy: operations = 0b00000000000000000000000000000000000000010000000000000, // 8192
  Resize: operations = 0b00000000000000000000000000000000000000000010000000000, // 1024
  SetRenderer: operations = 0b00000000000000000000000000000000000000000100000000000, // 2048
  SetParser: operations = 0b00000000000000000000000000000000000000001000000000000, // 4096
  SetPolicy: operations = 0b00000000000000000000000000000000000000100000000000000; // 16384

export const NoOperation: operations = 0;

export const Move: operations = MoveFrom | MoveTo; // 192

export const Update: operations = Write | Style | Copy | Resize | SetRenderer | SetParser | SetPolicy; // 7936

export const AddRow: operations = AddRowAbove | AddRowBelow; // 12

export const AddCol: operations = AddColLeft | AddColRight; // 48

export const Add: operations = AddRow | AddCol; // 60

export const Delete: operations = DeleteRow | DeleteCol; // 3

export const ReadOnly: operations = Update | Delete | Add | Move; //

export const hasOperation = (operation: operations | undefined, flag: operations) => {
  if (operation === undefined) {
    return false;
  }
  return (operation & flag) > NoOperation;
};

// Don't use this function in production
export const debugOperations = (prevention: operations | undefined) => {
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
