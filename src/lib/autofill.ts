import React from "react";
import {
  isEqual
} from 'date-fns';
import {AreaType, CellsByAddressType, CellType, PointType, StoreType} from "../types";
import { Table } from "../lib/table";
import {areaShape, areaToZone, complementSelectingArea, concatAreas, createMatrix, zoneToArea} from "./structs";
import {p2a} from "./converters";
import {convertFormulaAbsolute} from "../formula/evaluator";
import {TimeDelta} from "./time";

const BORDER_AUTOFILL_DRAGGING = "dashed 1px #000000";

type Direction = "left" | "right" | "up" | "down";
type Orientation = "horizontal" | "vertical";
const DirectionMapping: {
  [key: string]: [Orientation, number]
} = {
  left: ["horizontal", -1],
  right: ["horizontal", 1],
  up: ["vertical", -1],
  down: ["vertical", 1],
};

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
    const [orientation, sign] = DirectionMapping[this.direction];
    const matrix = this.table.getMatrix({area: this.src, evaluates: false});
    const srcShape = areaShape({...this.src, base: 1});
    const dstShape = areaShape({...this.dst, base: 1});

    const diff: CellsByAddressType = {};
    if (orientation === "horizontal") {
      for (let i = 0; i < dstShape.height; i++) {
        const patterns = this.getChangePatterns(matrix[i]);
        for (let j = 0; j < dstShape.width; j++) {
          const baseCell = matrix[i % srcShape.height][j % srcShape.width];
          const x = sign > 0 ? this.dst.left + j : this.dst.right - j;
          const px = sign > 0 ? j % srcShape.width : (srcShape.width - 1 - (j % srcShape.width)) % srcShape.width;
          diff[p2a({y: this.dst.top + i, x})] = {...baseCell, value: patterns[px].next().value};
        }
      }
    } else {
      for (let i = 0; i < dstShape.width; i++) {
        const patterns = this.getChangePatterns(matrix.map((row) => row[i]));
        for (let j = 0; j < dstShape.height; j++) {
          const baseCell = matrix[i % srcShape.height][j % srcShape.width];
          const y = sign > 0 ? this.dst.top + j : this.dst.bottom - j;
          const py = sign > 0 ? j % srcShape.height : (srcShape.height - 1 - (j % srcShape.height)) % srcShape.height;
          diff[p2a({y, x: this.dst.left + i})] = {...baseCell, value: patterns[py].next().value};
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

  private suggestDirection(draggingTo: PointType): Direction {
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

  private getChangePatterns (cells: (CellType | null)[]): Generator[] {
    const result: Generator[] = [];
    const groups = groupByType(cells);
    const [orientation, sign] = DirectionMapping[this.direction];
    groups.forEach((group) => {
      const lastValue = sign > 0 ? group.last : group.first;
      switch(group.kind) {
        case "other": {
          result.push(pass(group.first));
          return;
        }
        case "formula": {
          const value = group.first;
          const table = this.table;
          function* generateFormula(){
            let slide = 0;
            const skip = cells.length * sign;
            while(true) {
              slide += skip;
              yield convertFormulaAbsolute({
                value,
                table,
                slideY: orientation === "vertical" ? slide : 0,
                slideX: orientation === "horizontal" ? slide : 0,
              });
            }
          }
          result.push(generateFormula());
          return;
        }
        case "number": {
          if (!group.equidistant) {
            result.push(pass(group.first), ...group.nexts.map((v) => pass(v)));
            return;
          }
          function* generateNumber() {
            let value = lastValue;
            const skip = group.numericDelta * sign;
            while(true) {
              value += skip;
              yield value;
            }
          }
          const g = generateNumber();
          result.push(g, ...group.nexts.map(() => g));
          return;
        }
        case "date": {
          const next = (d: Date) => {
            return sign > 0 ? group.timeDelta.add(d) : group.timeDelta.sub(d);
          }
          if (!group.equidistant) {
            result.push(pass(group.first), ...group.nexts.map((v) => pass(v)));
            return;
          }
          function* generateDate() {
            let value = lastValue;
            while(true) {
              value = next(value);
              yield new Date(value);
            }
          }
          const g = generateDate();
          result.push(g, ...group.nexts.map(() => g));
          return;
        }
        case "string+number": {
          if (!group.equidistant) {
            result.push(pass(group.first), ...group.nexts.map((v) => pass(v)));
            return;
          }
          function* generateStringNumber() {
            const {prefix} = extractStringNumber(group.first);
            const {number: lastNumber} = extractStringNumber(lastValue);
            let value = lastNumber;
            const skip = group.numericDelta * sign;
            while(true) {
              value += skip;
              yield `${prefix}${Math.abs(value)}`;
            }
          }
          const g = generateStringNumber();
          result.push(g, ...group.nexts.map(() => g));
          return;
        }
      }
    });
    return result;
  }
}

function* pass(value: any){
  while(true) {
    yield value;
  }
}

type GroupKind = "number" | "date" | "string+number" | "formula" | "other";

const StringNumberPattern = new RegExp('(.+?)(\\d+)$');

const extractStringNumber = (value: string) => {
  const match = value.match(StringNumberPattern);
  if (match) {
    const [, prefix, n] = match;
    return {prefix, number: Number(n)};
  }
  return {prefix: "", number: 0};
}

class TypedGroup {
  public timeDelta: TimeDelta = TimeDelta.create() ;
  public numericDelta: number = 0;
  public kind: GroupKind;
  public nexts: any[];
  public first: any;
  public equidistant = true;

  constructor(value: any) {
    this.first = value;
    this.nexts = [];
    this.kind = this.discriminate(value);
  }
  private discriminate(value: any): GroupKind {
    let kind = value instanceof Date ? "date" : typeof value;
    if (kind === "number" || kind === "date") {
      return kind;
    }
    if (kind === "string" && value[0] === "=") {
      return "formula";
    }
    else if (kind === "string" && value.match(StringNumberPattern)) {
      return "string+number";
    }
    return "other";
  }

  public get last() {
    if (this.nexts.length === 0) {
      return this.first;
    }
    return this.nexts[this.nexts.length - 1];
  }

  public add(value: any): TypedGroup | undefined {
    const kind = this.discriminate(value);
    if (this.kind !== kind || kind === "other" || kind === "formula") {
      return new TypedGroup(value);
    }
    if (this.nexts.length === 0) {
      switch (kind) {
        case "date": {
          this.timeDelta = new TimeDelta(value, this.first);
          break;
        }
        case "number": {
          this.numericDelta = value - this.first;
          break;
        }
        case "string+number": {
          const {prefix: prefix1, number: number1} = extractStringNumber(this.first);
          const {prefix: prefix2, number: number2} = extractStringNumber(value);
          if (prefix1 === prefix2) {
            this.numericDelta = number2 - number1;
          }
          break;
        }
      }
    }
    this.nexts.push(value);
  }

  public subdivide() {
    if (this.nexts.length === 0) {
      return [];
    }

    const news: TypedGroup[] = [];
    let lastGroup: TypedGroup = this;
    switch(this.kind) {
      case "date": {
        const eq = this.nexts.every((v, i) => i === 0 || isEqual(v, this.timeDelta.add(this.nexts[i - 1])));
        this.equidistant = eq;
        return [];
      }
      case "number": {
        const eq = this.nexts.every((v, i) => i === 0 || v === this.first + this.numericDelta * (i + 1));
        this.equidistant = eq;
        return [];
      }
      case "string+number": {
        let {prefix: basePrefix, number: baseNumber} = extractStringNumber(this.first);
        for (let i = 0; i < lastGroup.nexts.length; i++) {
          const next = lastGroup.nexts[i];
          const {prefix, number} = extractStringNumber(next);
          if (basePrefix !== prefix) {
            const nexts = this.nexts.splice(i, this.nexts.length);
            lastGroup = new TypedGroup(nexts.splice(0, 1)[0]);
            nexts.forEach(lastGroup.add.bind(lastGroup));
            news.push(lastGroup, ...lastGroup.subdivide());
            break;
          } else {
            const {number: firstNumber} = extractStringNumber(lastGroup.first);
            if (number !== firstNumber + (i + 1) * lastGroup.numericDelta) {
              lastGroup.equidistant = false;
            }
          }
        }
        break;
      }
    }

    return news;
  }
}

function groupByType(cells: (CellType | null)[]): TypedGroup[] {
  let group = new TypedGroup(cells[0]?.value);
  const groups: TypedGroup[] = [group];

  for (let i = 1; i < cells.length; i++) {
    const value = cells[i]?.value;
    const nextGroup = group.add(value);
    if (nextGroup) {
      groups.push(nextGroup);
      group = nextGroup;
    }
  }
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];
    groups.splice(i + 1, 0, ...group.subdivide());
  }
  return groups;
}
