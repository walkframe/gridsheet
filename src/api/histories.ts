import {
  DataType,
  HistoryType,
  OperationType,
} from "../types";
import { writeMatrix } from "./matrix";


export class History implements HistoryType {
  public index = -1;
  public operations: OperationType[] = [];

  constructor (private size: number = 10) {
    this.size = size;
  }

  public next() {
    if (this.operations.length > this.index + 1) {
      return this.operations[++this.index];
    }
  }
  public prev() {
    if (this.index >= 0) {
      return this.operations[this.index--];
    }
  }
  public append(operation: OperationType) {
    this.operations.splice(this.index + 1, this.operations.length);
    this.operations.push(operation);
    this.index = this.operations.length - 1;
    if (this.operations.length > this.size) {
      this.operations.splice(0, 1);
      this.index--;
    }
  }
};

export const undo = (operation: OperationType, matrix: DataType): DataType => {
  const { command, src, dst, before, after } = operation;
  switch(command) {
    case "replace":
      matrix = writeMatrix(...dst, before, matrix);
  }
  return matrix;
};

export const redo = (operation: OperationType, matrix: DataType): DataType => {
  const { command, src, dst, before, after } = operation;
  switch(command) {
    case "replace":
      matrix = writeMatrix(...dst, after, matrix);
  }
  return matrix;
};