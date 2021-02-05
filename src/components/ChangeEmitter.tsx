import React from "react";
import { useSelector } from "react-redux";

import { Feedback, InsideState } from "../types";

import { RootState } from "../store";
import { matrix2tsv } from "../api/converters";

type Props = {
  onChange: Feedback;
};

export const ChangeEmitter: React.FC<Props> = ({ onChange }) => {
  useSelector<RootState, InsideState>(
    (state) => state["inside"],
    (current, old) => {
      if (old.matrix.length === 0) {
        return false;
      }
      if (matrix2tsv(current.matrix) !== matrix2tsv(old.matrix)) {
        onChange(current.matrix, undefined);
        return false;
      }
      return true;
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
