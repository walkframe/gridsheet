// DO NOT COPY THIS CODE FOR THE OTHER.

import { Table } from "../../api/table";
import { FormulaError } from "../evaluator";

export class IfErrorFunction {
  example = 'IFERROR(A1, "Error in cell A1")';
  helpText = [
    "Returns the first argument if it is not an error value, otherwise returns the second argument if present, or a blank if the second argument is absent.",
  ];
  helpArgs = [
    {
      name: "value",
      description: "The value to return if value itself is not an error.",
    },
    {
      name: "value_if_error",
      description: "The value the function returns if value is an error.",
      optional: true,
    },
  ];

  constructor(public args: any[], public base: Table) {
    this.args = args;
    this.base = base;
  }

  protected validate() {
    if (this.args.length === 1 || this.args.length === 2) {
      return;
    }
    throw new FormulaError(
      "#N/A",
      "Number of arguments for IFERROR is incorrect. 1 or 2 argument(s) must be specified."
    );
  }

  public call() {
    this.validate();
    const [value, valueIfError] = this.args;
    try {
      return value.evaluate(this.base);
    } catch (e) {
      return valueIfError ? valueIfError.evaluate(this.base) : null;
    }
  }
}
