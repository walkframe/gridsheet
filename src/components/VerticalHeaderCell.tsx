import React from "react";
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import styled from "styled-components";
import {convertNtoA} from "../api/converters";
import { draggingToArea, among, shape, between } from "../api/arrays";
import {RootState, DispatchType } from "../store";
import {
  InsideState,
  blur,
  choose,
  select, drag,
  selectCols, selectRows,
  setEditingCell,
  undo, redo,
} from "../store/inside";
import {DUMMY_IMG} from "../constants";
import {
  AreaType,
  CellOptionType,
  DraggingType,
} from "../types";

import {OutsideState, setCellsOption} from "../store/outside";

interface Props {
  y: number;
};

export const VerticalHeaderCell: React.FC<Props> = React.memo(({
  y,
}) => {
  const rowId = `${ y + 1 }`;
  const dispatch = useDispatch();

  const {
    cellsOption,
    numRows,
    numCols,
    defaultHeight,
    headerWidth,
  } = useSelector<RootState, OutsideState>(state => state["outside"]);
  const {
    choosing,
    selecting,
    verticalHeadersSelecting,
  } = useSelector<RootState, InsideState>(
      state => state["inside"],
      (current, old) => {
        if (old.reactions[rowId] || current.reactions[rowId]) {
          return false;
        }
        return true;
      }
  );
  const rowOption = cellsOption[rowId] || {};
  const height = rowOption.height || defaultHeight;

  return (<th
    className={`row-number ${choosing[0] === y ? "choosing" : ""} ${between([selecting[0], selecting[2]], y) ? verticalHeadersSelecting ? "header-selecting" : "selecting" : ""}`}
    onClick={(e) => {
      dispatch(selectRows({range: [y, y], numCols}));
      return false;
    }}
    draggable
    onDragStart={(e) => {
      e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
      dispatch(selectRows({range: [y, y], numCols}));
      return false;
    }}
    onDragEnter={(e) => {
      dispatch(drag([y, numCols - 1]));
      return false;
    }}
  >
    <div
      className="resizer"
      style={{ height, width: headerWidth }}
      onMouseLeave={(e) => {
        const height = e.currentTarget.clientHeight;
        dispatch(setCellsOption({... cellsOption, [rowId]: {... rowOption, height: `${height}px`}}));
      }}
    >
      { rowOption.label ||  rowId }
    </div></th>);
});
