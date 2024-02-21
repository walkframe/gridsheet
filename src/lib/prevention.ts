import { Prevention } from '../types';

export const DeleteRow: Prevention = 0b00000000000000000000000000000000000000000000000000001, // 1
  DeleteCol: Prevention = 0b00000000000000000000000000000000000000000000000000010, // 2
  AddRowAbove: Prevention = 0b00000000000000000000000000000000000000000000000000100, // 4
  AddRowBelow: Prevention = 0b00000000000000000000000000000000000000000000000001000, // 8
  AddColLeft: Prevention = 0b00000000000000000000000000000000000000000000000010000, // 16
  AddColRight: Prevention = 0b00000000000000000000000000000000000000000000000100000, // 32
  MoveFrom: Prevention = 0b00000000000000000000000000000000000000000000001000000, // 64
  MoveTo: Prevention = 0b00000000000000000000000000000000000000000000010000000, // 128
  Write: Prevention = 0b00000000000000000000000000000000000000000000100000000, // 256
  Style: Prevention = 0b00000000000000000000000000000000000000000001000000000, // 512
  Resize: Prevention = 0b00000000000000000000000000000000000000000010000000000, // 1024
  SetRenderer: Prevention = 0b00000000000000000000000000000000000000000100000000000, // 2048
  SetParser: Prevention = 0b00000000000000000000000000000000000000001000000000000; // 4096

export const Move: Prevention = MoveFrom | MoveTo; // 192

export const Update: Prevention = Write | Style | Resize | SetRenderer | SetParser; // 1792

export const AddRow: Prevention = AddRowAbove | AddRowBelow; // 12

export const AddCol: Prevention = AddColLeft | AddColRight; // 48

export const Add: Prevention = AddRow | AddCol; // 60

export const Delete: Prevention = DeleteRow | DeleteCol; // 3

export const ReadOnly: Prevention = Update | Delete | Add | Move; //

export const isPrevented = (prevention: Prevention | undefined, flag: Prevention) => {
  if (prevention === undefined) {
    return false;
  }
  return (prevention & flag) === flag;
};

// Don't use this function in production
export const debugOperations = (prevention: Prevention | undefined) => {
  const preventions: string[] = [];
  if (isPrevented(prevention, DeleteRow)) {
    preventions.push('DeleteRow');
  }
  if (isPrevented(prevention, DeleteCol)) {
    preventions.push('DeleteCol');
  }
  if (isPrevented(prevention, AddRowAbove)) {
    preventions.push('AddRowAbove');
  }
  if (isPrevented(prevention, AddRowBelow)) {
    preventions.push('AddRowBelow');
  }
  if (isPrevented(prevention, AddColLeft)) {
    preventions.push('AddColLeft');
  }
  if (isPrevented(prevention, AddColRight)) {
    preventions.push('AddColRight');
  }
  if (isPrevented(prevention, MoveFrom)) {
    preventions.push('MoveFrom');
  }
  if (isPrevented(prevention, MoveTo)) {
    preventions.push('MoveTo');
  }
  if (isPrevented(prevention, Write)) {
    preventions.push('Write');
  }
  if (isPrevented(prevention, Style)) {
    preventions.push('Style');
  }
  if (isPrevented(prevention, Resize)) {
    preventions.push('Resize');
  }
  if (isPrevented(prevention, SetRenderer)) {
    preventions.push('SetRenderer');
  }
  if (isPrevented(prevention, SetParser)) {
    preventions.push('SetParser');
  }
  return preventions;
};
