import { Special } from "../constants";
import { Table } from "../api/table";
import { MatrixType } from "../types";
import { FormulaError, Lexer, Parser } from "./evaluator";
import { p2a } from "../api/converters";

const SOLVING = new Special("solving");

export const solveFormula = ({
  value,
  table,
  raise = true,
}: {
  value: any;
  table: Table;
  raise?: boolean;
}) => {
  let solved = value;
  if (typeof value === "string") {
    if (value.charAt(0) === "=") {
      try {
        const lexer = new Lexer(value.substring(1));
        lexer.tokenize();
        const parser = new Parser(lexer.tokens);
        const expr = parser.build();
        solved = expr?.evaluate?.({ table });
      } catch (e) {
        if (raise) {
          throw e;
        }
        return null;
      }
    }
  }
  if (solved instanceof Table) {
    solved = solveTable(solved, raise)[0][0];
  }
  return solved;
};

export const solveTable = (table: Table, raise = true): MatrixType => {
  const area = table.getArea();
  return table.getMatrixFlatten({ area, evaluates: false }).map((row, i) => {
    const y = area.top + i;
    return row.map((value, j) => {
      const x = area.left + j;
      const address = p2a({ y, x });
      const cache = table.getSolvedCache(address);

      try {
        if (cache === SOLVING) {
          throw new FormulaError(
            "#RFF!",
            "References are circulating.",
            new Error(value)
          );
        } else if (cache instanceof FormulaError) {
          throw cache;
        } else if (cache != null) {
          return cache;
        }
        table.setSolvedCache(address, SOLVING);
        const solved = solveFormula({ value, table, raise });
        table.setSolvedCache(address, solved);
        return solved;
      } catch (e) {
        table.setSolvedCache(address, e);
        if (raise) {
          throw e;
        }
        return null;
      }
    });
  });
};
