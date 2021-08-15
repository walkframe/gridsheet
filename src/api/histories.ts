import {
  PositionType,
  OperationType,
  ZoneType,
  HistoryType,
  StoreType,
} from "../types";
import {
  makeSequence,
  cropMatrix,
  writeMatrix,
  slideArea,
  spreadMatrix,
  matrixShape,
  applyFlattened,
  inverseFlattened,
  stringifyMatrix,
} from "../api/arrays";

export const pushHistory = (
  history: HistoryType,
  operation: OperationType
): HistoryType => {
  history = { ...history };
  const operations = [...history.operations];
  operations.splice(history.index + 1, operations.length);
  operations.push({ ...operation });
  history.index++;
  if (operations.length > history.size) {
    operations.splice(0, 1);
    history.index--;
  }
  return { ...history, operations };
};

export const undoCopy = (
  store: StoreType,
  { dst, src, before }: OperationType
): StoreType => {
  const { renderers, parsers, cellsOption } = store;
  let matrix = [...store.matrix];
  const [top, left] = dst;
  const [h, w] = matrixShape(before);
  const selectingZone: ZoneType =
    h === 1 && w === 1
      ? [-1, -1, -1, -1]
      : [top, left, top + h - 1, left + w - 1];
  
  before = stringifyMatrix(top, left, before, cellsOption, renderers);
  matrix = writeMatrix(top, left, before, matrix, cellsOption, parsers);

  return {
    ...store,
    matrix,
    selectingZone,
    choosing: [top, left],
    copyingZone: src,
    cutting: false,
  };
};

export const redoCopy = (
  store: StoreType,
  { src, dst, after }: OperationType
): StoreType => {
  const { renderers, parsers, cellsOption } = store;
  const [y, x] = dst;
  const choosing = [y, x] as PositionType;
  const [h, w] = matrixShape(after);
  const selectingZone: ZoneType =
    h === 1 && w === 1 ? [-1, -1, -1, -1] : [y, x, y + h - 1, x + w - 1];
  const copyingZone = [-1, -1, -1, -1] as ZoneType;
  //after = stringifyMatrix(y, x, after, cellsOption, renderers);
  const matrix = writeMatrix(y, x, after, store.matrix, cellsOption, parsers);
  return {
    ...store,
    matrix,
    selectingZone,
    copyingZone,
    choosing,
  };
};

export const undoCut = (
  store: StoreType,
  { dst, src, before, after }: OperationType
): StoreType => {
  const { renderers, parsers, cellsOption } = store;
  let matrix = [...store.matrix];
  const [top, left] = dst;
  const [h, w] = matrixShape(before);
  const selectingZone: ZoneType =
    h === 1 && w === 1
      ? [-1, -1, -1, -1]
      : [top, left, top + h - 1, left + w - 1];

  before = stringifyMatrix(top, left, before, cellsOption, renderers);
  matrix = writeMatrix(top, left, before, matrix, cellsOption, parsers);

  const [y, x] = src;
  matrix = writeMatrix(y, x, cropMatrix(after, slideArea(src, -y, -x)), matrix, cellsOption, parsers);

  return {
    ...store,
    matrix,
    selectingZone,
    choosing: [top, left],
    copyingZone: src,
    cutting: true,
  };
};

export const redoCut = (
  store: StoreType,
  { src, dst, after }: OperationType
): StoreType => {
  const { renderers, parsers, cellsOption } = store;
  const [y, x] = dst;
  const choosing = [y, x] as PositionType;
  const [h, w] = matrixShape(after);
  const selectingZone: ZoneType =
    h === 1 && w === 1 ? [-1, -1, -1, -1] : [y, x, y + h - 1, x + w - 1];
  const copyingZone = [-1, -1, -1, -1] as ZoneType;
  let matrix = writeMatrix(y, x, after, store.matrix, cellsOption, parsers);
  const [top, left, bottom, right] = src;
  const blank = spreadMatrix([[""]], bottom - top, right - left);
  //after = stringifyMatrix(y, x, after, cellsOption, renderers);
  matrix = writeMatrix(top, left, blank, matrix, cellsOption, parsers);
  matrix = writeMatrix(y, x, after, matrix, cellsOption, parsers);

  return {
    ...store,
    matrix,
    selectingZone,
    copyingZone,
    choosing,
  };
};

export const undoWrite = (
  store: StoreType,
  { dst, src, before }: OperationType
): StoreType => {
  const { renderers, parsers, cellsOption } = store;
  let matrix = [...store.matrix];
  const [top, left] = dst;
  const [h, w] = matrixShape(before);
  const selectingZone: ZoneType =
    h === 1 && w === 1
      ? [-1, -1, -1, -1]
      : [top, left, top + h - 1, left + w - 1];
  before = stringifyMatrix(top, left, before, cellsOption, renderers);
  matrix = writeMatrix(top, left, before, matrix, cellsOption, parsers);
  return {
    ...store,
    matrix,
    selectingZone,
    choosing: [top, left],
    cutting: false,
    copyingZone: [-1, -1, -1, -1],
  };
};

export const redoWrite = (
  store: StoreType,
  { src, dst, after }: OperationType
): StoreType => {
  const { renderers, parsers, cellsOption } = store;
  const [y, x] = dst;
  const choosing = [y, x] as PositionType;
  const [h, w] = matrixShape(after);
  const selectingZone: ZoneType =
    h === 1 && w === 1 ? [-1, -1, -1, -1] : [y, x, y + h - 1, x + w - 1];
  const copyingZone = [-1, -1, -1, -1] as ZoneType;
  after = stringifyMatrix(y, x, after, cellsOption, renderers);
  const matrix = writeMatrix(y, x, after, store.matrix, cellsOption, parsers);
  return {
    ...store,
    matrix,
    selectingZone,
    copyingZone,
    choosing,
  };
};

export const undoAddRows = (
  store: StoreType,
  { dst, options }: OperationType
): StoreType => {
  let matrix = [...store.matrix];
  const [top, _left, bottom] = [...dst];
  matrix.splice(top, bottom - top + 1);
  return {
    ...store,
    matrix: [...matrix],
    cellsOption: applyFlattened(
      store.cellsOption,
      inverseFlattened(options || {})
    ),
  };
};

export const redoAddRows = (
  store: StoreType,
  { dst, options }: OperationType
): StoreType => {
  let matrix = [...store.matrix];
  const [top, left, bottom, right] = [...dst];
  const width = right - left + 1;
  const blanks = makeSequence(0, bottom - top + 1).map(() =>
    makeSequence(0, width).map(() => "")
  );
  matrix.splice(top, 0, ...blanks);
  return {
    ...store,
    matrix: [...matrix],
    cellsOption: applyFlattened(store.cellsOption, options || {}),
  };
};

export const undoAddCols = (
  store: StoreType,
  { dst, options }: OperationType
): StoreType => {
  let matrix = [...store.matrix];
  const [_top, left, _, right] = [...dst];
  matrix = [...store.matrix].map((cols) => {
    cols = [...cols];
    cols.splice(left, right - left + 1);
    return cols;
  });
  return {
    ...store,
    matrix: [...matrix],
    cellsOption: applyFlattened(
      store.cellsOption,
      inverseFlattened(options || {})
    ),
  };
};

export const redoAddCols = (
  store: StoreType,
  { dst, options }: OperationType
): StoreType => {
  let matrix = [...store.matrix];
  const [_top, left, _, right] = [...dst];
  matrix = [...store.matrix].map((cols) => {
    const blanks = makeSequence(0, right - left + 1).map(() => "");
    cols = [...cols];
    cols.splice(left, 0, ...blanks);
    return cols;
  });
  return {
    ...store,
    matrix: [...matrix],
    cellsOption: applyFlattened(store.cellsOption, options || {}),
  };
};

export const undoRemoveRows = (
  store: StoreType,
  { src, before, options }: OperationType
): StoreType => {
  let matrix = [...store.matrix];
  const [top, left] = [...src];
  matrix.splice(top, 0, ...before);
  return {
    ...store,
    matrix,
    cellsOption: applyFlattened(
      store.cellsOption,
      inverseFlattened(options || {})
    ),
  };
};

export const redoRemoveRows = (
  store: StoreType,
  { src, options }: OperationType
): StoreType => {
  let matrix = [...store.matrix];
  const [top, left, bottom] = [...src];
  matrix.splice(top, bottom - top + 1);
  return {
    ...store,
    matrix: [...matrix],
    cellsOption: applyFlattened(store.cellsOption, options || {}),
  };
};

export const undoRemoveCols = (
  store: StoreType,
  { src, before, options }: OperationType
): StoreType => {
  let matrix = [...store.matrix];
  const [_top, left] = [...src];
  matrix = [...store.matrix].map((cols, i) => {
    cols = [...cols];
    cols.splice(left, 0, ...before[i]);
    return cols;
  });
  return {
    ...store,
    matrix,
    cellsOption: applyFlattened(
      store.cellsOption,
      inverseFlattened(options || {})
    ),
  };
};

export const redoRemoveCols = (
  store: StoreType,
  { src, options }: OperationType
): StoreType => {
  let matrix = [...store.matrix];
  const [_top, left, _, right] = [...src];
  matrix = [...store.matrix].map((cols) => {
    cols = [...cols];
    cols.splice(left, right - left + 1);
    return cols;
  });
  return {
    ...store,
    matrix: [...matrix],
    cellsOption: applyFlattened(store.cellsOption, options || {}),
  };
};

export const undoStyling = (
  store: StoreType,
  { options }: OperationType
): StoreType => {
  return {
    ...store,
    cellsOption: applyFlattened(
      store.cellsOption,
      inverseFlattened(options || {})
    ),
  };
};

export const redoStyling = (
  store: StoreType,
  { options }: OperationType
): StoreType => {
  return {
    ...store,
    cellsOption: applyFlattened(store.cellsOption, options || {}),
  };
};
