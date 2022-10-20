import { solveMatrix, FormulaError } from "../evaluator";
import { Table } from "../../api/table";
import { BaseFunction } from "./__base";
import { ensureBoolean, ensureNumber, stripTable } from "./__utils";

export class HlookupFunction extends BaseFunction {
  example = "HLOOKUP(10003, A2:Z6, 2, FALSE)";
  helpText = [
    "Searches horizontally for the specified key in the first row of the range and returns the value of the specified cell in the same column.",
  ];
  helpArgs = [
    { name: "key", description: "Search key." },
    {
      name: "range",
      description: "A range for search",
    },
    {
      name: "index",
      description: "The index of the row in the range.",
    },
    {
      name: "is_sorted",
      description:
        "FALSE: Exact match. This is recommended. TRUE: Approximate match. Before you use an approximate match, sort your search key in ascending order. Otherwise, you may likely get a wrong return value.",
      option: true,
    },
  ];

  protected validate() {
    if (this.args.length !== 3 && this.args.length !== 4) {
      throw new FormulaError(
        "#N/A",
        "Number of arguments for HLOOKUP is incorrect."
      );
    }
    if (this.args[0] instanceof Table) {
      this.args[0] = stripTable(this.args[0], this.base as Table);
    }
    if (!(this.args[1] instanceof Table)) {
      throw new FormulaError("#REF!", "2nd argument must be range");
    }
    this.args[2] = ensureNumber(this.args[2], this.base as Table);
    this.args[3] = ensureBoolean(this.args[3], this.base as Table, true);
  }
  // @ts-ignore
  protected main(key: any, range: Table, index: number, isSorted: boolean) {
    const matrix = solveMatrix(range, this.base as Table);
    if (isSorted) {
      let last = -1;
      for (let x = 0; x <= range.getNumCols(); x++) {
        const v = matrix[0]?.[x];
        if (v != null && v <= key) {
          last = x;
        } else {
          break;
        }
      }
      if (last !== -1) {
        return matrix[index - 1]?.[last];
      }
    } else {
      for (let x = 0; x <= range.getNumCols(); x++) {
        if (matrix[0]?.[x] === key) {
          return matrix[index - 1]?.[x];
        }
      }
    }
    throw new FormulaError("#N/A", `No values found for '${key}'.`);
  }
}
