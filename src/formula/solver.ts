import { Special } from "../constants";
import { Table } from "../api/table";
import { MatrixType } from "../types";
import { FormulaError, Lexer, Parser } from "./evaluator";

const SOLVING = new Special("solving");

export const solveFormula = ({
  value,
  base,
  raise = true,
}: {
  value: any;
  base: Table;
  raise?: boolean;
}) => {
  let solved = value;
  if (typeof value === "string") {
    if (value.charAt(0) === "=") {
      const cache = base.getSolvedCache(value);

      try {
        if (cache === SOLVING) {
          throw new FormulaError(
            "#RFF!",
            "References are circulating.",
            new Error(value)
          );
        } else if (cache != null) {
          return cache;
        }
        const lexer = new Lexer(value.substring(1));
        lexer.tokenize();
        const parser = new Parser(lexer.tokens);
        const expr = parser.build();
        base.setSolvedCache(value, SOLVING);
        solved = expr?.evaluate?.({ base });
      } catch (e) {
        base.setSolvedCache(value, e);
        if (raise) {
          throw e;
        }
        solved = null;
      }
    }
  }
  if (solved instanceof Table) {
    solved = solveTable(solved)[0][0];
  }
  base.setSolvedCache(value, solved);
  return solved;
};

export const solveTable = (table: Table): MatrixType => {
  const area = table.getArea();
  return table.getMatrixFlatten({ area, evaluates: false }).map((row) => {
    return row.map((value) => {
      const solved = solveFormula({ value, base: table.getBase() });
      return solved;
    });
  });
};
