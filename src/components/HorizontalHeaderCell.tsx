import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { n2a } from "../api/converters";
import { between } from "../api/arrays";
import { RootState } from "../store";
import { setCellOption, drag, selectCols } from "../store/inside";
import { InsideState, OutsideState } from "../types";
import { DUMMY_IMG, DEFAULT_WIDTH } from "../constants";
import { setContextMenuPosition } from "../store/outside";

type Props = {
  index: number;
  style: React.CSSProperties;
};

export const HorizontalHeaderCell: React.FC<Props> = React.memo(
  ({ index: x, style: outerStyle }) => {
    const dispatch = useDispatch();
    const colId = n2a(x + 1);

    const { headerHeight, stickyHeaders } = useSelector<
      RootState,
      OutsideState
    >((state) => state["outside"]);
    const {
      matrix,
      choosing,
      cellsOption,
      selectingZone,
      horizontalHeadersSelecting,
    } = useSelector<RootState, InsideState>((state) => state["inside"]);

    const defaultWidth = cellsOption.default?.width || DEFAULT_WIDTH;
    const colOption = cellsOption[colId] || {};
    const width = colOption.width || defaultWidth;
    const numRows = matrix.length;
    return (
      <div
        style={outerStyle}
        className={`
      header horizontal
      ${
        stickyHeaders === "both" || stickyHeaders === "horizontal"
          ? "sticky"
          : ""
      }
      ${choosing[1] === x ? "choosing" : ""} 
      ${
        between([selectingZone[1], selectingZone[3]], x)
          ? horizontalHeadersSelecting
            ? "header-selecting"
            : "selecting"
          : ""
      }`}
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
          dispatch(selectCols({ range: [startX, x], numRows }));
          dispatch(setContextMenuPosition([-1, -1]));
          return false;
        }}
        onDragStart={(e) => {
          e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
          dispatch(selectCols({ range: [x, x], numRows }));
          return false;
        }}
        onDragEnter={() => {
          dispatch(drag([numRows - 1, x]));
          return false;
        }}
      >
        <div
          className="resizer"
          style={{ width, height: headerHeight }}
          onMouseLeave={(e) => {
            const width = e.currentTarget.clientWidth;
            if (
              typeof colOption.width === "undefined" &&
              width === defaultWidth
            ) {
              return;
            }
            dispatch(
              setCellOption({
                cell: colId,
                option: { ...colOption, width },
              })
            );
          }}
        >
          {colOption.label || colId}
        </div>
      </div>
    );
  }
);
