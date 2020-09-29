import {
  MatrixType,
  HistoryType,
  OperationType,
} from "../types";
import { 
  writeMatrix,
  cropMatrix,
  spreadMatrix,
  slideArea,
} from "./arrays";


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

export const undo = (operation: OperationType, matrix: MatrixType): MatrixType => {
  const { command, cutting, position, before, after } = operation;
  switch(command) {
    case "write":
      matrix = writeMatrix(...position, before, matrix);
      if (typeof cutting !== "undefined") {
        const [top, left] = cutting;
        matrix = writeMatrix(top, left, cropMatrix(after, slideArea(cutting, -top, -left)), matrix);
      }
  }
  return matrix;
};

export const redo = (operation: OperationType, matrix: MatrixType): MatrixType => {
  const { command, cutting, position, before, after } = operation;
  switch(command) {
    case "write":
      if (typeof cutting !== "undefined") {
        const [top, left, bottom, right] = cutting;
        const blank = spreadMatrix([[""]], bottom - top, right - left);
        matrix = writeMatrix(top, left, blank, matrix);
      }
      matrix = writeMatrix(...position, after, matrix);
  }
  return matrix;
};