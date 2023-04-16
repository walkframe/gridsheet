import {
  addYears, addMonths, addDays, addHours, addMinutes, addSeconds, addMilliseconds,
  subYears, subMonths, subDays, subHours, subMinutes, subSeconds, subMilliseconds,
  isEqual
} from 'date-fns';
import {AreaType, CellsByAddressType, CellType, PointType} from "../types";
import { Table } from "../lib/table";
import React from "react";
import {areaShape, areaToZone, createMatrix} from "./structs";
import {p2a} from "./converters";

export const complementSelectingArea = (selectingArea: AreaType, choosing: PointType) => {
  if (selectingArea.left === -1) {
    selectingArea = {left: choosing.x, top: choosing.y, right: choosing.x, bottom: choosing.y};
  }
  return selectingArea;
}

const suggestDirection = (
  {
  choosing,
  selecting,
  autofillDraggingTo,
}: {
  choosing: PointType;
  selecting: AreaType;
  autofillDraggingTo: PointType;
}) => {
  const {top, left, bottom, right} = complementSelectingArea(selecting, choosing);
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

export const getAutofillDestinationArea = ({
  choosing,
  selecting,
  autofillDraggingTo,
}: {
  choosing: PointType;
  selecting: AreaType;
  autofillDraggingTo: PointType;
}): AreaType => {
  selecting = complementSelectingArea(selecting, choosing);
  const direction = suggestDirection({choosing, selecting, autofillDraggingTo});
  const {x, y} = autofillDraggingTo;
  const {top, left, bottom, right} = selecting;
  switch (direction) {
    case "left":
      return {top, bottom, left: x, right: left - 1}
    case "right":
      return {top, bottom, left: right + 1, right: x};
    case "up":
      return {left, right, top: y, bottom: top - 1};
    case "down":
      return {left, right, top: bottom + 1, bottom: y};
  }
  return selecting;
}


const DirectionMapping: {
  [key: string]: [string, number]
} = {
  left: ["horizontal", -1],
  right: ["horizontal", 1],
  up: ["vertical", -1],
  down: ["vertical", 1],
}



const BORDER_AUTOFILL_DRAGGING = "dashed 1px #000000";

export const getAutofillCandidateStyle = ({
  choosing,
  selecting,
  target,
  autofillDraggingTo,
}: {
  choosing: PointType;
  selecting: AreaType;
  target: PointType;
  autofillDraggingTo: PointType;
}) => {
  selecting = complementSelectingArea(selecting, choosing);
  const dst = getAutofillDestinationArea({choosing, selecting, autofillDraggingTo});
  const {x, y} = target;
  const style: React.CSSProperties = {};

  const {top, left, bottom, right} = selecting;
  const direction = suggestDirection({choosing, selecting, autofillDraggingTo});

  switch (direction) {
    case "left": {
      if (dst.left <= x && x <= dst.right) {
        if (top === y) {
          style.borderTop = BORDER_AUTOFILL_DRAGGING;
        }
        if (bottom === y - 1) {
          style.borderTop = BORDER_AUTOFILL_DRAGGING;
        }
      }
      if (dst.left === x && top <= y && y <= bottom) {
        style.borderLeft = BORDER_AUTOFILL_DRAGGING;
      }
      break;
    }
    case "right": {
      if (dst.left <= x && x <= dst.right) {
        if (top === y) {
          style.borderTop = BORDER_AUTOFILL_DRAGGING;
        }
        if (bottom === y - 1) {
          style.borderTop = BORDER_AUTOFILL_DRAGGING;
        }
      }
      if (dst.right === x - 1 && top <= y && y <= bottom) {
        style.borderLeft = BORDER_AUTOFILL_DRAGGING;
      }
      break;
    }

    case "up": {
      if (dst.top <= y && y <= dst.bottom) {
        if (left === x) {
          style.borderLeft = BORDER_AUTOFILL_DRAGGING;
        }
        if (right === x - 1) {
          style.borderLeft = BORDER_AUTOFILL_DRAGGING;
        }
      }
      if (dst.top === y && left <= x && x <= right) {
        style.borderTop = BORDER_AUTOFILL_DRAGGING;
      }
      break;
    }
    case "down": {
      if (dst.top <= y && y <= dst.bottom) {
        if (left === x) {
          style.borderLeft = BORDER_AUTOFILL_DRAGGING;
        }
        if (right === x - 1) {
          style.borderLeft = BORDER_AUTOFILL_DRAGGING;
        }
      }
      if (dst.bottom === y - 1 && left <= x && x <= right) {
        style.borderTop = BORDER_AUTOFILL_DRAGGING;
      }
      break;
    }
  }
  return style;
};

export const applyAutofillToTable = ({
  table,
  choosing,
  src,
  autofillDraggingTo,
}: {
  table: Table;
  choosing: PointType;
  src: AreaType;
  autofillDraggingTo: PointType;
}): Table => {
  const dst = getAutofillDestinationArea({choosing, selecting: src, autofillDraggingTo});
  const direction = suggestDirection({choosing, selecting: src, autofillDraggingTo});
  const [orientation, sign] = DirectionMapping[direction as string];

  const matrix = table.getMatrix({area: src, evaluates: false});
  const srcSize = areaShape({...src, base: 1});
  const dstSize = areaShape({...dst, base: 1});

  const diff: CellsByAddressType = {};
  if (orientation === "horizontal") {
    for (let i = 0; i < dstSize.height; i++) {
      const gens = getPattern(matrix[i], table, sign);
      for (let j = 0; j < dstSize.width; j++) {
        const x = sign > 0 ? dst.left + j : dst.right - j;
        diff[p2a({y: dst.top + i, x})] = {value: gens[j % srcSize.width].next().value};
      }
    }
  } else {
    for (let i = 0; i < dstSize.width; i++) {
      const gens = getPattern(matrix.map((row) => row[i]), table, sign);
      for (let j = 0; j < dstSize.height; j++) {
        const y = sign > 0 ? dst.top + j : dst.bottom - j;
        diff[p2a({y, x: dst.left + i})] = {value: gens[j % srcSize.height].next().value};
      }
    }
  }
  table = table.update({
    diff,
    reflection: {
      selectingZone: areaToZone(src),
    }
  })

  return table;
}


function* pass(value: any){
  while(true) {
    yield value;
  }
}

function* arithmeticNumbers(initial: number, diff: number) {
  let value = initial;
  while(true) {
    value += diff;
    yield value;

  }
}

const getPattern = (
  cells: (CellType | null)[],
  table: Table,
  sign: number,
): Generator[] => {
  const result: Generator[] = [];
  const groupedValues = groupByType(cells);
  groupedValues.forEach((grouped) => {
    const { type, values } = grouped;
    if (values.length === 1) {
      result.push(pass(values[0]));
      return;
    }
    const lastIndex = sign > 0 ? values.length - 1 : 0;
    switch(grouped.type) {
      case "string": {
        result.push(...values.map((v) => pass(v)));
        break;
      }
      case "number": {
        const diff = values[1] - values[0];
        const match = values.every((v, i) => v === values[0] + diff * i);
        if (match) {
          const g = arithmeticNumbers(values[lastIndex], diff * sign);
          result.push(...values.map(() => g));
        } else {
          result.push(...values.map((v) => pass(v)));
        }
        break;
      }
      case "date": {
        const diff = [
          (values[1].getFullYear() - values[0].getFullYear()),
          (values[1].getMonth() - values[0].getMonth()),
          (values[1].getDate() - values[0].getDate()),
          (values[1].getHours() - values[0].getHours()),
          (values[1].getMinutes() - values[0].getMinutes()),
          (values[1].getSeconds() - values[0].getSeconds()),
          (values[1].getMilliseconds() - values[0].getMilliseconds()),
        ];
        const add = [addYears, addMonths, addDays, addHours, addMinutes, addSeconds, addMilliseconds];
        const sub = [subYears, subMonths, subDays, subHours, subMinutes, subSeconds, subMilliseconds];
        const next = (d: Date, sign=1) => {
          diff.forEach((n, i) => {
            d = (sign > 0 ? add : sub)[i](d, n);
          });
          return d;
        }
        const match = values.every((v, i) => i === 0 || isEqual(v, next(values[i - 1])));
        if (match) {
          function* arithmeticDates(initial: Date) {
            let value = initial;
            while(true) {
              value = next(value, sign);
              yield new Date(value);
            }
          }
          const g = arithmeticDates(values[lastIndex]);
          result.push(...values.map(() => g));
        } else {
          result.push(...values.map((v) => pass(v)));
        }
        break;
      }
      default: {
        result.push(...values.map((v) => pass(v)));
      }
    }
  });
  return result;
}

type GroupedValues = { type: string; values: any[] };

function isDate(value: any): value is Date {
  return value instanceof Date;
}


function groupByType(values: (CellType | null)[]): GroupedValues[] {
  const result: GroupedValues[] = [];

  let currentGroup: GroupedValues | null = null;

  for (const cell of values) {
    const value = cell?.value;
    const valueType = isDate(value) ? "date" : typeof value;

    if (
      currentGroup &&
      (valueType === "number" || valueType === "string" || valueType === "date") &&
      currentGroup.type === valueType
    ) {
      currentGroup.values.push(value);
    } else {
      if (currentGroup) {
        result.push(currentGroup);
      }

      currentGroup =
        valueType === "number" || valueType === "string" || valueType === "date"
          ? { type: valueType, values: [value] }
          : null;

      if (currentGroup === null) {
        result.push({ type: valueType, values: [value] });
      }
    }
  }

  if (currentGroup) {
    result.push(currentGroup);
  }

  return result;
}

