import React from "react";

import { Context } from "../store";
import { Feedback } from "../types";

import { rerenderCells } from "../api/arrays";

type Props = {
  onChange?: Feedback;
};

export const ChangeEmitter: React.FC<Props> = ({ onChange }) => {
  const { store, dispatch } = React.useContext(Context);
  const { matrix, cellsOption } = store;
  React.useEffect(() => {
    rerenderCells({
      ...store,
      rows: [0, matrix.length],
      cols: [0, matrix[0]?.length || 0],
    });
  }, [matrix, cellsOption]);
  React.useEffect(() => {
    onChange && onChange(matrix, cellsOption);
  }, [onChange, matrix, cellsOption]);

  return <></>;
};
