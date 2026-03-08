import { AddFunction } from './functions/add';
import { MinusFunction } from './functions/minus';
import { MultiplyFunction } from './functions/multiply';
import { DivideFunction } from './functions/divide';
import { SumFunction } from './functions/sum';
import { ConcatFunction } from './functions/concat';
import { EqFunction } from './functions/eq';
import { NeFunction } from './functions/ne';
import { GtFunction } from './functions/gt';
import { GteFunction } from './functions/gte';
import { LtFunction } from './functions/lt';
import { LteFunction } from './functions/lte';
import { NowFunction } from './functions/now';
import { AndFunction } from './functions/and';
import { OrFunction } from './functions/or';
import { IfFunction } from './functions/if';
import { IfErrorFunction } from './functions/iferror';
import { NotFunction } from './functions/not';
import { CountFunction } from './functions/count';
import { AbsFunction } from './functions/abs';
import { PowerFunction } from './functions/power';
import { CountaFunction } from './functions/counta';
import { AverageFunction } from './functions/average';
import { MaxFunction } from './functions/max';
import { MinFunction } from './functions/min';
import { LenFunction } from './functions/len';
import { UminusFunction } from './functions/uminus';
import type { FunctionCategory, FunctionMapping, HelpArg } from './functions/__base';

export const functions: FunctionMapping = {
  // Arithmetic & Comparison
  add: AddFunction,
  minus: MinusFunction,
  uminus: UminusFunction,
  multiply: MultiplyFunction,
  divide: DivideFunction,
  pow: PowerFunction,
  power: PowerFunction,
  concat: ConcatFunction,
  eq: EqFunction,
  ne: NeFunction,
  gt: GtFunction,
  gte: GteFunction,
  lt: LtFunction,
  lte: LteFunction,

  // Logical
  if: IfFunction,
  // @ts-expect-error iferror does not extends BaseFunction
  iferror: IfErrorFunction,
  and: AndFunction,
  or: OrFunction,
  not: NotFunction,

  // Statistics & Aggregation
  sum: SumFunction,
  max: MaxFunction,
  min: MinFunction,
  average: AverageFunction,
  count: CountFunction,
  counta: CountaFunction,

  // Text
  len: LenFunction,

  // Math
  abs: AbsFunction,

  // Time
  now: NowFunction,
};

export type FunctionHelp = {
  name: string;
  category: FunctionCategory;
  example: string;
  helpTexts: string[];
  helpArgs: HelpArg[];
};

const _functionHelpsCache = new Map<FunctionMapping, FunctionHelp[]>();

export const getFunctionHelps = (customFunctions: FunctionMapping = functions): FunctionHelp[] => {
  let helps = _functionHelpsCache.get(customFunctions);
  if (!helps) {
    helps = Object.keys(customFunctions).map((name) => {
      const FnClass = customFunctions[name];
      const instance = new FnClass({ args: [], table: {} as any });
      return {
        name: name.toUpperCase(),
        category: instance.category,
        example: instance.example,
        helpTexts: (instance as any).helpText || (instance as any).helpTexts || [],
        helpArgs: instance.helpArgs || [],
      };
    });
    _functionHelpsCache.set(customFunctions, helps);
  }
  return helps;
};
