import React from "react";
import { useSelector } from 'react-redux';

import {
  Feedback,
} from "../types";

import { RootState } from "../store";

import {
  InsideState,
} from "../store/inside";

import {
  OutsideState,
} from "../store/outside";

import {
  matrix2tsv,
} from "../api/converters";

import { Renderer } from "../renderers/core";

type Props = {
  onChange: Feedback,
};

export const ChangeEmitter: React.FC<Props> = ({ onChange }) => {
  useSelector<RootState, InsideState>(
    state => state["inside"],
    (current, old) => {
      if (old.matrix.length === 0) {
        return false;
      }
      if (matrix2tsv(current.matrix, Renderer) !== matrix2tsv(old.matrix, Renderer)) {
        onChange(current.matrix, undefined);
        return false;
      }
      return true;
    }
  );
  useSelector<RootState, OutsideState>(
      state => state["outside"],
      (current, old) => {
        if (JSON.stringify(current.cellsOption) !== JSON.stringify(old.cellsOption)) {
          onChange(undefined, current.cellsOption);
          return false;
        }
        return true;
      }
  );

  return (<></>);
};
