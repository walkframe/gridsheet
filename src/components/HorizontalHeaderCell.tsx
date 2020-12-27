import React from "react";
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import styled from "styled-components";
import {convertNtoA} from "../api/converters";
import { draggingToArea, among, shape, between } from "../api/arrays";
import {RootState, DispatchType } from "../store";
import {
  blur,
  choose,
  InsideState, select, drag,
  selectCols, selectRows,
  setEditingCell,
  undo, redo,
} from "../store/inside";

import {DUMMY_IMG} from "../constants";
import {
  AreaType,
  RowInfoType,
  ColInfoType,
  RowOptionType,
  ColOptionType,
  DraggingType,
} from "../types";

import {OutsideState, setColInfo} from "../store/outside";

interface Props {
  x: number;
  defaultWidth: string;
  headerHeight: string;
  colOption: ColOptionType;
};

export const HorizontalHeaderCell: React.FC<Props> = React.memo(({
  x,
  defaultWidth,
  headerHeight,
  colOption,
}) => {
  const dispatch = useDispatch();
  const colId = convertNtoA(x + 1);

  const { colInfo, numRows, numCols } = useSelector<RootState, OutsideState>(state => state["outside"]);
  const {
    choosing,
    selecting,
    horizontalHeadersSelecting,
  } = useSelector<RootState, InsideState>(
    state => state["inside"],
    (current, old) => {
      if (old.reactions[colId]) {
        return false;
      }
      if (current.reactions[colId]) {
        return false;
      }
      return true;
    }
  );
  const width = colOption.width || defaultWidth;
  return (<th
    className={`col-number ${choosing[1] === x ? "choosing" : ""} ${between([selecting[1], selecting[3]], x) ? horizontalHeadersSelecting ? "header-selecting" : "selecting" : ""}`}
    draggable
    onClick={(e) => {
      dispatch(selectCols({range: [x, x], numRows}));
      return false;
    }}
    onDragStart={(e) => {
      e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
      dispatch(selectCols({range: [x, x], numRows}));
      return false;
    }}
    onDragEnter={(e) => {
      dispatch(drag([numRows - 1, x]));
      return false;
    }}
  >
    <div
      className="resizer"
      style={{ width, height: headerHeight }}
      onMouseLeave={(e) => {
        const width = e.currentTarget.clientWidth;
        dispatch(setColInfo({... colInfo, [x]: {... colOption, width: `${width}px`}}));
      }}
    >{ colOption.label || colId }
    </div>
  </th>);
});
