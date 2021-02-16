import React from "react";
import { useSelector } from "react-redux";

import { Context } from "./GridSheet";
import { Feedback, InsideState } from "../types";

import { RootState } from "../store";
import { matrix2tsv } from "../api/converters";
import { matrixShape, rerenderCells } from "../api/arrays";

type Props = {
  onChange: Feedback;
};

export const ChangeEmitter: React.FC<Props> = ({ onChange }) => {
  const refs = React.useContext(Context);
  useSelector<RootState, InsideState>(
    (state) => state["inside"],
    (current, old) => {
      if (old.matrix.length === 0) {
        return false;
      }
      if (matrix2tsv(current.matrix) !== matrix2tsv(old.matrix)) {
        onChange(current.matrix, undefined);
      }
      const [currentHeight, currentWidth] = matrixShape(current.matrix);
      const [oldHeight, oldWidth] = matrixShape(old.matrix);
      if (currentHeight !== oldHeight) {
        rerenderCells({
          ...refs,
          rows: [0, currentHeight > oldHeight ? currentHeight : oldHeight],
        });
      }
      if (currentWidth !== oldWidth) {
        rerenderCells({
          ...refs,
          cols: [0, currentWidth > oldWidth ? currentWidth : oldWidth],
        });
      }
      return false;
    }
  );
  useSelector<RootState, InsideState>(
    (state) => state["inside"],
    (current, old) => {
      if (
        JSON.stringify(current.cellsOption) !== JSON.stringify(old.cellsOption)
      ) {
        onChange(undefined, current.cellsOption);
        return false;
      }
      return true;
    }
  );

  return <></>;
};
