import React from "react";
import { x2c, y2r } from "../lib/converters";
import { zoneToArea, among, zoneShape } from "../lib/structs";
import {
  choose,
  select,
  drag,
  write,
  setEditorRect,
  setContextMenuPosition, setAutofillDraggingTo,
} from "../store/actions";

import { DUMMY_IMG } from "../constants";
import {AreaType, PointType} from "../types";

import { Context } from "../store";
import { FormulaError } from "../formula/evaluator";
import {getAutofillCandidateStyle} from "../lib/autofill";

type Props = {
  y: number;
  x: number;
};

export const Cell: React.FC<Props> = React.memo(
  ({ y, x }) => {
    const rowId = y2r(y);
    const colId = x2c(x);
    const address = `${colId}${rowId}`;
    const { store, dispatch } = React.useContext(Context);

    const cellRef = React.useRef(document.createElement("td"));
    const {
      table,
      editingCell,
      choosing,
      selectingZone,
      headerTopSelecting,
      headerLeftSelecting,
      copyingZone,
      cutting,
      searchQuery,
      matchingCells,
      matchingCellIndex,
      editorRef,
      showAddress,
      autofillDraggingTo,
    } = store;

    const [before, setBefore] = React.useState("");
    const matchingCell = matchingCells[matchingCellIndex];

    const selectingArea = zoneToArea(selectingZone); // (top, left) -> (bottom, right)
    const copyingArea = zoneToArea(copyingZone); // (top, left) -> (bottom, right)
    const editing = editingCell === address;
    const pointed = choosing.y === y && choosing.x === x;
    const _setEditorRect = React.useCallback(() => {
      const rect = cellRef.current.getBoundingClientRect();
      dispatch(
        setEditorRect({
          y: rect.top,
          x: rect.left,
          height: rect.height,
          width: rect.width,
        })
      );
    }, []);

    React.useEffect(() => {
      if (pointed) {
        _setEditorRect();
      }
    }, [pointed]);
    const cell = table.getByPoint({ y, x });
    const writeCell = (value: string) => {
      if (before !== value) {
        dispatch(write(value));
      }
      setBefore("");
    };

    let matching = false;
    if (searchQuery && table.stringify({ y, x }).indexOf(searchQuery) !== -1) {
      matching = true;
    }

    let errorMessage = "";
    let rendered;
    try {
      rendered = table.render({ y, x }, writeCell);
    } catch (e: any) {
      if (e instanceof FormulaError) {
        errorMessage = e.message;
        rendered = e.code;
      } else {
        errorMessage = e.message;
        rendered = "#UNKNOWN";
        console.error(e);
      }
      // TODO: debug flag
    }
    return (
      <td
        key={x}
        ref={cellRef}
        data-x={x}
        data-y={y}
        data-address={address}
        className={`gs-cell ${
          among(copyingArea, { y, x }) ? "gs-copying" : ""
        } ${
          among(selectingArea, { y, x }) ? "gs-selected" : ""
        } ${pointed ? "gs-pointed" : ""
        } ${editing ? "gs-editing" : ""
        } ${matching ? "gs-matching" : ""
        } ${matchingCell === address ? "gs-searching" : ""
        }`}
        style={{
          ...cell?.style,
          ...getCellStyle({y, x, pointed, choosing, selectingArea, copyingArea, cutting, autofillDraggingTo}),
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          dispatch(setContextMenuPosition({ y: e.clientY, x: e.clientX }));
          return false;
        }}
        onClick={(e) => {
          if (autofillDraggingTo) {
            return false;
          }
          dispatch(setContextMenuPosition({ y: -1, x: -1 }));
          if (e.shiftKey) {
            dispatch(drag({ y, x }));
          } else {
            dispatch(choose({ y, x }));
            dispatch(select({ startY: -1, startX: -1, endY: -1, endX: -1 }));
          }
          editorRef.current?.focus();
        }}
        onDoubleClick={(e) => {
          e.preventDefault();
          const dblclick = document.createEvent("MouseEvents");
          dblclick.initEvent("dblclick", true, true);
          editorRef.current?.dispatchEvent(dblclick);
          return false;
        }}
        draggable
        onDragStart={(e) => {
          if (autofillDraggingTo) {
            return false;
          }
          e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
          dispatch(choose({ y, x }));
          dispatch(select({ startY: y, startX: x, endY: y, endX: x }));
        }}
        onDragEnd={(e) => {
          if (autofillDraggingTo) {
            dispatch(drag(autofillDraggingTo));
            dispatch(setAutofillDraggingTo(null));
            return false;
          }
          const { height: h, width: w } = zoneShape(selectingZone);
          if (h + w === 0) {
            dispatch(select({ startY: -1, startX: -1, endY: -1, endX: -1 }));
          }
        }}
        onDragEnter={() => {
          if (autofillDraggingTo) {
            dispatch(setAutofillDraggingTo({x, y}));
            return false;
          }
          if (headerTopSelecting) {
            dispatch(drag({ y: table.getNumRows(), x }));
            return false;
          }
          if (headerLeftSelecting) {
            dispatch(drag({ y, x: table.getNumCols() }));
            return false;
          }
          dispatch(drag({ y, x }));
          return false;
        }}
      >
        <div className={`gs-cell-rendered-wrapper-outer`}>
          <div
            className={'gs-cell-rendered-wrapper-inner'}
            style={{
              justifyContent: cell?.justifyContent || "left",
              alignItems: cell?.alignItems || "start",
            }}
          >
            {errorMessage && (
              <div className="formula-error-triangle" title={errorMessage} />
            )}
            {showAddress && <div className="gs-cell-label">{address}</div>}
            <div className="gs-cell-rendered">{rendered}</div>
          </div>
          {((pointed && selectingArea.bottom === -1) ||
            (selectingArea.bottom === y && selectingArea.right === x)) &&
            <div
              className="gs-autofill-drag"
              draggable
              onClick={(e) => {
                //e.stopPropagation();
                //e.preventDefault();
                //return false;
              }}
              onDragStart={(e) => {
                e.dataTransfer.setDragImage(DUMMY_IMG, 0, 0);
                dispatch(setAutofillDraggingTo({x, y}));
                e.stopPropagation();
                //e.preventDefault();
                //return false;
              }}
            ></div>
          }
        </div>
      </td>
    );
  }
);


const getCellStyle = ({ y, x, pointed, choosing, selectingArea, copyingArea, cutting, autofillDraggingTo }: {
  y: number;
  x: number;
  pointed: boolean;
  choosing: PointType;
  selectingArea: AreaType;
  copyingArea: AreaType;
  cutting: boolean;
  autofillDraggingTo: PointType | null
}): React.CSSProperties => {
  const style: React.CSSProperties = {};
  if (pointed) {
    style.borderTop = "solid 2px #0077ff";
    style.borderBottom = "solid 2px #0077ff";
    style.borderLeft = "solid 2px #0077ff";
    style.borderRight = "solid 2px #0077ff";
  }
  else {
    // selecting style
    const {top, left, bottom, right} = selectingArea;
    if (top === y && left <= x && x <= right) {
      style.borderTop = "solid 1px #0077ff";
    }
    if (bottom === y && left <= x && x <= right) {
      style.borderBottom = "solid 1px #0077ff";
    }
    if (left === x && top <= y && y <= bottom) {
      style.borderLeft = "solid 1px #0077ff";
    }
    if (right === x && top <= y && y <= bottom) {
      style.borderRight = "solid 1px #0077ff";
    }
  }
  // copy or cut style
  {
    const {top, left, bottom, right} = copyingArea;
    const border = cutting ? "dotted 2px #0077ff" : "dashed 2px #0077ff";
    if (top === y && left <= x && x <= right) {
      style.borderTop = border;
    }
    if (bottom === y && left <= x && x <= right) {
      style.borderBottom = border;
    }
    if (left === x && top <= y && y <= bottom) {
      style.borderLeft = border;
    }
    if (right === x && top <= y && y <= bottom) {
      style.borderRight = border;
    }
  }
  if (autofillDraggingTo) {
    Object.assign(style, getAutofillCandidateStyle({choosing, selectingArea, autofillDraggingTo, target: {x, y}}))
  }
  return style;
};
