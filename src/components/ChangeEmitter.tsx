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
  convertArrayToTSV,
} from "../api/converters";

import { Renderer } from "../renderers/core";

interface Props {
  onChange: Feedback,
};

export const ChangeEmitter: React.FC<Props> = ({ onChange }) => {
  useSelector<RootState, InsideState>(
    state => state["inside"],
    (current, old) => {
      if (convertArrayToTSV(current.matrix, Renderer) !== convertArrayToTSV(old.matrix, Renderer)) {
        onChange(current.matrix, undefined);
        return false;
      }
      return true;
    }
  );
  useSelector<RootState, OutsideState>(
      state => state["outside"],
      (current, old) => {
        onChange(undefined, current.cellsOption);
        return true;
      }
  );

  return (<></>);
};



