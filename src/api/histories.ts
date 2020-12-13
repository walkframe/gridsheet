import {
  MatrixType,
  HistoryType,
  OperationType,
} from "../types";

export const pushHistory = (history: HistoryType, operation: OperationType): HistoryType => {
  history = {... history};
  const operations = [... history.operations];
  operations.splice(history.index + 1, operations.length);
  operations.push({... operation});
  history.index++;
  if (operations.length > history.size) {
    operations.splice(0, 1);
    history.index--;
  }
  return {... history, operations};
};
