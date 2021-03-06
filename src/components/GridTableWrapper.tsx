import React from "react";

import { GridTable } from "./GridTable";
import { Context } from "../store";

export const GridTableWrapper: React.FC = React.memo(() => {
  const { store, dispatch } = React.useContext(Context);
  const { matrix } = store;
  return <GridTable numRows={matrix.length} numCols={matrix[0]?.length || 0} />;
});
