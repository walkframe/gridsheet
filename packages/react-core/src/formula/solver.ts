import { Pending, SOLVING, Spilling } from '../sentinels';
import { Sheet } from '../lib/sheet';
import type { Id, MatrixType, PointType, RefEvaluation } from '../types';
import { Lexer, Parser } from './evaluator';
import { FormulaError } from './formula-error';

type SolveFormulaProps = {
  value: any;
  sheet: Sheet;
  point: PointType;
  raise?: boolean;
  refEvaluation?: RefEvaluation;
  at?: Id;
};

export const solveFormula = ({ value, sheet, point, raise = true, refEvaluation = 'TABLE', at }: SolveFormulaProps) => {
  const [hit, cache] = sheet.getSolvedCache(point);
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
    return '=' + lexer.display({ sheet });
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
      solved = expr?.evaluate?.({ sheet });
    } catch (e) {
      if (raise) {
        sheet.finishSolvedCache(point, e);
        throw e;
      }
      return e;
    }
  }

  if (refEvaluation === 'COMPLETE' && solved instanceof Sheet) {
    // Legacy Sheet result: unwrap to scalar (top-left cell)
    solved = solveSheet({ sheet: solved, raise, at })[0]?.[0];
  }

  if (Spilling.is(solved)) {
    solved = sheet.spill(point, solved.matrix);
  } else {
    sheet.finishSolvedCache(point, solved);
  }
  if (Pending.is(solved)) {
    sheet.finishSolvedCache(point, solved);
  }
  return solved;
};

export type SolveSheetProps = {
  sheet: Sheet;
  raise?: boolean;
  at?: Id;
  refEvaluation?: RefEvaluation;
};

export const solveSheet = ({ sheet, raise = true, at, refEvaluation = 'SYSTEM' }: SolveSheetProps): MatrixType => {
  const area = sheet.getArea();
  const matrix = sheet._toValueMatrix({ area, at, refEvaluation });
  return matrix.map((row, i) => {
    const y = area.top + i;
    return row.map((value, j) => {
      const x = area.left + j;
      const point = { y, x };
      const [hit, cache] = sheet.getSolvedCache(point);
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
        sheet.setSolvingCache(point);
        const solved = solveFormula({ value, sheet, point, raise, at, refEvaluation: 'COMPLETE' });
        sheet.finishSolvedCache(point, solved);
        return solved;
      } catch (e) {
        sheet.finishSolvedCache(point, e);
        if (raise) {
          throw e;
        }
        return e;
      }
    });
  });
};

export type StripSheetProps = {
  value: any;
  y?: number;
  x?: number;
  raise?: boolean;
  history?: Set<Id>;
};

export const stripSheet = ({ value, y = 0, x = 0, raise = true, history = new Set() }: StripSheetProps): any => {
  if (Pending.is(value)) {
    return value;
  }
  if (value instanceof Sheet) {
    const id = value.getId({ x, y });
    if (history.has(id)) {
      const e = new FormulaError('#REF!', 'References are circulating.');
      if (raise) {
        throw e;
      }
      return e;
    }
    history.add(id);
    value = solveSheet({ sheet: value, raise, at: id })[y][x];
    if (value instanceof Sheet) {
      return stripSheet({ value, y, x, raise, history });
    }
  }
  return value;
};
