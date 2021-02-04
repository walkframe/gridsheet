import React from "react";
import { useDispatch, useSelector } from 'react-redux';
import { n2a } from "../api/converters";
import { between } from "../api/arrays";
import { RootState } from "../store";
import {
  InsideState,
  setCellsOption,
  setCellOption,
  drag,
  selectCols
} from "../store/inside";

import { DUMMY_IMG } from "../constants";

import { OutsideState, setContextMenuPosition } from "../store/outside";

type Props = {
  x: number;
};

export const HorizontalHeaderCell: React.FC<Props> = React.memo(({
  x,
}) => {
  const dispatch = useDispatch();
  const colId = n2a(x + 1);

  const {
    headerHeight,
    defaultWidth,
    stickyHeaders,
  } = useSelector<RootState, OutsideState>(state => state["outside"]);
  const {
    matrix,
    choosing,
    cellsOption,
    selectingZone,
    horizontalHeadersSelecting,
  } = useSelector<RootState, InsideState>(
    state => state["inside"],
  );
  const colOption = cellsOption[colId] || {};
  const width = colOption.width || defaultWidth;
  const numRows = matrix.length;
  return (<th
    className={`
      horizontal
      ${stickyHeaders === "both" || stickyHeaders === "horizontal" ? "sticky" : ""}
      ${choosing[1] === x ? "choosing" : ""} 
      ${between([selectingZone[1], selectingZone[3]], x) ? horizontalHeadersSelecting ? "header-selecting" : "selecting" : ""}`}
    draggable
    onContextMenu={(e) => {
      e.preventDefault();
      dispatch(setContextMenuPosition([e.pageY, e.pageX]));
      return false;
    }}
    onClick={(e) => {
      let startX = e.shiftKey ? selectingZone[1] : x;
      if (startX === -1) {
        startX = choosing[1];
      }
      dispatch(selectCols({range: [startX, x], numRows}));
      dispatch(setContextMenuPosition([-1, -1]));
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
        if (typeof colOption.width === "undefined" && width === parseInt(defaultWidth)) {
          return;
        }
        dispatch(setCellOption({ cell: colId, option: {... colOption, width: `${width}px`}}));
      }}
    >{ colOption.label || colId }
    </div>
  </th>);
});
