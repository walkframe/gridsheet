import { Special } from '../constants';
import { Table } from '../lib/table';
import { Id, MatrixType, PointType, RefEvaluation } from '../types';
import { FormulaError, Lexer, Parser } from './evaluator';

const SOLVING = new Special('solving');

type SolveFormulaProps = {
  value: any;
  table: Table;
  raise?: boolean;
  refEvaluation?: RefEvaluation;
  origin: PointType;
};

export const solveFormula = ({ value, table, raise = true, refEvaluation = 'TABLE', origin }: SolveFormulaProps) => {
  if (refEvaluation === 'SYSTEM') {
    return value;
  }
  let solved = value;

  if (typeof value === 'string') {
    if (value.charAt(0) === '=') {
      try {
        const lexer = new Lexer(value.substring(1), { origin });
        lexer.tokenize();
        const parser = new Parser(lexer.tokens);
        if (refEvaluation === 'RAW') {
          return '=' + lexer.display({ table });
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
  if (refEvaluation === 'COMPLETE' && solved instanceof Table) {
    solved = solveTable({ table: solved, raise })[0][0];
  } else {
    table.setSolvedCache(origin, solved);
  }
  return solved;
};

type SolveTableProps = {
  table: Table;
  raise?: boolean;
  refEvaluation?: RefEvaluation;
};

export const solveTable = ({ table, raise = true }: SolveTableProps): MatrixType => {
  const area = table.getArea();
  return table.getFieldMatrix({ area, refEvaluation: 'SYSTEM', field: 'value' }).map((row, i) => {
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
        const solved = solveFormula({ value, table, raise, origin: point, refEvaluation: 'COMPLETE' });
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

export type StripTableProps = {
  value: any;
  y?: number;
  x?: number;
  raise?: boolean;
  history?: Set<Id>;
};

export const stripTable = ({ value, y = 0, x = 0, raise = true, history = new Set() }: StripTableProps): any => {
  if (value instanceof Table) {
    const id = value.getId({ x, y });
    if (history.has(id)) {
      const e = new FormulaError('#REF!', 'References are circulating.');
      if (raise) {
        throw e;
      }
      return e;
    }
    history.add(id);
    value = solveTable({ table: value, raise })[y][x];
    if (value instanceof Table) {
      return stripTable({ value, y, x, raise, history });
    }
  }
  return value;
};
