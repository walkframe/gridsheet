import { Special } from '../constants';
import { Table } from '../lib/table';
import { MatrixType, PointType } from '../types';
import { FormulaError, Lexer, Parser } from './evaluator';
import { p2a } from '../lib/converters';

const SOLVING = new Special('solving');

type SolveFormulaType = {
  value: any;
  table: Table;
  raise?: boolean;
  evaluates?: boolean | null;
  origin?: PointType;
};

export const solveFormula = ({ value, table, raise = true, evaluates = true, origin }: SolveFormulaType) => {
  if (evaluates === null) {
    return value;
  }
  let solved = value;
  if (typeof value === 'string') {
    if (value.charAt(0) === '=') {
      try {
        const lexer = new Lexer(value.substring(1), { origin });
        lexer.tokenize();
        const parser = new Parser(lexer.tokens);
        if (evaluates === false) {
          return '=' + lexer.stringifyToRef(table);
        }
        const expr = parser.build();
        solved = expr?.evaluate?.({ table });
      } catch (e) {
        if (raise) {
          throw e;
        }
        return undefined;
      }
    }
  }
  if (solved instanceof Table) {
    solved = solveTable({ table: solved, raise })[0][0];
  }
  return solved;
};

export const solveTable = ({ table, raise = true }: { table: Table; raise?: boolean }): MatrixType => {
  const area = table.getArea();
  return table.getMatrixFlatten({ area, evaluates: null }).map((row, i) => {
    const y = area.top + i;
    return row.map((value, j) => {
      const x = area.left + j;
      const address = p2a({ y, x });
      const cache = table.getSolvedCache(address);

      try {
        if (cache === SOLVING) {
          throw new FormulaError('#REF!', 'References are circulating.', new Error(value as string));
        } else if (cache instanceof FormulaError) {
          throw cache;
        } else if (cache != null) {
          return cache;
        }
        table.setSolvedCache(address, SOLVING);
        const solved = solveFormula({ value, table, raise, origin: { y, x } });
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
