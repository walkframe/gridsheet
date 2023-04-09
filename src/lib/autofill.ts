import {AreaType, PointType} from "../types";
import React from "react";

const complementSelectingArea = (selectingArea: AreaType, choosing: PointType) => {
  if (selectingArea.left === -1) {
    selectingArea = {left: choosing.x, top: choosing.y, right: choosing.x, bottom: choosing.y};
  }
  return selectingArea;
}

const suggestDirection = (
  {
  choosing,
  selectingArea,
  autofillDraggingTo,
}: {
  choosing: PointType;
  selectingArea: AreaType;
  autofillDraggingTo: PointType;
}) => {
  const {top, left, bottom, right} = complementSelectingArea(selectingArea, choosing);
  let horizontal = 0, vertical = 0;
  if (autofillDraggingTo.x < left) {
    horizontal = autofillDraggingTo.x - left;
  }
  else if (autofillDraggingTo.x > right) {
    horizontal = autofillDraggingTo.x - right;
  }
  if (autofillDraggingTo.y < top) {
    vertical = autofillDraggingTo.y - top
  }
  else if (autofillDraggingTo.y > bottom) {
    vertical = autofillDraggingTo.y - bottom;
  }
  // diagonal
  if (Math.abs(horizontal) > 0 && Math.abs(vertical) > 0) {
    if (Math.abs(horizontal) > Math.abs(vertical)) {
      return horizontal < 0 ? "left" : "right";
    }
    return vertical < 0 ? "up" : "down";
  }
  if (horizontal !== 0) {
    return horizontal < 0 ? "left" : "right";
  }
  if (vertical !== 0 ) {
    return vertical < 0 ? "up" : "down";
  }
};

export const getAutofillCandidateStyle = ({
  choosing,
  selectingArea,
  target,
  autofillDraggingTo,
}: {
  choosing: PointType;
  selectingArea: AreaType;
  target: PointType;
  autofillDraggingTo: PointType;
}) => {
  const style: React.CSSProperties = {};
  const {x, y} = target;
  selectingArea = complementSelectingArea(selectingArea, choosing);
  const {top, left, bottom, right} = selectingArea;
  const direction = suggestDirection({choosing, selectingArea, autofillDraggingTo});
  const dashed = "dashed 1px #000000";
  switch (direction) {
    case "left": {
      if (autofillDraggingTo.x <= x && x < left) {
        if (top === y) {
          style.borderTop = dashed;
        }
        if (bottom === y - 1) {
          style.borderTop = dashed;
        }
      }
      if (autofillDraggingTo.x === x && top <= y && y <= bottom) {
        style.borderLeft = dashed;
      }
      break;
    }
    case "right": {
      if (right < x && x <= autofillDraggingTo.x) {
        if (top === y) {
          style.borderTop = dashed;
        }
        if (bottom === y - 1) {
          style.borderTop = dashed;
        }
      }
      if (autofillDraggingTo.x === x - 1 && top <= y && y <= bottom) {
        style.borderLeft = dashed;
      }
      break;
    }

    case "up": {
      if (autofillDraggingTo.y <= y && y < top) {
        if (left === x) {
          style.borderLeft = dashed;
        }
        if (right === x - 1) {
          style.borderLeft = dashed;
        }
      }
      if (autofillDraggingTo.y === y && left <= x && x <= right) {
        style.borderTop = dashed;
      }
      break;
    }
    case "down": {
      if (bottom < y && y <= autofillDraggingTo.y) {
        if (left === x) {
          style.borderLeft = dashed;
        }
        if (right === x - 1) {
          style.borderLeft = dashed;
        }
      }
      if (autofillDraggingTo.y === y - 1 && left <= x && x <= right) {
        style.borderTop = dashed;
      }
      break;
    }
  }
  return style;
};