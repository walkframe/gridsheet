import React from "react";
import {
  VariableSizeGrid as Grid,
  VariableSizeList as List,
} from "react-window";

import { Context } from "../store";
import { Feedback, FeedbackForMatrix } from "../types";

import { UserTable, Table } from "../api/tables";

type Props = {
  onChange?: Feedback;
  onChangeDiff?: Feedback;
  onChangeDiffNumMatrix?: FeedbackForMatrix;
  onSelect?: Feedback;
};

export const Emitter: React.FC<Props> = ({ onChange, onChangeDiff, onChangeDiffNumMatrix, onSelect }) => {
  const { store, dispatch } = React.useContext(Context);
  const {
    choosing: pointing, selectingZone: zone,
    table,
    history,
  } = store;

  React.useEffect(() => {
    rerenderCells({
      ...store,
      rows: [0, table.numRows()],
      cols: [0, table.numCols()],
    });
  }, [table]);

  React.useEffect(() => {
    onChange && onChange(table as UserTable, {pointing, selectingFrom: [zone[0], zone[1]], selectingTo: [zone[2], zone[3]]});
  }, [onChange, table]);
  React.useEffect(() => {
    if (onChangeDiff == null) {
      return;
    }
    const { operations } = history;
    let diffs: Table[] = [];
    if (history.direction === "BACKWARD") {
      const operation = operations[history.index + 1];
      if (operation == null) {
        return;
      }
      if (operation.command === "SET_TABLE") {
        diffs = operation.before as Table[];
      }
    } else {
      const operation = operations[history.index];
      if (operation == null) {
        return;
      }
      if (operation.command === "SET_TABLE") {
        diffs = operation.after as Table[];
      }
    }
    onChangeDiff(table.joinDiffs(diffs) as UserTable, {pointing, selectingFrom: [zone[0], zone[1]], selectingTo: [zone[2], zone[3]]});
  }, [onChangeDiff, history]);

  React.useEffect(() => {
    if (onChangeDiffNumMatrix == null) {
      return;
    }
    const { operations } = history;
    if (history.direction === "BACKWARD") {
      const operation = operations[history.index + 1];
      if (operation == null) {
        return;
      }
      if (operation.command === "ADD_ROWS") {
        const {y, numRows} = operation.after as { y: number, numRows: number};
        onChangeDiffNumMatrix({y: y, num: -numRows});
      }
      if (operation.command === "REMOVE_ROWS") {
        const {y, numRows} = operation.after as { y: number, numRows: number};
        onChangeDiffNumMatrix({y: y, num: numRows});
      }
      if (operation.command === "ADD_COLS") {
        const {x, numCols} = operation.after as { x: number, numCols: number};
        onChangeDiffNumMatrix({x: x, num: -numCols});
      }
      if (operation.command === "REMOVE_COLS") {
        const {x, numCols} = operation.after as { x: number, numCols: number};
        onChangeDiffNumMatrix({x: x, num: numCols});
      }
    } else {
      const operation = operations[history.index];
      if (operation == null) {
        return;
      }
      if (operation.command === "ADD_ROWS") {
        const {y, numRows} = operation.after as { y: number, numRows: number};
        onChangeDiffNumMatrix({y: y, num: numRows});
      }
      if (operation.command === "REMOVE_ROWS") {
        const {y, numRows} = operation.after as { y: number, numRows: number};
        onChangeDiffNumMatrix({y: y, num: -numRows});
      }
      if (operation.command === "ADD_COLS") {
        const {x, numCols} = operation.after as { x: number, numCols: number};
        onChangeDiffNumMatrix({x: x, num: numCols});
      }
      if (operation.command === "REMOVE_COLS") {
        const {x, numCols} = operation.after as { x: number, numCols: number};
        onChangeDiffNumMatrix({x: x, num: -numCols});
      }
    }
    
  }, [onChangeDiffNumMatrix, history]);

  React.useEffect(() => {
    onSelect && onSelect(table as UserTable, {pointing, selectingFrom: [zone[0], zone[1]], selectingTo: [zone[2], zone[3]]});
  }, [onSelect, pointing, zone]);
  return <></>;
};

export const rerenderCells = ({
  rows,
  cols,
  gridRef, 
  verticalHeadersRef,
  horizontalHeadersRef,
}: {
  rows?: [number, number];
  cols?: [number, number];
  gridRef: React.MutableRefObject<Grid | null>;
  verticalHeadersRef: React.MutableRefObject<List | null>;
  horizontalHeadersRef: React.MutableRefObject<List | null>;
}) => {
  const [startY, endY] = rows || [0, 0];
  for (let index = startY; index <= endY; index++) {
    verticalHeadersRef.current?.resetAfterIndex(index);
    gridRef.current?.resetAfterRowIndex(index);
  }
  const [startX, endX] = cols || [0, 0];
  for (let index = startX; index <= endX; index++) {
    horizontalHeadersRef.current?.resetAfterIndex(index);
    gridRef.current?.resetAfterColumnIndex(index);
  }
};
