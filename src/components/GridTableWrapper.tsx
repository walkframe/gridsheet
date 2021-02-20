import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { InsideState } from "../types";

import { GridTable } from "./GridTable";

export const GridTableWrapper: React.FC = React.memo(() => {
  const { matrix } = useSelector<RootState, InsideState>(
    (state) => state["inside"]
  );

  return <GridTable numRows={matrix.length} numCols={matrix[0]?.length || 0} />;
});
