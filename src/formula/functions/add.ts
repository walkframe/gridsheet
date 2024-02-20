import { FormulaError } from "../evaluator";
import { BaseFunction } from "./__base";
import {ensureNumber, stripTable} from "./__utils";
import {Table} from "../../lib/table";
import {TimeDelta} from "../../lib/time";
import {addSeconds} from "date-fns";

export class AddFunction extends BaseFunction {
  example = "ADD(2, 3)";
  helpText = [
    "Returns the sum of two numbers.",
    "This is the same as the '+' operator.",
  ];
  helpArgs = [
    { name: "value1", description: "First additive." },
    { name: "value2", description: "Second additive." },
  ];

  protected validate() {
    if (this.bareArgs.length !== 2) {
      throw new FormulaError(
        "#N/A",
        "Number of arguments for ADD is incorrect."
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
      return v1 + v2;
    }
    if (v1 instanceof Date && v2 instanceof TimeDelta) {
      return v2.add(v1);
    }
    if (v1 instanceof TimeDelta && v2 instanceof Date) {
      return v1.add(v2);
    }
    if (v1 instanceof Date && typeof v2 === "number") {
      return addSeconds(v1, v2);
    }
    if (typeof v1  === "number" && v2 instanceof Date) {
      return addSeconds(v2, v1);
    }
    if (!v1) {
      return v2;
    }
    if (!v2) {
      return v1;
    }
    throw new FormulaError(
      "#VALUE!",
      "Mismatched types for augend and addend."
    );
  }
}
