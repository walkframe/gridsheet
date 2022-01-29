import React from "react";
import {
  VariableSizeGrid as Grid,
  VariableSizeList as List,
} from "react-window";

import { Context } from "../store";
import { Feedback } from "../types";

import { UserTable, Table } from "../api/tables";

type Props = {
  onChange?: Feedback;
  onChangeDiff?: Feedback;
  onSelect?: Feedback;
};

export const Emitter: React.FC<Props> = ({ onChange, onChangeDiff, onSelect }) => {
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
    const { operations } = history;
    const last = operations[operations.length - 1];
    if (onChangeDiff == null || last == null || last.command != "SET_TABLE") {
      return;
    }
    const diff = last.after as UserTable;
    onChangeDiff(diff, {pointing, selectingFrom: [zone[0], zone[1]], selectingTo: [zone[2], zone[3]]});
  }, [onChangeDiff, history]);
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
