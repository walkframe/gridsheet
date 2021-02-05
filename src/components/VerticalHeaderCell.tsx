import React from "react";
import { useDispatch, useSelector } from 'react-redux';
import { between } from "../api/arrays";
import { RootState } from "../store";
import {
  setCellOption,
  drag,
  selectRows,
} from "../store/inside";
import { DUMMY_IMG } from "../constants";
import {
  InsideState,
  OutsideState,
} from "../types";
import { setContextMenuPosition } from "../store/outside";

type Props = {
  y: number;
};

export const VerticalHeaderCell: React.FC<Props> = React.memo(({
  y,
}) => {
  const rowId = `${ y + 1 }`;
  const dispatch = useDispatch();

  const {
    defaultHeight,
    headerWidth,
    stickyHeaders,
  } = useSelector<RootState, OutsideState>(state => state["outside"]);
  const {
    matrix,
    cellsOption,
    choosing,
    selectingZone,
    verticalHeadersSelecting,
  } = useSelector<RootState, InsideState>(
      state => state["inside"],
  );
  const rowOption = cellsOption[rowId] || {};
  const height = rowOption.height || defaultHeight;
  const numCols = matrix[0]?.length || 0;

  return (<th
    className={`
      vertical
      ${stickyHeaders === "both" || stickyHeaders === "vertical" ? "sticky" : ""}
      ${choosing[0] === y ? "choosing" : ""} 
      ${between([selectingZone[0], selectingZone[2]], y) ? verticalHeadersSelecting ? "header-selecting" : "selecting" : ""}`}
    onClick={(e) => {
      let startY = e.shiftKey ? selectingZone[0] : y;
      if (startY === -1) {
        startY = choosing[0];
      }
      dispatch(selectRows({range: [startY, y], numCols}));
      dispatch(setContextMenuPosition([-1, -1]));
      return false;
    }}
    draggable
    onContextMenu={(e) => {
      e.preventDefault();
      dispatch(setContextMenuPosition([e.pageY, e.pageX]));
      return false;
    }}
    onDragStart={(e) => {
      e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
      dispatch(selectRows({range: [y, y], numCols}));
      return false;
    }}
    onDragEnter={() => {
      dispatch(drag([y, numCols - 1]));
      return false;
    }}
  >
    <div
      className="resizer"
      style={{ height, width: headerWidth }}
      onMouseLeave={(e) => {
        const height = e.currentTarget.clientHeight;
        if (typeof rowOption.height === "undefined" && height === parseInt(defaultHeight)) {
          return;
        }
        dispatch(setCellOption({ cell: rowId, option: {... rowOption, height: `${height}px`}}));
      }}
    >
      { rowOption.label ||  rowId }
    </div></th>);
});
