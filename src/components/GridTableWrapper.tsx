import React from "react";
import { useSelector } from 'react-redux';
import { RootState } from "../store";
import { InsideState } from "../types";

import {
  GridTable,
} from "./GridTable";

type Props = {
  clipboardRef: React.RefObject<HTMLTextAreaElement>;
}

export const GridTableWrapper: React.FC<Props> = React.memo(({
  clipboardRef,
}) => {
  const {
    matrix,
  } = useSelector<RootState, InsideState>(
    state => state["inside"],
  );

  return (<GridTable 
    clipboardRef={clipboardRef}
    numRows={matrix.length}
    numCols={matrix[0]?.length || 0}
  />);
});
