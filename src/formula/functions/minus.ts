import {
  subSeconds,
} from 'date-fns';

import { FormulaError } from "../evaluator";
import { TimeDelta } from "../../lib/time";
import { BaseFunction } from "./__base";
import {ensureNumber, stripTable} from "./__utils";
import {Table} from "../../lib/table";

export class MinusFunction extends BaseFunction {
  example = "MINUS(8, 3)";
  helpText = [
    "Returns the difference of two numbers.",
    "This is the same as the '-' operator.",
  ];
  helpArgs = [
    { name: "value1", description: "A number that will be subtracted." },
    { name: "value2", description: "A number that will subtract from value1." },
  ];

  protected validate() {
    if (this.bareArgs.length !== 2) {
      throw new FormulaError(
        "#N/A",
        "Number of arguments for MINUS is incorrect."
      );
    }
    this.bareArgs = this.bareArgs.map((arg) => {
      if (arg instanceof Table) {
        arg = stripTable(arg, 0, 0);
      }
      return typeof arg === "object" ? arg : ensureNumber(arg);
    });
  }

  protected main(v1: number | Date | TimeDelta, v2: number | Date | TimeDelta) {
    if (typeof v1 === "number" && typeof v2 === "number") {
      return v1 - v2;
    }
    if (v1 instanceof Date && v2 instanceof Date) {
      return new TimeDelta(v1, v2);
    }
    if (v1 instanceof Date && v2 instanceof TimeDelta) {
      return v2.sub(v1);
    }
    if (v1 instanceof TimeDelta && v2 instanceof Date) {
      return v1.sub(v2);
    }
    if (v1 instanceof Date && typeof v2 === "number") {
      return subSeconds(v1, v2);
    }
    throw new FormulaError(
      "#VALUE!",
      "Mismatched types for minuend and subtrahend."
    );
  }
}
