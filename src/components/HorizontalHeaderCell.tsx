import React from "react";
import { useDispatch, useSelector } from 'react-redux';
import {convertNtoA} from "../api/converters";
import { between } from "../api/arrays";
import {RootState } from "../store";
import {

  InsideState, select, drag,
  selectCols
} from "../store/inside";

import {DUMMY_IMG} from "../constants";

import {OutsideState, setCellsOption} from "../store/outside";

interface Props {
  x: number;
};

export const HorizontalHeaderCell: React.FC<Props> = React.memo(({
  x,
}) => {
  const dispatch = useDispatch();
  const colId = convertNtoA(x + 1);

  const {
    cellsOption,
    numRows,
    headerHeight,
    defaultWidth,
  } = useSelector<RootState, OutsideState>(state => state["outside"]);
  const {
    choosing,
    selecting,
    horizontalHeadersSelecting,
  } = useSelector<RootState, InsideState>(
    state => state["inside"],
    (current, old) => {
      if (old.reactions[colId] || current.reactions[colId]) {
        return false;
      }
      return true;
    }
  );
  const colOption = cellsOption[colId] || {};
  const width = colOption.width || defaultWidth;
  return (<th
    className={`col-number ${choosing[1] === x ? "choosing" : ""} ${between([selecting[1], selecting[3]], x) ? horizontalHeadersSelecting ? "header-selecting" : "selecting" : ""}`}
    draggable
    onClick={(e) => {
      let startX = e.shiftKey ? selecting[1] : x;
      if (startX === -1) {
        startX = choosing[1];
      }
      dispatch(selectCols({range: [startX, x], numRows}));
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
        dispatch(setCellsOption({... cellsOption, [colId]: {... colOption, width: `${width}px`}}));
      }}
    >{ colOption.label || colId }
    </div>
  </th>);
});
