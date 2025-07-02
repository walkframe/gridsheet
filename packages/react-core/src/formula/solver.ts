import { Special } from '../constants';
import { Table } from '../lib/table';
import { MatrixType, PointType, RefEvaluation } from '../types';
import { FormulaError, Lexer, Parser } from './evaluator';

const SOLVING = new Special('solving');

type SolveFormulaProps = {
  value: any;
  table: Table;
  raise?: boolean;
  refEvaluation?: RefEvaluation;
  origin: PointType;
};

export const solveFormula = ({ value, table, raise = true, refEvaluation = 'table', origin }: SolveFormulaProps) => {
  if (refEvaluation === 'system') {
    return value;
  }
  let solved = value;
  
  if (typeof value === 'string') {
    if (value.charAt(0) === '=') {
      try {
        const lexer = new Lexer(value.substring(1), { origin });
        lexer.tokenize();
        const parser = new Parser(lexer.tokens);
        if (refEvaluation === 'raw') {
          return '=' + lexer.stringifyToRef(table);
        }
        const expr = parser.build();
        solved = expr?.evaluate?.({ table });
      } catch (e) {
        table.setSolvedCache(origin, e);
        if (raise) {
          throw e;
        }
        return undefined;
      }
    }
  }
  if (refEvaluation === 'complete' && solved instanceof Table) {
    solved = solveTable({ table: solved, raise })[0][0];
  }
  table.setSolvedCache(origin, solved);
  return solved;
};

type SolveTableProps = { 
  table: Table;
  raise?: boolean;
  refEvaluation?: RefEvaluation;
}

export const solveTable = ({ table, raise = true }: SolveTableProps): MatrixType => {
  const area = table.getArea();
  return table.getFieldMatrix({ area, refEvaluation: 'system', key: 'value' }).map((row, i) => {
    const y = area.top + i;
    return row.map((value, j) => {
      const x = area.left + j;
      const point = { y, x };
      const cache = table.getSolvedCache(point);

      try {
        if (cache === SOLVING) {
          throw new FormulaError('#REF!', 'References are circulating.', new Error(value as string));
        } else if (cache instanceof FormulaError) {
          throw cache;
        } else if (cache != null) {
          return cache;
        }
        table.setSolvedCache(point, SOLVING);
        const solved = solveFormula({ value, table, raise, origin: point, refEvaluation: 'complete' });
        table.setSolvedCache(point, solved);
        return solved;
      } catch (e) {
        table.setSolvedCache(point, e);
        if (raise) {
          throw e;
        }
        return e;
      }
    });
  });
};

export const stripTable = (value: any, y = 0, x = 0, raise = true) => {
  if (value instanceof Table) {
    value = solveTable({ table: value, raise })[y][x];
  }
  if (value instanceof Table) {
    const e = new FormulaError('#REF!', 'References are circulating.');
    if (raise) {
      throw e;
    }
    return e;
  }
  return value;
};
