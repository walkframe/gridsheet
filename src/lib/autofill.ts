import {
  addYears, addMonths, addDays, addHours, addMinutes, addSeconds, addMilliseconds,
  subYears, subMonths, subDays, subHours, subMinutes, subSeconds, subMilliseconds,
  isEqual
} from 'date-fns';
import {AreaType, CellsByAddressType, CellType, PointType, StoreType} from "../types";
import { Table } from "../lib/table";
import React from "react";
import {areaShape, areaToZone, complementSelectingArea, concatAreas, createMatrix, zoneToArea} from "./structs";
import {p2a} from "./converters";

const ADD_FNS = [addYears, addMonths, addDays, addHours, addMinutes, addSeconds, addMilliseconds];
const SUB_FNS = [subYears, subMonths, subDays, subHours, subMinutes, subSeconds, subMilliseconds];

const BORDER_AUTOFILL_DRAGGING = "dashed 1px #000000";
const DirectionMapping: {
  [key: string]: [string, number]
} = {
  left: ["horizontal", -1],
  right: ["horizontal", 1],
  up: ["vertical", -1],
  down: ["vertical", 1],
};

type Direction = "left" | "right" | "up" | "down";

export class Autofill {
  private readonly src: AreaType;
  private readonly dst: AreaType;
  private readonly direction: Direction;
  private readonly table: Table;
  constructor(store: StoreType, draggingTo: PointType) {
    const { table, choosing, selectingZone } = store;
    this.src = complementSelectingArea(zoneToArea(selectingZone), choosing);
    this.direction = this.suggestDirection(draggingTo);
    this.dst = this.getDestinationArea(draggingTo);
    this.table = table;
  }

  public get applied(): Table {
    const [orientation, sign] = DirectionMapping[this.direction as string];

    const matrix = this.table.getMatrix({area: this.src, evaluates: false});
    const srcSize = areaShape({...this.src, base: 1});
    const dstSize = areaShape({...this.dst, base: 1});

    const diff: CellsByAddressType = {};
    if (orientation === "horizontal") {
      for (let i = 0; i < dstSize.height; i++) {
        const gens = getPattern(matrix[i], this.table, sign);
        for (let j = 0; j < dstSize.width; j++) {
          const x = sign > 0 ? this.dst.left + j : this.dst.right - j;
          diff[p2a({y: this.dst.top + i, x})] = {value: gens[j % srcSize.width].next().value};
        }
      }
    } else {
      for (let i = 0; i < dstSize.width; i++) {
        const gens = getPattern(matrix.map((row) => row[i]), this.table, sign);
        for (let j = 0; j < dstSize.height; j++) {
          const y = sign > 0 ? this.dst.top + j : this.dst.bottom - j;
          diff[p2a({y, x: this.dst.left + i})] = {value: gens[j % srcSize.height].next().value};
        }
      }
    }
    const table = this.table.update({
      diff,
      reflection: {
        selectingZone: areaToZone(this.src),
      }
    })
    return table;
  }

  public get wholeArea() {
    return concatAreas(this.src, this.dst);
  }

  public getCellStyle(target: PointType) {
    const {x, y} = target;
    const style: React.CSSProperties = {};
    const {top, left, bottom, right} = this.src;

    switch (this.direction) {
      case "left": {
        if (this.dst.left <= x && x <= this.dst.right) {
          if (top === y) {
            style.borderTop = BORDER_AUTOFILL_DRAGGING;
          }
          if (bottom === y - 1) {
            style.borderTop = BORDER_AUTOFILL_DRAGGING;
          }
        }
        if (this.dst.left === x && top <= y && y <= bottom) {
          style.borderLeft = BORDER_AUTOFILL_DRAGGING;
        }
        break;
      }
      case "right": {
        if (this.dst.left <= x && x <= this.dst.right) {
          if (top === y) {
            style.borderTop = BORDER_AUTOFILL_DRAGGING;
          }
          if (bottom === y - 1) {
            style.borderTop = BORDER_AUTOFILL_DRAGGING;
          }
        }
        if (this.dst.right === x - 1 && top <= y && y <= bottom) {
          style.borderLeft = BORDER_AUTOFILL_DRAGGING;
        }
        break;
      }

      case "up": {
        if (this.dst.top <= y && y <= this.dst.bottom) {
          if (left === x) {
            style.borderLeft = BORDER_AUTOFILL_DRAGGING;
          }
          if (right === x - 1) {
            style.borderLeft = BORDER_AUTOFILL_DRAGGING;
          }
        }
        if (this.dst.top === y && left <= x && x <= right) {
          style.borderTop = BORDER_AUTOFILL_DRAGGING;
        }
        break;
      }
      case "down": {
        if (this.dst.top <= y && y <= this.dst.bottom) {
          if (left === x) {
            style.borderLeft = BORDER_AUTOFILL_DRAGGING;
          }
          if (right === x - 1) {
            style.borderLeft = BORDER_AUTOFILL_DRAGGING;
          }
        }
        if (this.dst.bottom === y - 1 && left <= x && x <= right) {
          style.borderTop = BORDER_AUTOFILL_DRAGGING;
        }
        break;
      }
    }
    return style;
  }

  private getDestinationArea(autofillDraggingTo: PointType): AreaType {
    const {x, y} = autofillDraggingTo;
    const {top, left, bottom, right} = this.src;
    switch (this.direction) {
      case "left":
        return {top, bottom, left: x, right: left - 1}
      case "right":
        return {top, bottom, left: right + 1, right: x};
      case "up":
        return {left, right, top: y, bottom: top - 1};
      case "down":
        return {left, right, top: bottom + 1, bottom: y};
    }
    return this.src;
  }

  suggestDirection(draggingTo: PointType): Direction {
    const {top, left, bottom, right} = this.src;
    let horizontal = 0, vertical = 0;
    if (draggingTo.x < left) {
      horizontal = draggingTo.x - left;
    }
    else if (draggingTo.x > right) {
      horizontal = draggingTo.x - right;
    }
    if (draggingTo.y < top) {
      vertical = draggingTo.y - top
    }
    else if (draggingTo.y > bottom) {
      vertical = draggingTo.y - bottom;
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
    return "down";
  };

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
    switch(type) {
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
        const next = (d: Date, sign=1) => {
          diff.forEach((n, i) => {
            d = (sign > 0 ? ADD_FNS : SUB_FNS)[i](d, n);
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

function groupByType(values: (CellType | null)[]): GroupedValues[] {
  const result: GroupedValues[] = [];

  let currentGroup: GroupedValues | null = null;

  for (const cell of values) {
    const value = cell?.value;
    let valueType = value instanceof Date ? "date" : typeof value;

    if (valueType === "string" && value[0] === "=") {
      valueType = "formula";
    }

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

