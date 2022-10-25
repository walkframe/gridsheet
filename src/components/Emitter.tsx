import React from "react";
import {
  VariableSizeGrid as Grid,
  VariableSizeList as List,
} from "react-window";

import { Context } from "../store";
import { FeedbackType, FeedbackTypeForMatrix } from "../types";

type Props = {
  onChange?: FeedbackType;
  onSelect?: FeedbackType;
};

export const Emitter: React.FC<Props> = ({ onChange, onSelect }) => {
  const { store, dispatch } = React.useContext(Context);
  const {
    choosing: pointing,
    selectingZone: zone,
    table,
    tableInitialized,
  } = store;

  React.useEffect(() => {
    rerenderCells({
      ...store,
      rows: [0, table.getNumRows()],
      cols: [0, table.getNumCols()],
    });
  }, [table]);

  React.useEffect(() => {
    tableInitialized &&
      table &&
      onChange &&
      onChange(table, {
        pointing,
        selectingFrom: { y: zone.startY, x: zone.startX },
        selectingTo: { y: zone.endY, x: zone.endX },
      });
  }, [table]);

  React.useEffect(() => {
    onSelect &&
      onSelect(table, {
        pointing,
        selectingFrom: { y: zone.startY, x: zone.startX },
        selectingTo: { y: zone.endY, x: zone.endX },
      });
  }, [pointing, zone]);
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
