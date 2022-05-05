import { AddFunction } from "./add";
import { MinusFunction } from "./minus";
import { MultiplyFunction } from "./multiply";
import { DivideFunction } from "./divide";
import { ModFunction } from "./mod";
import { SumFunction } from "./sum";
import { ConcatFunction } from "./concat";
import { ConcatenateFunction } from "./concatenate";
import { EqFunction } from "./eq";
import { NeFunction } from "./ne";
import { GtFunction } from "./gt";
import { GteFunction } from "./gte";
import { LtFunction } from "./lt";
import { LteFunction } from "./lte";
import { NowFunction } from "./now";
import { AndFunction } from "./and";
import { OrFunction } from "./or";
import { IfFunction } from "./if";
import { NotFunction } from "./not";
import { CountFunction } from "./count";
import { CountifFunction } from "./countif";

export const mapping = {
  add: AddFunction,
  divide: DivideFunction,
  mod: ModFunction,
  minus: MinusFunction,
  multiply: MultiplyFunction,
  sum: SumFunction,
  count: CountFunction,
  countif: CountifFunction,
  concat: ConcatFunction,
  concatenate: ConcatenateFunction,
  eq: EqFunction,
  ne: NeFunction,
  gt: GtFunction,
  gte: GteFunction,
  lt: LtFunction,
  lte: LteFunction,
  and: AndFunction,
  or: OrFunction,
  if: IfFunction,
  not: NotFunction,
  now: NowFunction,
};
