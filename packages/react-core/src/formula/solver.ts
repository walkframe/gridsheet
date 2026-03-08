import { Pending, SOLVING, Spilling } from '../sentinels';
import { Table } from '../lib/table';
import type { Id, MatrixType, PointType, RefEvaluation } from '../types';
import { Lexer, Parser } from './evaluator';
import { FormulaError } from './formula-error';

type SolveFormulaProps = {
  value: any;
  table: Table;
  point: PointType;
  raise?: boolean;
  refEvaluation?: RefEvaluation;
  at?: Id;
};

export const solveFormula = ({ value, table, point, raise = true, refEvaluation = 'TABLE', at }: SolveFormulaProps) => {
  const [hit, cache] = table.getSolvedCache(point);
  if (hit && value == null && !SOLVING.is(cache)) {
    // spilled value
    return cache;
  }

  if (typeof value !== 'string') {
    return value;
  }
  if (refEvaluation === 'SYSTEM') {
    return value;
  }
  if (value.charAt(0) === "'") {
    return refEvaluation === 'RAW' ? value : value.substring(1);
  }
  if (value.charAt(0) !== '=') {
    return value;
  }
  if (refEvaluation === 'RAW') {
    const lexer = new Lexer(value.substring(1), { at });
    lexer.tokenize();
    return '=' + lexer.display({ table });
  }

  let solved: any = value;
  if (hit && !SOLVING.is(cache)) {
    solved = cache;
  } else {
    try {
      const lexer = new Lexer(value.substring(1), { at });
      lexer.tokenize();
      const parser = new Parser(lexer.tokens);
      const expr = parser.build();
      solved = expr?.evaluate?.({ table });
    } catch (e) {
      if (raise) {
        table.finishSolvedCache(point, e);
        throw e;
      }
      return e;
    }
  }

  if (refEvaluation === 'COMPLETE' && solved instanceof Table) {
    // Legacy Table result: unwrap to scalar (top-left cell)
    solved = solveTable({ table: solved, raise, at })[0]?.[0];
  }

  if (Spilling.is(solved)) {
    solved = table.spill(point, solved.matrix);
  } else {
    table.finishSolvedCache(point, solved);
  }
  if (Pending.is(solved)) {
    table.finishSolvedCache(point, solved);
  }
  return solved;
};

export type SolveTableProps = {
  table: Table;
  raise?: boolean;
  at?: Id;
  refEvaluation?: RefEvaluation;
};

export const solveTable = ({ table, raise = true, at, refEvaluation = 'SYSTEM' }: SolveTableProps): MatrixType => {
  const area = table.getArea();
  const matrix = table._toValueMatrix({ area, at, refEvaluation });
  return matrix.map((row, i) => {
    const y = area.top + i;
    return row.map((value, j) => {
      const x = area.left + j;
      const point = { y, x };
      const [hit, cache] = table.getSolvedCache(point);
      try {
        if (SOLVING.is(cache)) {
          throw new FormulaError('#REF!', 'References are circulating.', new Error(value as string));
        } else if (Pending.is(cache)) {
          return cache;
        } else if (FormulaError.is(cache)) {
          throw cache;
        } else if (cache != null) {
          return cache;
        }
        table.setSolvingCache(point);
        const solved = solveFormula({ value, table, point, raise, at, refEvaluation: 'COMPLETE' });
        table.finishSolvedCache(point, solved);
        return solved;
      } catch (e) {
        table.finishSolvedCache(point, e);
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
  if (Pending.is(value)) {
    return value;
  }
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
    value = solveTable({ table: value, raise, at: id })[y][x];
    if (value instanceof Table) {
      return stripTable({ value, y, x, raise, history });
    }
  }
  return value;
};
