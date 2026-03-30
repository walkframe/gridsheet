import { Pending, SOLVING, Spilling } from '../sentinels';
import { Sheet } from '../lib/sheet';
import type { Id, MatrixType, PointType, Resolution } from '../types';
import { Lexer, Parser } from './evaluator';
import { FormulaError } from './formula-error';

export type SolveOptions = {
  raise?: boolean;
  resolution?: Resolution;
};

type SolveFormulaProps = {
  value: any;
  sheet: Sheet;
  point: PointType;
  raise?: boolean;
  resolution?: Resolution;
  at?: Id;
};

/**
 * Evaluates a single cell value (formula or literal) within the context of a sheet.
 * Handles caching, circular reference detection, spilling, and async pending states.
 * Returns the resolved scalar value (or error) for the given cell.
 */
export const solveFormula = ({ value, sheet, point, raise = true, resolution = 'RESOLVED', at }: SolveFormulaProps) => {
  const [hit, cache] = sheet.getSolvedCache(point);
  if (hit && value == null && !SOLVING.is(cache)) {
    // spilled value
    return cache;
  }

  if (typeof value !== 'string') {
    return value;
  }
  if (resolution === 'SYSTEM') {
    return value;
  }
  if (value.charAt(0) === "'") {
    return resolution === 'RAW' ? value : value.substring(1);
  }
  if (value.charAt(0) !== '=') {
    return value;
  }
  if (resolution === 'RAW') {
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

  if (Spilling.is(solved)) {
    solved = sheet.spill(point, solved.matrix);
  } else {
    sheet.finishSolvedCache(point, solved);
  }

  if (resolution === 'RESOLVED' && solved instanceof Sheet) {
    solved = stripSheet({ value: solved, raise, at });
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
};

/**
 * Evaluates all cells in a Sheet and returns the results as a 2D array (MatrixType).
 * Each cell formula is resolved in order, with caching to avoid redundant computation.
 * Use this when you need the full evaluated contents of a range.
 */
export const solveSheet = ({ sheet, raise = true, at }: SolveSheetProps): MatrixType => {
  const area = sheet.area;
  const matrix = sheet._toValueMatrix({ area, at, resolution: 'SYSTEM' });
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
        const solved = solveFormula({ value, sheet, point, raise, at, resolution: 'RESOLVED' });
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
  at?: Id;
  raise?: boolean;
};

export const stripSheet = ({ value, at, raise = true }: StripSheetProps): any => {
  if (value instanceof Sheet) {
    return value.strip({ raise, at });
  }
  return value;
};
